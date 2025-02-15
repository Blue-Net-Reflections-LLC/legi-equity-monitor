import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { removeStopwords } from 'stopword'

const defaultLimit = 25
export async function POST(request: Request) {
  try {
    const { keyword, embedding } = await request.json()
    
    // Remove stopwords and get meaningful tokens
    const meaningfulWords = removeStopwords(keyword.toLowerCase().split(' '))

    if (keyword.length > 0 && meaningfulWords.length === 0) {
      //
      return NextResponse.json({
        results: [],
        search_type: 'no_results'
      })
    }
    
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
                'bill_id', bill.bill_id,
                'bill_number', bill.bill_number,
                'bill_type', bill.bill_type_abbr,
                'title', bill.title,
                'description', bill.description,
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
                'party_name', pa.party_name,
                'district', p.district,
                'body_name', ro.role_name,
                'state_abbr', e.state_abbr,
                'state_name', e.state_name,
                'votesmart_id', p.votesmart_id
              )
            WHEN e.entity_type = 'blog_post' THEN
              json_build_object(
                'post_id', bp.post_id,
                'title', bp.title,
                'slug', bp.slug,
                'main_image', bp.main_image,
                'published_at', bp.published_at,
                'state_abbr', e.state_abbr,
                'state_name', e.state_name
              )
          END as item_data
        FROM ranked e
        LEFT JOIN lsv_bill bill ON e.entity_type = 'bill' AND e.entity_id = bill.bill_id AND bill.bill_type_id = 1
        LEFT JOIN ls_committee c ON bill.pending_committee_id = c.committee_id
        LEFT JOIN ls_bill_history h ON bill.bill_id = h.bill_id 
          AND h.history_step = (SELECT MAX(history_step) FROM ls_bill_history WHERE bill_id = bill.bill_id)
        LEFT JOIN ls_people p ON e.entity_type = 'sponsor' AND e.entity_id = p.people_id
        LEFT JOIN ls_party pa ON p.party_id = pa.party_id
        LEFT JOIN ls_role ro ON p.role_id = ro.role_id
        LEFT JOIN blog_posts bp ON e.entity_type = 'blog_post' AND e.entity_uuid = bp.post_id
      )
    `

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
        WHERE ${tokens}
        AND (vi.entity_type != 'bill' OR (vi.entity_type = 'bill' AND bill.bill_type_id = 1))
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
          word_similarity($1, search_text) AS similarity
        FROM pre_filtered
        WHERE word_similarity($1, search_text) > 0.1
      ),
      ${entityDataCTE}
      SELECT * FROM entity_data
      ORDER BY 
        CASE entity_type 
          WHEN 'sponsor' THEN 1
          WHEN 'blog_post' THEN 2
          WHEN 'bill' THEN 3
        END,
        similarity DESC
      LIMIT ${defaultLimit};
    `

    let results = Array.from(await db.unsafe(trigramQuery, [keyword]))

    // If trigram results are less than defaultLimit and we have an embedding, get remaining results
    if (results.length < defaultLimit && embedding) {
      const remainingLimit = defaultLimit - results.length
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
            1 - (vi.embedding <=> '${vectorString}'::vector) as similarity
          FROM vector_index vi
          LEFT JOIN lsv_bill bill ON vi.entity_type = 'bill' AND vi.entity_id = bill.bill_id
          WHERE vi.embedding IS NOT NULL
          AND (vi.entity_type != 'bill' OR (vi.entity_type = 'bill' AND bill.bill_type_id = 1))
          AND vi.entity_id NOT IN (${existingIds.length ? existingIds.join(',') : 0})
          ORDER BY vi.embedding <=> '${vectorString}'::vector
          LIMIT ${remainingLimit}
        ),
        ${entityDataCTE}
        SELECT * FROM entity_data
        ORDER BY 
          CASE entity_type 
            WHEN 'sponsor' THEN 1
            WHEN 'blog_post' THEN 2
            WHEN 'bill' THEN 3
          END,
          similarity DESC;
      `
      const embeddingResults = Array.from(await db.unsafe(embeddingQuery))
      
      if (embeddingResults.length > 0) {
        searchType = 'hybrid'
        results = [...results, ...embeddingResults]
      } 
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