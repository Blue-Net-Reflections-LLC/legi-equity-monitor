import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * API endpoint to get state representatives by district
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Extract parameters
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const senateDistrict = url.searchParams.get('senateDistrict');
  const houseDistrict = url.searchParams.get('houseDistrict');
  
  if (!state) {
    return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
  }
  
  if (!senateDistrict && !houseDistrict) {
    return NextResponse.json({ error: 'At least one district parameter is required' }, { status: 400 });
  }
  
  try {
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
    
    // Array to store representatives
    const representatives = [];
    
    // Query for state senate representative if senate district is provided
    if (senateDistrict) {
      // Format district with leading zeros (e.g., "006")
      const formattedDistrict = senateDistrict.padStart(3, '0');
      const districtCode = `SD-${formattedDistrict}`;
      
      // Query for state senate representative
      const stateSenatorsReps = await sql`
        SELECT 
          p.people_id,
          p.name,
          p.party_id,
          p.state_id,
          p.district,
          p.votesmart_id,
          'senate' as chamber,
          'State Senator' as role
        FROM 
          ls_people p
        WHERE 
          p.state_id = ${stateId}
          AND p.district = ${districtCode}
        LIMIT 1
      `;
      
      // Process state senate representative
      if (stateSenatorsReps.length > 0) {
        const rep = stateSenatorsReps[0];
        
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
            AND b.bill_type_id = 1  -- Only return bills of type 1
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
            AND b.bill_type_id = 1  -- Only return bills of type 1
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
              AND b.bill_type_id = 1  -- Only return bills of type 1
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
          district: senateDistrict,
          chamber: 'senate',
          role: 'State Senator',
          office: "State Senate",
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
            impactScore: parseFloat(bill.impact_score),
            isPrimary: bill.is_primary
          }))
        });
      }
    }
    
    // Query for state house representative if house district is provided
    if (houseDistrict) {
      // Format district with leading zeros (e.g., "006")
      const formattedDistrict = houseDistrict.padStart(3, '0');
      const districtCode = `HD-${formattedDistrict}`;
      
      // Query for state house representative
      const stateHouseReps = await sql`
        SELECT 
          p.people_id,
          p.name,
          p.party_id,
          p.state_id,
          p.district,
          p.votesmart_id,
          'house' as chamber,
          'State Representative' as role
        FROM 
          ls_people p
        WHERE 
          p.state_id = ${stateId}
          AND p.district = ${districtCode}
        LIMIT 1
      `;
      
      // Process state house representative
      if (stateHouseReps.length > 0) {
        const rep = stateHouseReps[0];
        
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
            AND b.bill_type_id = 1  -- Only return bills of type 1
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
            AND b.bill_type_id = 1  -- Only return bills of type 1
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
              AND b.bill_type_id = 1  -- Only return bills of type 1
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
          district: houseDistrict,
          chamber: 'house',
          role: 'State Representative',
          office: "State House of Representatives",
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
            impactScore: parseFloat(bill.impact_score),
            isPrimary: bill.is_primary
          }))
        });
      }
    }
    
    // Return the results
    return NextResponse.json({ representatives });
  } catch (error) {
    console.error('Error fetching state representatives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state representatives' },
      { status: 500 }
    );
  }
}