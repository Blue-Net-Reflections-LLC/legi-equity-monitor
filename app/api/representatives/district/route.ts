import { NextRequest, NextResponse } from "next/server";
import sql from '@/lib/db';

/**
 * API endpoint to get representatives for a district
 * This queries the database for representatives based on state and district
 */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const district = url.searchParams.get('district');

  if (!state || !district) {
    return NextResponse.json(
      { error: 'State and district parameters are required' },
      { status: 400 }
    );
  }

  try {
    // Get current representatives (both House and Senate)
    const reps = await sql`
      WITH CurrentReps AS (
        SELECT 
          p.people_id,
          p.name,
          p.district,
          p.party_id,
          p.votesmart_id,
          p.updated,
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE 
                WHEN p.district = ${`SD-${state}`} THEN NULL 
                ELSE p.district 
              END
            ORDER BY p.updated DESC
          ) as rank
        FROM ls_people p
        WHERE 
          p.state_id = 52  -- US Congress
          AND (
            -- For House reps, match exact district
            p.district = ${`HD-${state}-${district}`}
            -- For Senators, include if requesting any district in the state
            OR p.district = ${`SD-${state}`}
          )
      )
      SELECT 
        cr.people_id,
        cr.name,
        cr.party_id,
        cr.district,
        cr.votesmart_id
      FROM CurrentReps cr
      WHERE 
        (cr.district = ${`SD-${state}`} AND cr.rank <= 2)
        OR (cr.district != ${`SD-${state}`} AND cr.rank = 1)
      ORDER BY 
        CASE WHEN cr.district = ${`SD-${state}`} THEN 0 ELSE 1 END,
        cr.district,
        cr.updated DESC
    `;

    // Array to store formatted representatives
    const representatives = [];

    // Process each representative
    for (const rep of reps) {
      // Get bills for this representative
      const positiveBills = await sql`
        SELECT 
          b.bill_id,
          b.bill_number,
          b.title,
          ba.overall_positive_impact_score,
          ba.overall_bias_score,
          bs.sponsor_type_id = 1 as is_primary
        FROM 
          ls_bill b
        JOIN 
          ls_bill_sponsor bs ON b.bill_id = bs.bill_id
        JOIN 
          bill_analysis_results ba ON b.bill_id = ba.bill_id
        WHERE 
          bs.people_id = ${rep.people_id}
          AND bs.sponsor_type_id = 1  -- Primary sponsor
          AND b.bill_type_id = 1  -- Only return bills of type 1
        ORDER BY 
          ba.overall_positive_impact_score DESC
        LIMIT 2
      `;

      const biasBills = await sql`
        SELECT 
          b.bill_id,
          b.bill_number,
          b.title,
          ba.overall_positive_impact_score,
          ba.overall_bias_score,
          bs.sponsor_type_id = 1 as is_primary
        FROM 
          ls_bill b
        JOIN 
          ls_bill_sponsor bs ON b.bill_id = bs.bill_id
        JOIN 
          bill_analysis_results ba ON b.bill_id = ba.bill_id
        WHERE 
          bs.people_id = ${rep.people_id}
          AND bs.sponsor_type_id = 1  -- Primary sponsor
          AND b.bill_type_id = 1  -- Only return bills of type 1
        ORDER BY 
          ba.overall_bias_score DESC
        LIMIT 2
      `;

      // Combine bills
      let bills = [...positiveBills, ...biasBills];

      // If no primary sponsored bills, try co-sponsored
      if (bills.length === 0) {
        const coBills = await sql`
          SELECT 
            b.bill_id,
            b.bill_number,
            b.title,
            ba.overall_positive_impact_score,
            ba.overall_bias_score,
            bs.sponsor_type_id = 1 as is_primary
          FROM 
            ls_bill b
          JOIN 
            ls_bill_sponsor bs ON b.bill_id = bs.bill_id
          JOIN 
            bill_analysis_results ba ON b.bill_id = ba.bill_id
          WHERE 
            bs.people_id = ${rep.people_id}
            AND bs.sponsor_type_id != 1  -- Not primary sponsor
            AND b.bill_type_id = 1  -- Only return bills of type 1
          ORDER BY 
            ba.overall_positive_impact_score DESC
          LIMIT 4
        `;

        bills = coBills;
      }

      // Format representative data
      representatives.push({
        id: rep.people_id.toString(),
        name: rep.name,
        party: rep.party_id,
        state: state,
        district: rep.district.includes('SD-') ? 'Senate' : district,
        chamber: rep.district.includes('SD-') ? 'senate' : 'house',
        role: rep.district.includes('SD-') ? 'Senator' : 'Representative',
        office: rep.district.includes('SD-') ? "Senate" : "House of Representatives",
        phone: "",
        website: "",
        socialMedia: {
          twitter: "",
          facebook: ""
        },
        votesmart_id: rep.votesmart_id ? rep.votesmart_id.toString() : null,
        bills: bills.map(bill => ({
          id: bill.bill_id.toString(),
          title: bill.title,
          number: bill.bill_number,
          positiveScore: parseFloat(bill.overall_positive_impact_score),
          biasScore: parseFloat(bill.overall_bias_score),
          isPrimary: bill.is_primary
        }))
      });
    }

    return NextResponse.json({ representatives });
  } catch (error) {
    console.error('Error processing congressional representatives request:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
} 