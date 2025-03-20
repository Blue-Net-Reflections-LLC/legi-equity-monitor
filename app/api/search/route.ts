import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { removeStopwords } from 'stopword'
import { entityDataCTE, mapResults, DatabaseRow } from './sql/common'

const defaultLimit = 25
export async function POST(request: Request) {
  try {
    const { keyword, embedding, page = 1 } = await request.json()
    const offset = (page - 1) * defaultLimit
    
    // Remove stopwords and get meaningful tokens
    const meaningfulWords = removeStopwords(keyword.toLowerCase().split(' '))

    if (keyword.length > 0 && meaningfulWords.length === 0) {
      return NextResponse.json({
        results: [],
        search_type: 'no_results',
        has_more: false,
        page
      })
    }
    
    // Generate ILIKE conditions for each meaningful word
    const tokens = meaningfulWords
      .map((word: string) => `search_text ILIKE '%${word}%'`)
      .join(' AND ')

    let searchType = 'trigram'
    // Try trigram search first with pre-filtering
    const trigramQuery = `
      WITH pre_filtered AS (
        SELECT 
          vi.entity_type,
          vi.entity_id,
          vi.entity_uuid,
          vi.search_text,
          vi.state_abbr,
          vi.state_name
        FROM vector_index vi
        LEFT JOIN lsv_bill bill ON vi.entity_type = 'bill' AND vi.entity_id = bill.bill_id
        LEFT JOIN bill_analysis_results bar ON vi.entity_type = 'bill' AND vi.entity_id = bar.bill_id
        WHERE ${tokens}
        AND (vi.entity_type != 'bill' OR (vi.entity_type = 'bill' AND bill.bill_type_id = 1 AND bar.bill_id IS NOT NULL))
        ORDER BY LENGTH(vi.search_text) ASC
        LIMIT 1000
      ),
      ranked AS (
        SELECT 
          entity_type,
          entity_id,
          entity_uuid,
          search_text,
          state_abbr,
          state_name,
          word_similarity($1, search_text) AS similarity,
          'trigram' as source
        FROM pre_filtered
        WHERE word_similarity($1, search_text) > 0.1
      ),
      ${entityDataCTE}
      SELECT e.*, r.source FROM entity_data e
      JOIN ranked r ON r.entity_type = e.entity_type AND r.entity_id = e.entity_id
      ORDER BY 
        CASE e.entity_type 
          WHEN 'sponsor' THEN 1
          WHEN 'blog_post' THEN 2
          WHEN 'bill' THEN 3
        END,
        e.similarity DESC
      OFFSET ${offset}
      LIMIT ${defaultLimit + 1};
    `

    let results = Array.from(await db.unsafe(trigramQuery, [keyword]))
    let has_more = results.length > defaultLimit
    results = results.slice(0, defaultLimit)

    // If we have an embedding, get embedding results
    if (embedding) {
      const vectorString = `[${embedding.join(',')}]`
      
      const existingIds = results.map(r => r.entity_id);

      const embeddingQuery = `
        WITH ranked AS (
          SELECT 
            vi.entity_type,
            vi.entity_id,
            vi.search_text,
            vi.state_abbr,
            vi.state_name,
            vi.entity_uuid,
            1 - (vi.embedding <=> '${vectorString}'::vector) as similarity,
            'embedding' as source
          FROM vector_index vi
          LEFT JOIN lsv_bill bill ON vi.entity_type = 'bill' AND vi.entity_id = bill.bill_id
          LEFT JOIN bill_analysis_results bar ON vi.entity_type = 'bill' AND vi.entity_id = bar.bill_id
          WHERE vi.embedding IS NOT NULL
          AND (vi.entity_type != 'bill' OR (vi.entity_type = 'bill' AND bill.bill_type_id = 1 AND bar.bill_id IS NOT NULL))
          AND vi.entity_id NOT IN (${existingIds.length ? existingIds.join(',') : 0})
          AND (1 - (vi.embedding <=> '${vectorString}'::vector)) > 0.30
          ORDER BY vi.embedding <=> '${vectorString}'::vector
          OFFSET ${offset}
          LIMIT ${defaultLimit + 1}
        ),
        ${entityDataCTE}
        SELECT e.*, r.source FROM entity_data e
        JOIN ranked r ON r.entity_type = e.entity_type AND r.entity_id = e.entity_id
        ORDER BY 
          CASE e.entity_type 
            WHEN 'sponsor' THEN 1
            WHEN 'blog_post' THEN 2
            WHEN 'bill' THEN 3
          END,
          e.similarity DESC;
      `
      const embeddingResults = Array.from(await db.unsafe(embeddingQuery))
      
      if (embeddingResults.length > 0) {
        searchType = 'hybrid'
        results = [...results, ...embeddingResults]
        has_more = has_more || embeddingResults.length > defaultLimit
        results = results.slice(0, defaultLimit)
      } 
    }

    return NextResponse.json({ 
      results: mapResults(results as unknown as DatabaseRow[]),
      search_type: searchType,
      has_more,
      page
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
} 