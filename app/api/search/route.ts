import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { removeStopwords } from 'stopword'

export async function POST(request: Request) {
  try {
    const { keyword, embedding } = await request.json()
    
    // Remove stopwords and get meaningful tokens
    const meaningfulWords = removeStopwords(keyword.toLowerCase().split(' '))
    
    // Generate ILIKE conditions for each meaningful word
    const tokens = meaningfulWords
      .map((word: string) => `search_text ILIKE '%${word}%'`)
      .join(' AND ')

    let searchType = 'trigram';
    // Try trigram search first
    const trigramQuery = `
      WITH pre_filtered AS (
        SELECT 
          entity_type, 
          entity_id, 
          search_text, 
          state_abbr, 
          state_name
        FROM vector_index
        WHERE ${tokens}
        ORDER BY LENGTH(search_text) ASC
      ),
      ranked AS (
        SELECT 
          entity_type,
          entity_id,
          search_text,
          state_abbr,
          state_name,
          strict_word_similarity($1, search_text) AS similarity
        FROM pre_filtered
        WHERE strict_word_similarity($1, search_text) > 0.1
      )
      SELECT * FROM ranked
      ORDER BY similarity DESC
      LIMIT 10;
    `

    let results = await db.unsafe(trigramQuery, [keyword])

    // If no results, fall back to embeddings for AI powered search
    if (results.length === 0 && embedding) {
      const vectorString = `[${embedding.join(',')}]`
      const embeddingQuery = `
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
        LIMIT 10;
      `
      results = await db.unsafe(embeddingQuery)
      searchType = results.length > 0 ? 'embedding' : 'no_results';
    }

    return NextResponse.json({ 
      results: results,
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