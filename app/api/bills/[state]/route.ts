import { type NextRequest } from 'next/server'
import db from "@/lib/db"
import type { Bill } from "@/app/types"
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

  const filters = {
    committee: searchParams.getAll('committee').filter(Boolean).length > 0 
      ? searchParams.getAll('committee').filter(Boolean)
      : undefined,
    categories: categoryFilters,
    party: searchParams.get('party'),
    support: searchParams.get('support') as 'HAS_SUPPORT' | 'NO_SUPPORT' | undefined,
  }

  // Build WHERE clauses for filters
  let filterConditions = ''
  
  // Category filters
  if (filters.categories?.length) {
    filterConditions += filters.categories.map(cat => `
      EXISTS (
        SELECT 1
        FROM bill_analysis_results subbar
        JOIN bill_analysis_category_scores subbacs ON subbar.analysis_id = subbacs.analysis_id    
        WHERE subbar.bill_id = b.bill_id
        AND subbacs.category = '${cat.id}'
        ${cat.impactTypes.includes('BIAS') ? `
          AND subbacs.bias_score >= subbacs.positive_impact_score
          AND subbacs.bias_score >= 0.60
        ` : cat.impactTypes.includes('POSITIVE') ? `
          AND subbacs.positive_impact_score > subbacs.bias_score
          AND subbacs.positive_impact_score >= 0.60
        ` : cat.impactTypes.length ? `
          AND (
            subbacs.bias_score < 0.60
            AND subbacs.positive_impact_score < 0.60
          )
        ` : ''}
      )
    `).join(' AND ')
  }

  // Committee Filter
  if (filters.committee?.length) {
    // Join to lsv_bill view to access pending_committee_name
    filterConditions += ` AND EXISTS (
      SELECT 1 FROM lsv_bill lb
      WHERE lb.bill_id = b.bill_id
      AND lb.pending_committee_name = ANY(ARRAY[${filters.committee.map(name => `'${name.replace(/'/g, "''")}'`).join(',')}])
    )`
  }

  // Party Filter
  if (filters.party) {
    filterConditions += ` AND EXISTS (
      SELECT 1 FROM ls_bill_sponsor sp
      JOIN ls_people p ON sp.people_id = p.people_id
      JOIN ls_party party ON p.party_id = party.party_id
      WHERE sp.bill_id = b.bill_id
      AND sp.sponsor_order = 1
      AND party.party_abbr = '${filters.party}'
    )`
  }

  // Support Filter
  if (filters.support === 'HAS_SUPPORT') {
    filterConditions += ` AND (SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id) >= 2`
  } else if (filters.support === 'NO_SUPPORT') {
    filterConditions += ` AND (SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id) < 2`
  }

  // Prepare committee names for filtering - escape SQL special characters
  const committeeNamesArray = filters.committee?.map(name => 
    `'${name.replace(/'/g, "''")}'`
  ).join(',') || '';

  // Use optimized query with direct join instead of subquery for committee filtering
  const result = await db`
    WITH state_bill_ids AS (
      -- Fast index lookup to get only the bills we need by state and type
      SELECT DISTINCT b.bill_id
      FROM ls_bill b
      JOIN ls_state s ON b.state_id = s.state_id
      ${filters.committee?.length ? db`
      JOIN ls_committee c ON b.pending_committee_id = c.committee_id
      ` : db``}
      WHERE s.state_abbr = ${stateCode}
      AND b.bill_type_id = 1
      ${filters.committee?.length ? db`
      AND c.committee_name = ANY(ARRAY[${db.unsafe(committeeNamesArray)}])
      ` : db``}
      ${db.unsafe(filterConditions)}
    ),
    -- Get history dates for just these bills
    bill_history AS (
      SELECT
        h.bill_id,
        MAX(h.history_date) as latest_action_date
      FROM state_bill_ids sb
      JOIN ls_bill_history h ON sb.bill_id = h.bill_id
      GROUP BY h.bill_id
    ),
    -- Get our filtered page of bills
    paged_bills AS (
      SELECT 
        sb.bill_id,
        COALESCE(bh.latest_action_date, '1970-01-01'::date) as latest_action_date
      FROM state_bill_ids sb
      LEFT JOIN bill_history bh ON sb.bill_id = bh.bill_id
      ORDER BY latest_action_date DESC NULLS LAST, sb.bill_id DESC
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
      COALESCE(p.progress_desc, 'Introduced') as status_name,
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
    SELECT COUNT(*) as total
    FROM ls_bill b
    JOIN ls_state s ON b.state_id = s.state_id
    ${filters.committee?.length ? db`
    JOIN ls_committee c ON b.pending_committee_id = c.committee_id
    ` : db``}
    WHERE s.state_abbr = ${stateCode}
    AND b.bill_type_id = 1
    ${filters.committee?.length ? db`
    AND c.committee_name = ANY(ARRAY[${db.unsafe(committeeNamesArray)}])
    ` : db``}
    ${db.unsafe(filterConditions)}
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