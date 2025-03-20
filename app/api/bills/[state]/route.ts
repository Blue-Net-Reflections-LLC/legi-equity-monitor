import { type NextRequest } from 'next/server'
import db from "@/lib/db"
import type { BillFilters } from "@/app/types/filters"

export const revalidate = 3600 // Cache for 1 hour

export async function GET(
  req: NextRequest,
  { params }: { params: { state: string } }
) {
  const stateCode = params.state.toUpperCase()
  const searchParams = new URL(req.url).searchParams

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 12
  const offset = (page - 1) * pageSize

  // Parse category filters
  const categoryFilters = searchParams.getAll('category')
    .filter(Boolean)
    .map(categoryId => {
      const impactType = searchParams.get(`impact_${categoryId}`)
      const validImpactType = (impactType === 'POSITIVE' || impactType === 'BIAS' || impactType === 'NEUTRAL') 
        ? impactType as 'POSITIVE' | 'BIAS' | 'NEUTRAL'
        : undefined

      return {
        id: categoryId,
        impactTypes: validImpactType ? [validImpactType] : [] as ('POSITIVE' | 'BIAS' | 'NEUTRAL')[]
      }
    })
    
  console.log('Category Filters:', JSON.stringify(categoryFilters))

  const filters = {
    committee: searchParams.getAll('committee').filter(Boolean).length > 0 
      ? searchParams.getAll('committee').filter(Boolean)
      : undefined,
    categories: categoryFilters,
    party: searchParams.get('party'),
    support: searchParams.get('support') as 'HAS_SUPPORT' | 'NO_SUPPORT' | undefined,
  }
  
  console.log('All Filters:', JSON.stringify(filters))

  // Prepare committee names for filtering - escape SQL special characters
  const committeeNamesArray = filters.committee?.map(name => 
    `'${name.replace(/'/g, "''")}'`
  ).join(',') || '';
  
  console.log('Filters prepared')

  // Optimized query using string concatenation to avoid parameter conflicts
  const result = await db`
    WITH state_bills AS (
      -- Fast index lookup to get only the bills we need by state and type first
      SELECT b.bill_id
      FROM ls_bill b
      JOIN ls_state s ON b.state_id = s.state_id
      JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id  -- Only include analyzed bills
      ${filters.committee?.length ? db`
      JOIN ls_committee c ON b.pending_committee_id = c.committee_id
      ` : db``}
      WHERE s.state_abbr = ${stateCode}
      -- Only filter by bill_type_id for state bills, not for US Congress
      ${stateCode !== 'US' ? db`AND b.bill_type_id = 1` : db``}
      ${filters.committee?.length ? db`
      AND c.committee_name = ANY(ARRAY[${db.unsafe(committeeNamesArray)}])
      ` : db``}
    ),
    filtered_bills AS (
      -- Apply all filters to the state bills
      SELECT DISTINCT sb.bill_id
      FROM state_bills sb
      ${filters.party ? db`
      JOIN ls_bill_sponsor bs ON sb.bill_id = bs.bill_id AND bs.sponsor_order = 1
      JOIN ls_people p ON bs.people_id = p.people_id
      JOIN ls_party party ON p.party_id = party.party_id
      ` : db``}
      WHERE 1=1
      ${filters.party ? db`AND party.party_abbr = ${filters.party}` : db``}
      ${filters.categories && filters.categories.length > 0 
        ? filters.categories.map(cat => db`
          AND EXISTS (
            SELECT 1
            FROM bill_analysis_results bar
            JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
            WHERE bar.bill_id = sb.bill_id
            AND bacs.category = ${cat.id}
            ${cat.impactTypes.includes('BIAS') ? db`
              AND bacs.bias_score >= bacs.positive_impact_score
              AND bacs.bias_score >= 0.60
            ` : cat.impactTypes.includes('POSITIVE') ? db`
              AND bacs.positive_impact_score > bacs.bias_score
              AND bacs.positive_impact_score >= 0.60
            ` : cat.impactTypes.length ? db`
              AND (
                bacs.bias_score < 0.60
                AND bacs.positive_impact_score < 0.60
              )
            ` : db``}
          )
        `)
        : db``
      }
      ${filters.support === 'HAS_SUPPORT' 
        ? db`AND (SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = sb.bill_id) >= 2` 
        : filters.support === 'NO_SUPPORT'
        ? db`AND (SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = sb.bill_id) < 2`
        : db``
      }
    ),
    -- Get history dates for just these bills
    bill_history AS (
      SELECT
        h.bill_id,
        MAX(h.history_date) as latest_action_date
      FROM filtered_bills fb
      JOIN ls_bill_history h ON fb.bill_id = h.bill_id
      GROUP BY h.bill_id
    ),
    -- Get our filtered page of bills
    paged_bills AS (
      SELECT 
        fb.bill_id,
        COALESCE(bh.latest_action_date, '1970-01-01'::date) as latest_action_date
      FROM filtered_bills fb
      LEFT JOIN bill_history bh ON fb.bill_id = bh.bill_id
      ORDER BY latest_action_date DESC NULLS LAST, fb.bill_id DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    )
    -- Get complete bill data
    SELECT
      b.bill_id, b.bill_number, b.status_id, b.body_id, b.current_body_id,
      b.title, b.description, b.pending_committee_id, b.legiscan_url, b.state_url,
      st.state_id, st.state_abbr, st.state_name,
      t.bill_type_id, t.bill_type_name, t.bill_type_abbr,
      s.session_id, s.session_name,
      b1.body_name as body_name,
      b2.body_name as current_body_name,
      COALESCE(p.progress_desc, 'Introduced') as status_desc,
      pb.latest_action_date,
      c.committee_name as pending_committee_name,
      c.committee_id as pending_committee_id,
      (
        SELECT json_agg(json_build_object(
          'people_id', sp.people_id,
          'party', pa.party_name, 
          'type', CASE WHEN sp.sponsor_order = 1 THEN 'Primary' ELSE 'Co' END
        ))
        FROM ls_bill_sponsor sp
        JOIN ls_people pe ON sp.people_id = pe.people_id
        JOIN ls_party pa ON pe.party_id = pa.party_id
        WHERE sp.bill_id = b.bill_id
      ) as sponsors,
      (
        -- Analysis data
        SELECT 
          CASE WHEN bar.bill_id IS NOT NULL THEN
            json_build_object(
              'overall_score', CASE 
                WHEN bar.overall_positive_impact_score >= bar.overall_bias_score 
                THEN bar.overall_positive_impact_score * 100
                ELSE bar.overall_bias_score * 100
              END,
              'overall_sentiment', CASE 
                WHEN bar.overall_positive_impact_score >= bar.overall_bias_score 
                THEN 'POSITIVE' 
                ELSE 'NEGATIVE'
              END,
              'bias_detected', bar.overall_bias_score >= 0.6,
              'categories', (
                -- Category scores
                SELECT json_object_agg(
                  category,
                  json_build_object(
                    'score', CASE 
                      WHEN positive_impact_score >= bias_score THEN positive_impact_score * 100
                      ELSE bias_score * 100
                    END,
                    'sentiment', CASE 
                      WHEN positive_impact_score >= bias_score THEN 'POSITIVE'
                      ELSE 'NEGATIVE'
                    END
                  )
                )
                FROM bill_analysis_category_scores
                WHERE analysis_id = bar.analysis_id
              )
            )
          ELSE NULL END
        FROM bill_analysis_results bar
        WHERE bar.bill_id = b.bill_id
        LIMIT 1
      ) as analysis_results
    FROM paged_bills pb
    JOIN ls_bill b ON pb.bill_id = b.bill_id
    JOIN ls_state st ON b.state_id = st.state_id
    JOIN ls_type t ON b.bill_type_id = t.bill_type_id
    JOIN ls_session s ON b.session_id = s.session_id
    LEFT JOIN ls_body b1 ON b.body_id = b1.body_id
    LEFT JOIN ls_body b2 ON b.current_body_id = b2.body_id
    LEFT JOIN ls_progress p ON b.status_id = p.progress_event_id
    LEFT JOIN ls_committee c ON b.pending_committee_id = c.committee_id
    ORDER BY pb.latest_action_date DESC NULLS LAST, b.bill_id DESC
  `

  // Count query with same approach
  const countResult = await db`
    WITH state_bills AS (
      -- Fast index lookup to get only the bills we need by state and type first
      SELECT b.bill_id
      FROM ls_bill b
      JOIN ls_state s ON b.state_id = s.state_id
      JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id  -- Only include analyzed bills
      ${filters.committee?.length ? db`
      JOIN ls_committee c ON b.pending_committee_id = c.committee_id
      ` : db``}
      WHERE s.state_abbr = ${stateCode}
      -- Only filter by bill_type_id for state bills, not for US Congress
      ${stateCode !== 'US' ? db`AND b.bill_type_id = 1` : db``}
      ${filters.committee?.length ? db`
      AND c.committee_name = ANY(ARRAY[${db.unsafe(committeeNamesArray)}])
      ` : db``}
    ),
    filtered_bills AS (
      -- Apply all filters to the state bills
      SELECT DISTINCT sb.bill_id
      FROM state_bills sb
      ${filters.party ? db`
      JOIN ls_bill_sponsor bs ON sb.bill_id = bs.bill_id AND bs.sponsor_order = 1
      JOIN ls_people p ON bs.people_id = p.people_id
      JOIN ls_party party ON p.party_id = party.party_id
      ` : db``}
      WHERE 1=1
      ${filters.party ? db`AND party.party_abbr = ${filters.party}` : db``}
      ${filters.categories && filters.categories.length > 0 
        ? filters.categories.map(cat => db`
          AND EXISTS (
            SELECT 1
            FROM bill_analysis_results bar
            JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
            WHERE bar.bill_id = sb.bill_id
            AND bacs.category = ${cat.id}
            ${cat.impactTypes.includes('BIAS') ? db`
              AND bacs.bias_score >= bacs.positive_impact_score
              AND bacs.bias_score >= 0.60
            ` : cat.impactTypes.includes('POSITIVE') ? db`
              AND bacs.positive_impact_score > bacs.bias_score
              AND bacs.positive_impact_score >= 0.60
            ` : cat.impactTypes.length ? db`
              AND (
                bacs.bias_score < 0.60
                AND bacs.positive_impact_score < 0.60
              )
            ` : db``}
          )
        `)
        : db``
      }
      ${filters.support === 'HAS_SUPPORT' 
        ? db`AND (SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = sb.bill_id) >= 2` 
        : filters.support === 'NO_SUPPORT'
        ? db`AND (SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = sb.bill_id) < 2`
        : db``
      }
    )
    SELECT COUNT(*) as total
    FROM filtered_bills
  `

  // Get all committees for the state using a more efficient direct join
  const allCommittees = await db`
    SELECT DISTINCT 
      c.committee_id as id,
      c.committee_name as name
    FROM ls_committee c
    JOIN ls_bill b ON b.pending_committee_id = c.committee_id
    JOIN ls_state s ON b.state_id = s.state_id
    WHERE s.state_abbr = ${stateCode}
      AND c.committee_name IS NOT NULL
      AND c.committee_name != ''
    ORDER BY c.committee_name
  `

  // Build filter state
  const billFilters: BillFilters = {
    impacts: [],
    categories: [
      { id: 'gender', name: 'Gender', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'disability', name: 'Disability', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'age', name: 'Age', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'race', name: 'Race', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'religion', name: 'Religion', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'veterans', name: 'Veterans', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]}
    ],
    demographics: [],
    party: filters.party as 'D' | 'R' | 'I' | 'ALL' || 'ALL',
    committees: allCommittees.map(committee => ({
      id: committee.id || 0,
      name: committee.name,
      selected: filters.committee?.includes(committee.name) || false
    })),
    support: filters.support || 'ALL'
  }

  // Update selected states based on URL params
  if (categoryFilters.length > 0) {
    categoryFilters.forEach(({ id, impactTypes }) => {
      const category = billFilters.categories.find(c => c.id === id)
      if (category) {
        category.selected = true
        impactTypes.forEach(impactType => {
          const impact = category.impactTypes.find(i => i.type === impactType)
          if (impact) {
            impact.selected = true
          }
        })
      }
    })
  }

  return Response.json({
    bills: result,
    totalCount: parseInt(countResult[0].total),
    filters: billFilters
  }, {
    headers: {
      'Cache-Control': 'max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
} 