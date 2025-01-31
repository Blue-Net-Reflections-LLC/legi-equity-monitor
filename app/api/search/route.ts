import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { removeStopwords } from 'stopword'

export async function POST(request: Request) {
  try {
    const { keyword, embedding } = await request.json()
    
    // Remove stopwords and get meaningful tokens
    const meaningfulWords = removeStopwords(keyword.toLowerCase().split(' '))
    
    // Common entity data selection
    const entityDataCTE = `
      entity_data AS (
        SELECT 
          e.entity_type,
          e.entity_id,
          e.similarity,
          CASE 
            WHEN e.entity_type = 'bill' THEN 
              json_build_object(
                'bill_id', b.bill_id,
                'bill_number', b.bill_number,
                'bill_type', b.bill_type_abbr,
                'title', b.title,
                'description', b.description,
                'committee_name', c.committee_name,
                'last_action', h.history_action,
                'last_action_date', h.history_date,
                'state_abbr', e.state_abbr,
                'state_name', e.state_name
              )
            WHEN e.entity_type = 'sponsor' THEN
              json_build_object(
                'people_id', p.people_id,
                'first_name', split_part(p.name, ' ', 1),
                'last_name', array_to_string(array_remove(string_to_array(p.name, ' '), split_part(p.name, ' ', 1)), ' '),
                'name', p.name,
                'party', pa.party_abbr,
                'district', p.district,
                'role', ro.role_name,
                'state_abbr', e.state_abbr,
                'state_name', e.state_name
              )
          END as item_data
        FROM ranked e
        LEFT JOIN lsv_bill b ON e.entity_type = 'bill' AND e.entity_id = b.bill_id
        LEFT JOIN ls_committee c ON b.pending_committee_id = c.committee_id
        LEFT JOIN ls_bill_history h ON b.bill_id = h.bill_id 
          AND h.history_step = (SELECT MAX(history_step) FROM ls_bill_history WHERE bill_id = b.bill_id)
        LEFT JOIN ls_people p ON e.entity_type = 'sponsor' AND e.entity_id = p.people_id
        LEFT JOIN ls_party pa ON p.party_id = pa.party_id
        LEFT JOIN ls_role ro ON p.role_id = ro.role_id
      )
    `

    // Generate ILIKE conditions for each meaningful word
    const tokens = meaningfulWords
      .map((word: string) => `search_text ILIKE '%${word}%'`)
      .join(' AND ')

    let searchType = 'trigram'
    // Try trigram search first
    const trigramQuery = `
      WITH ranked AS (
        SELECT 
          entity_type,
          entity_id,
          search_text,
          state_abbr,
          state_name,
          word_similarity($1, search_text) AS similarity
        FROM vector_index
        WHERE ${tokens}
        AND word_similarity($1, search_text) > 0.1
        ORDER BY LENGTH(search_text) ASC
      ),
      ${entityDataCTE}
      SELECT * FROM entity_data
      ORDER BY similarity DESC
      LIMIT 10;
    `

    let results = await db.unsafe(trigramQuery, [keyword])

    // If no results, fall back to embeddings
    if (results.length === 0 && embedding) {
      const vectorString = `[${embedding.join(',')}]`
      const embeddingQuery = `
        WITH ranked AS (
          SELECT 
            entity_type,
            entity_id,
            search_text,
            state_abbr,
            state_name,
            1 - (embedding <=> '${vectorString}'::vector) as similarity
          FROM vector_index
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> '${vectorString}'::vector
          LIMIT 10
        ),
        ${entityDataCTE}
        SELECT * FROM entity_data
        ORDER BY similarity DESC;
      `
      results = await db.unsafe(embeddingQuery)
      searchType = results.length > 0 ? 'embedding' : 'no_results'
    }

    return NextResponse.json({ 
      results: results.map(r => ({
        type: r.entity_type,
        similarity: r.similarity,
        item: r.item_data
      })),
      search_type: searchType
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
} 