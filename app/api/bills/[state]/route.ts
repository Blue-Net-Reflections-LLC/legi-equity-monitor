import { NextRequest } from 'next/server'
import db from "@/lib/db"
import type { Bill } from "@/app/types"
import type { BillFilters } from "@/app/types/filters"

export const revalidate = 3600 // Cache for 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: { state: string } }
) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 12
  const offset = (page - 1) * pageSize
  const stateCode = params.state.toUpperCase()

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

  // Get bills with filters
  const bills = await db`
    WITH filtered_bills AS (
      SELECT DISTINCT b.bill_id
      FROM lsv_bill b
      ${filters.categories?.length ? db`
        JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
        JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
      ` : db`
        LEFT JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
        LEFT JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
      `}
      WHERE b.state_abbr = ${stateCode}
      AND b.bill_type_id = 1
      ${filters.categories?.length ? db`AND ${filters.categories.map(cat => db`
        EXISTS (
          SELECT 1
          FROM bill_analysis_results subbar
          JOIN bill_analysis_category_scores subbacs ON subbar.analysis_id = subbacs.analysis_id
          WHERE subbar.bill_id = b.bill_id
          AND subbacs.category = ${cat.id}
          ${cat.impactTypes.includes('BIAS') ? db`
            AND subbacs.bias_score >= subbacs.positive_impact_score 
            AND subbacs.bias_score >= 0.60
          ` : cat.impactTypes.includes('POSITIVE') ? db`
            AND subbacs.positive_impact_score > subbacs.bias_score
            AND subbacs.positive_impact_score >= 0.60
          ` : cat.impactTypes.length ? db`
            AND (
              subbacs.bias_score < 0.60 
              AND subbacs.positive_impact_score < 0.60
            )
          ` : db``}
        )
      `).reduce((acc, clause, idx) => 
        idx === 0 ? clause : db`${acc} AND ${clause}`
      , db``)}` : db``}
      ${filters.committee ? db`AND b.pending_committee_name = ANY(${filters.committee})` : db``}
      ${filters.party ? db`AND EXISTS (
        SELECT 1 FROM ls_bill_sponsor sp
        JOIN ls_people p ON sp.people_id = p.people_id
        JOIN ls_party party ON p.party_id = party.party_id
        WHERE sp.bill_id = b.bill_id
        AND sp.sponsor_order = 1
        AND party.party_abbr = ${filters.party}
      )` : db``}
      ${filters.support === 'HAS_SUPPORT' ? db`AND (
        SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id
      ) >= 2` : filters.support === 'NO_SUPPORT' ? db`AND (
        SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id
      ) < 2` : db``}
    ),
    bill_details AS (
      SELECT 
        b.*,
        h.history_date as latest_action_date,
        sponsors.sponsor_data as sponsors,
        bar.analysis_data as analysis_results
      FROM lsv_bill b
      JOIN filtered_bills fb ON b.bill_id = fb.bill_id
      LEFT JOIN LATERAL (
        SELECT history_date
        FROM ls_bill_history
        WHERE bill_id = b.bill_id
        ORDER BY history_step DESC
        LIMIT 1
      ) h ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'people_id', sp.people_id,
          'party', party.party_name,
          'type', CASE WHEN sp.sponsor_order = 1 THEN 'Primary' ELSE 'Co' END
        )) as sponsor_data
        FROM ls_bill_sponsor sp
        JOIN ls_people p ON sp.people_id = p.people_id
        JOIN ls_party party ON p.party_id = party.party_id
        WHERE sp.bill_id = b.bill_id
      ) sponsors ON true
      LEFT JOIN LATERAL (
        SELECT json_build_object(
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
        ) as analysis_data
        FROM bill_analysis_results bar
        WHERE bar.bill_id = b.bill_id
        LIMIT 1
      ) bar ON true
    )
    SELECT *
    FROM bill_details
    ORDER BY latest_action_date DESC NULLS LAST, bill_id DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `.then(rows => rows as unknown as Bill[])

  // Get total count
  const [{ count }] = await db`
    SELECT COUNT(DISTINCT b.bill_id)
    FROM lsv_bill b
    ${filters.categories?.length ? db`
      JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
      JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
    ` : db`
      LEFT JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
      LEFT JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
    `}
    WHERE b.state_abbr = ${stateCode}
    AND b.bill_type_id = 1
    ${filters.categories?.length ? db`AND ${filters.categories.map(cat => db`
      EXISTS (
        SELECT 1
        FROM bill_analysis_results subbar
        JOIN bill_analysis_category_scores subbacs ON subbar.analysis_id = subbacs.analysis_id
        WHERE subbar.bill_id = b.bill_id
        AND subbacs.category = ${cat.id}
        ${cat.impactTypes.includes('BIAS') ? db`
          AND subbacs.bias_score >= subbacs.positive_impact_score 
          AND subbacs.bias_score >= 0.60
        ` : cat.impactTypes.includes('POSITIVE') ? db`
          AND subbacs.positive_impact_score > subbacs.bias_score
          AND subbacs.positive_impact_score >= 0.60
        ` : cat.impactTypes.length ? db`
          AND (
            subbacs.bias_score < 0.60 
            AND subbacs.positive_impact_score < 0.60
          )
        ` : db``}
      )
    `).reduce((acc, clause, idx) => 
      idx === 0 ? clause : db`${acc} AND ${clause}`
    , db``)}` : db``}
    ${filters.committee ? db`AND b.pending_committee_name = ANY(${filters.committee})` : db``}
    ${filters.party ? db`AND EXISTS (
      SELECT 1 FROM ls_bill_sponsor sp
      JOIN ls_people p ON sp.people_id = p.people_id
      JOIN ls_party party ON p.party_id = party.party_id
      WHERE sp.bill_id = b.bill_id
      AND sp.sponsor_order = 1
      AND party.party_abbr = ${filters.party}
    )` : db``}
    ${filters.support === 'HAS_SUPPORT' ? db`AND (
      SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id
    ) >= 2` : filters.support === 'NO_SUPPORT' ? db`AND (
      SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id
    ) < 2` : db``}
  ` as unknown as [{ count: string }]

  // Get all committees for the state
  const allCommittees = await db`
    SELECT DISTINCT 
      pending_committee_id as id,
      pending_committee_name as name
    FROM lsv_bill
    WHERE state_abbr = ${stateCode}
      AND pending_committee_name IS NOT NULL
      AND pending_committee_name != ''
    ORDER BY pending_committee_name
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
    bills,
    totalCount: Number(count),
    filters: billFilters
  }, {
    headers: {
      'Cache-Control': 'max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
} 