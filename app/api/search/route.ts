import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { removeStopwords } from 'stopword'

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json()
    
    // Remove stopwords and get meaningful tokens
    const meaningfulWords = removeStopwords(keyword.toLowerCase().split(' '))
    
    // Generate ILIKE conditions for each meaningful word
    const tokens = meaningfulWords
      .map((word: string) => `search_text ILIKE '%${word}%'`)
      .join(' AND ')

    // Optimized hybrid search query
    const query = `
      WITH pre_filtered AS (
        -- Step 1: Tokenize the phrase and apply ILIKE for flexible matching
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
        -- Step 2: Compute strict word similarity only on pre-filtered matches
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
      -- Step 3: Final ranking and limit
      SELECT * FROM ranked
      ORDER BY similarity DESC
      LIMIT 10;
    `

    const results = await db.unsafe(query, [keyword])

    return NextResponse.json({ 
      results: results 
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
} 