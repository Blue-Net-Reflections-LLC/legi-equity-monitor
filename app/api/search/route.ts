import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { keyword, embedding } = await request.json()

    const query = `
      SELECT 
        *,
        GREATEST(
          title <-> $1,
          description <-> $1
        ) as similarity
      FROM bills
      WHERE title % $1 OR description % $1
      ORDER BY similarity ASC
      LIMIT 100;
    `

    console.log(query)
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