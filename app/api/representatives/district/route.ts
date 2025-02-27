import { NextRequest, NextResponse } from "next/server";
import postgres from 'postgres';

/**
 * API endpoint to get representatives for a district
 * This queries the database for representatives based on state and district
 */

// Initialize database connection
const sql = postgres(process.env.LEGISCAN_DB_URL || '');

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Extract parameters from query 
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const district = url.searchParams.get("district");
  
  // Validate parameters
  if (!state) {
    return NextResponse.json(
      { error: "State parameter is required" },
      { status: 400 }
    );
  }
  
  try {
    // Array to store representatives
    const representatives = [];
    
    // Get the state information from state abbreviation
    const stateQuery = sql`
      SELECT state_id, state_abbr
      FROM ls_state 
      WHERE state_abbr = ${state.toUpperCase()}
    `;
    
    const stateResult = await stateQuery;
    
    if (stateResult.length === 0) {
      return NextResponse.json(
        { error: "Invalid state code" },
        { status: 400 }
      );
    }
    
    const stateId = stateResult[0].state_id;
    const stateAbbr = stateResult[0].state_abbr;
    
    // Query for House representative if district is provided
    if (district) {
      // Format district with leading zeros (e.g., "006")
      const formattedDistrict = district.padStart(3, '0');
      const districtCode = `HD-${formattedDistrict}`;
      
      // Query for House representative
      const houseReps = await sql`
        SELECT 
          p.people_id,
          p.name,
          p.party_id,
          p.state_id,
          p.district,
          'house' as chamber,
          'Representative' as role
        FROM 
          ls_people p
        WHERE 
          p.district = ${districtCode}
          AND p.state_id = 52  -- 52 is US Congress based on the schema
        LIMIT 1
      `;
      
      // Process house representative
      if (houseReps.length > 0) {
        const rep = houseReps[0];
        
        // Query for top bills by positive impact
        const positiveBills = await sql`
          SELECT 
            b.bill_id,
            b.bill_number,
            b.title,
            ba.overall_positive_impact_score as impact_score,
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
          ORDER BY 
            ba.overall_positive_impact_score DESC
          LIMIT 2
        `;
        
        // Query for top bills by bias
        const biasBills = await sql`
          SELECT 
            b.bill_id,
            b.bill_number,
            b.title,
            ba.overall_bias_score as impact_score,
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
          ORDER BY 
            ba.overall_bias_score DESC
          LIMIT 2
        `;
        
        // Combine bills
        const bills = [...positiveBills, ...biasBills];
        
        // If no primary sponsored bills, try co-sponsored
        if (bills.length === 0) {
          const coBills = await sql`
            SELECT 
              b.bill_id,
              b.bill_number,
              b.title,
              ba.overall_positive_impact_score as impact_score,
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
            ORDER BY 
              ba.overall_positive_impact_score DESC
            LIMIT 4
          `;
          
          bills.push(...coBills);
        }
        
        // Format representative data
        representatives.push({
          id: rep.people_id.toString(),
          name: rep.name,
          party: rep.party_id,
          state: stateAbbr,
          district: district,
          chamber: 'house',
          role: 'Representative',
          office: "U.S. House of Representatives",
          phone: "", 
          website: "",
          socialMedia: {
            twitter: "",
            facebook: ""
          },
          bills: bills.map(bill => ({
            id: bill.bill_id.toString(),
            title: bill.title,
            number: bill.bill_number,
            impactScore: parseFloat(bill.impact_score),
            isPrimary: bill.is_primary
          }))
        });
      }
    }
    
    // Query for Senators based on state
    // Use the state abbreviation for the district pattern
    const senateDistrictPattern = `SD-${stateAbbr}`;
    
    const senators = await sql`
      SELECT 
        p.people_id,
        p.name,
        p.party_id,
        p.state_id,
        p.district,
        'senate' as chamber,
        'Senator' as role
      FROM 
        ls_people p
      WHERE 
        p.district = ${senateDistrictPattern}
        AND p.state_id = 52  -- 52 is US Congress based on the schema
      ORDER BY 
        p.name
      LIMIT 2
    `;
    
    // Process senators
    for (const senator of senators) {
      // Query for top bills by positive impact
      const positiveBills = await sql`
        SELECT 
          b.bill_id,
          b.bill_number,
          b.title,
          ba.overall_positive_impact_score as impact_score,
          bs.sponsor_type_id = 1 as is_primary
        FROM 
          ls_bill b
        JOIN 
          ls_bill_sponsor bs ON b.bill_id = bs.bill_id
        JOIN 
          bill_analysis_results ba ON b.bill_id = ba.bill_id
        WHERE 
          bs.people_id = ${senator.people_id}
          AND bs.sponsor_type_id = 1  -- Primary sponsor
        ORDER BY 
          ba.overall_positive_impact_score DESC
        LIMIT 2
      `;
      
      // Query for top bills by bias
      const biasBills = await sql`
        SELECT 
          b.bill_id,
          b.bill_number,
          b.title,
          ba.overall_bias_score as impact_score,
          bs.sponsor_type_id = 1 as is_primary
        FROM 
          ls_bill b
        JOIN 
          ls_bill_sponsor bs ON b.bill_id = bs.bill_id
        JOIN 
          bill_analysis_results ba ON b.bill_id = ba.bill_id
        WHERE 
          bs.people_id = ${senator.people_id}
          AND bs.sponsor_type_id = 1  -- Primary sponsor
        ORDER BY 
          ba.overall_bias_score DESC
        LIMIT 2
      `;
      
      // Combine bills
      const bills = [...positiveBills, ...biasBills];
      
      // If no primary sponsored bills, try co-sponsored
      if (bills.length === 0) {
        const coBills = await sql`
          SELECT 
            b.bill_id,
            b.bill_number,
            b.title,
            ba.overall_positive_impact_score as impact_score,
            bs.sponsor_type_id = 1 as is_primary
          FROM 
            ls_bill b
          JOIN 
            ls_bill_sponsor bs ON b.bill_id = bs.bill_id
          JOIN 
            bill_analysis_results ba ON b.bill_id = ba.bill_id
          WHERE 
            bs.people_id = ${senator.people_id}
            AND bs.sponsor_type_id != 1  -- Not primary sponsor
          ORDER BY 
            ba.overall_positive_impact_score DESC
          LIMIT 4
        `;
        
        bills.push(...coBills);
      }
      
      // Format senator data
      representatives.push({
        id: senator.people_id.toString(),
        name: senator.name,
        party: senator.party_id,
        state: stateAbbr,
        district: "Senate",
        chamber: 'senate',
        role: 'Senator',
        office: "U.S. Senate",
        phone: "", 
        website: "",
        socialMedia: {
          twitter: "",
          facebook: ""
        },
        bills: bills.map(bill => ({
          id: bill.bill_id.toString(),
          title: bill.title,
          number: bill.bill_number,
          impactScore: parseFloat(bill.impact_score),
          isPrimary: bill.is_primary
        }))
      });
    }
    
    // Return the results
    return NextResponse.json({ representatives });
  } catch (error) {
    console.error("Error processing district representatives request:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  } finally {
    // Close the database connection
    await sql.end();
  }
} 