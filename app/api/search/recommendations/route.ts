import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { z } from 'zod'
import { entityDataCTE, mapResults } from '../sql/common'

// Define exclusion schema
const exclusionSchema = z.object({
  entity_type: z.enum(['bill', 'sponsor', 'blog_post']),
  entity_id: z.union([
    z.number(),
    z.string().uuid()  // For blog post UUIDs
  ])
})

// Validate request body
const requestSchema = z.object({
  embeddings: z.array(z.array(z.number())),  // Array of embedding vectors
  entity_type: z.enum(['bill', 'sponsor', 'blog_post']).optional(),
  limit: z.number().min(1).max(20).default(4),
  offset: z.number().min(0).default(0),
  exclude: z.array(exclusionSchema).optional()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validationResult = requestSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { embeddings, entity_type, limit, offset, exclude } = validationResult.data
    
    // Convert embeddings to array of vector strings
    const vectorStrings = embeddings.map(emb => `'[${emb.join(',')}]'::vector`).join(', ')

    // Build exclusion conditions
    let exclusionConditions = ''
    if (exclude?.length) {
      const conditions = exclude.map(ex => {
        if (ex.entity_type === 'blog_post') {
          return `NOT (vi.entity_type = 'blog_post' AND vi.entity_uuid = '${ex.entity_id}'::uuid)`
        } else {
          return `NOT (vi.entity_type = '${ex.entity_type}' AND vi.entity_id = ${ex.entity_id})`
        }
      })
      exclusionConditions = `AND (${conditions.join(' AND ')})`
    }

    const recommendationsQuery = `
      WITH embedding_vectors AS (
        SELECT unnest(ARRAY[${vectorStrings}]) as vec
      ),
      ranked AS (
        SELECT 
          vi.entity_type,
          vi.entity_id,
          vi.search_text,
          vi.state_abbr,
          vi.state_name,
          vi.entity_uuid,
          MAX(1 - (vi.embedding <=> ev.vec)) as similarity,
          'embedding' as source
        FROM vector_index vi
        CROSS JOIN embedding_vectors ev
        LEFT JOIN lsv_bill bill ON vi.entity_type = 'bill' AND vi.entity_id = bill.bill_id
        WHERE vi.embedding IS NOT NULL
        AND (vi.entity_type != 'bill' OR (vi.entity_type = 'bill' AND bill.bill_type_id = 1))
        ${entity_type ? `AND vi.entity_type = '${entity_type}'` : ''}
        ${exclusionConditions}
        GROUP BY 
          vi.entity_type,
          vi.entity_id,
          vi.search_text,
          vi.state_abbr,
          vi.state_name,
          vi.entity_uuid
        HAVING MAX(1 - (vi.embedding <=> ev.vec)) > 0.3
        ORDER BY similarity DESC
        OFFSET ${offset}
        LIMIT ${limit}
      ),
      ${entityDataCTE}
      SELECT e.*, r.source FROM entity_data e
      JOIN ranked r ON r.entity_type = e.entity_type AND r.entity_id = e.entity_id
      ORDER BY e.similarity DESC;
    `

    const recommendations = Array.from(await db.unsafe(recommendationsQuery))

    return NextResponse.json({ 
      results: mapResults(recommendations)
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
} 