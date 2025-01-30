import { NextResponse } from 'next/server'
import { MOCK_RESULTS } from './mockData'

export async function POST(request: Request) {
  try {
    const { keyword, embedding } = await request.json()

    // For now, just return all mock results sorted by similarity
    // Later, this will be replaced with actual search logic using the embedding
    return NextResponse.json({ 
      results: MOCK_RESULTS.sort((a, b) => b.similarity - a.similarity) 
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
} 