import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Get unique committees, excluding null and empty values
    const committees = await sql`
      SELECT DISTINCT committee_name
      FROM bills
      WHERE committee_name IS NOT NULL 
        AND committee_name != ''
        AND committee_name != 'Unknown'
      ORDER BY committee_name ASC
    `;

    // Get unique categories from the JSONB array of objects
    const categories = await sql`
      WITH RECURSIVE
        categories_array AS (
          SELECT jsonb_array_elements(inferred_categories) as category
          FROM bills
          WHERE inferred_categories IS NOT NULL
        )
      SELECT DISTINCT (category->>'category') as category
      FROM categories_array
      WHERE category->>'category' IS NOT NULL
      ORDER BY category ASC
    `;

    // Log the results for debugging
    console.log('Found committees:', committees.map(c => c.committee_name));
    console.log('Found categories:', categories.map(c => c.category));

    return NextResponse.json({
      committees: committees.map(c => c.committee_name).filter(Boolean),
      categories: categories.map(c => c.category).filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
} 