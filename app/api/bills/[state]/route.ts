import { type NextRequest } from 'next/server';
import db from '@/lib/db';

export const revalidate = 300; // 5 minutes instead of 1 hour

interface SupportOption {
  id: number;
  name: string;
  selected: boolean;
}

interface PartyOption {
  id: number;
  name: string;
  selected: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { state: string } }
) {
  const state = params.state.toUpperCase();
  const url = new URL(req.url);
  const searchParams = new URL(req.url).searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const filter = searchParams.get('filter') || '';
  const billType = parseInt(searchParams.get('billType') || '1');
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  const committees: { id: number; name: string; selected: boolean }[] = [];
  const parties: PartyOption[] = [
    { id: 1, name: 'Democrat', selected: false },
    { id: 2, name: 'Republican', selected: false },
  ];
  const support: SupportOption[] = [
    { id: 1, name: 'Support', selected: false },
    { id: 2, name: 'Oppose', selected: false },
  ];

  // Update selected state based on URL parameters
  if (searchParams.has('committee')) {
    const selectedCommittees = searchParams.get('committee')?.split(',').map(Number) || [];
    for (let i = 0; i < committees.length; i++) {
      committees[i].selected = selectedCommittees.includes(committees[i].id);
    }
  }
  
  if (searchParams.has('party')) {
    const selectedParties = searchParams.get('party')?.split(',').map(Number) || [];
    for (let i = 0; i < parties.length; i++) {
      parties[i].selected = selectedParties.includes(parties[i].id);
    }
  }
  
  if (searchParams.has('support')) {
    const selectedSupport = searchParams.get('support')?.split(',').map(Number) || [];
    for (let i = 0; i < support.length; i++) {
      support[i].selected = selectedSupport.includes(support[i].id);
    }
  }

  // Get all committees for this state 
  const committeesResult = await db`
    SELECT DISTINCT c.committee_id, c.committee_name
    FROM ls_committee c
    JOIN ls_body b ON c.committee_body_id = b.body_id
    JOIN ls_state s ON b.state_id = s.state_id
    WHERE s.state_abbr = ${state}
    ORDER BY c.committee_name
  `;

  // Extract and format committees
  for (const committee of committeesResult) {
    const selectedCommittees = searchParams.get('committee')?.split(',').map(Number) || [];
    committees.push({
      id: committee.committee_id,
      name: committee.committee_name,
      selected: selectedCommittees.includes(committee.committee_id)
    });
  }

  // Build WHERE clauses for filters
  let filterConditions = '';
  let filterParams = [];
  let paramIndex = 2; // Starting from 2 since state and billType are $1 and $2
  
  // Committee Filter
  if (searchParams.has('committee')) {
    const committeeIds = searchParams.get('committee')?.split(',').map(Number);
    if (committeeIds && committeeIds.length > 0) {
      filterConditions += ` AND b.pending_committee_id IN (${committeeIds.join(',')})`;
    }
  }
  
  // Party Filter - requires joining to sponsor table
  if (searchParams.has('party')) {
    const partyIds = searchParams.get('party')?.split(',').map(Number);
    if (partyIds && partyIds.length > 0) {
      filterConditions += ` AND b.bill_id IN (
        SELECT DISTINCT bs.bill_id 
        FROM ls_bill_sponsor bs
        JOIN ls_people p ON bs.people_id = p.people_id
        WHERE p.party_id IN (${partyIds.join(',')})
      )`;
    }
  }
  
  // Text Filter
  if (filter && filter.trim() !== '') {
    const searchTerm = `%${filter.toLowerCase()}%`;
    filterConditions += ` AND (
      LOWER(b.bill_number) LIKE '${searchTerm}' OR 
      LOWER(b.title) LIKE '${searchTerm}' OR 
      LOWER(b.description) LIKE '${searchTerm}'
    )`;
  }

  // Support/Oppose filter - would connect to your custom tables
  if (searchParams.has('support')) {
    const supportValues = searchParams.get('support')?.split(',').map(Number);
    if (supportValues && supportValues.length > 0) {
      filterConditions += ` AND b.bill_id IN (
        SELECT bill_id FROM bill_analysis_results 
        WHERE ${supportValues.includes(1) ? 'overall_positive_impact_score >= 0.5' : ''}
        ${supportValues.includes(1) && supportValues.includes(2) ? ' OR ' : ''}
        ${supportValues.includes(2) ? 'overall_positive_impact_score < 0.5' : ''}
      )`;
    }
  }

  // Optimized query using string concatenation to avoid parameter conflicts
  const result = await db`
    WITH state_bill_ids AS (
      -- Fast index lookup to get only the bills we need by state and type
      SELECT b.bill_id
      FROM ls_bill b
      JOIN ls_state s ON b.state_id = s.state_id
      WHERE s.state_abbr = ${state}
      AND b.bill_type_id = ${billType}
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
  `;

  // Count query with same approach
  const countResult = await db`
    SELECT COUNT(*) as total
    FROM ls_bill b
    JOIN ls_state s ON b.state_id = s.state_id
    WHERE s.state_abbr = ${state}
    AND b.bill_type_id = ${billType}
    ${db.unsafe(filterConditions)}
  `;

  return Response.json({
    bills: result,
    totalCount: parseInt(countResult[0].total),
    filters: {
      committees,
      parties,
      support,
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
        { id: 'sexual_orientation', name: 'Sexual Orientation', selected: false, impactTypes: [
          { type: 'POSITIVE', selected: false },
          { type: 'BIAS', selected: false },
          { type: 'NEUTRAL', selected: false }
        ]}
      ]
    }
  });
} 