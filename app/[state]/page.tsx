import db from "@/lib/db";
import { BillList } from "@/app/components/BillList";
import Pagination from "@/app/components/Pagination";
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import { Bill } from "@/app/types";
import { Footer } from "@/app/components/layout/Footer";
import { BillFiltersWrapper } from "@/app/components/filters/BillFiltersWrapper";
import type { BillFilters as BillFiltersType } from "@/app/types/filters";

async function getBills(
  stateCode: string,
  page = 1,
  pageSize = 12,
  filters: {
    committee?: string;
    categories?: Array<{ id: string; impactTypes: Array<'POSITIVE' | 'BIAS' | 'NEUTRAL'> }>;
    party?: string;
    support?: 'HAS_SUPPORT' | 'NO_SUPPORT';
  } = {}
): Promise<{ bills: Bill[], totalCount: number }> {
  console.log('Filters received:', filters);
  console.log('Categories:', filters.categories);
  
  const offset = (page - 1) * pageSize;
  
  console.log('Debug - Category:', filters.categories?.[0]?.id);
  console.log('Debug - Impact Types:', filters.categories?.[0]?.impactTypes);
  console.log('Debug - SQL condition:', filters.categories?.length ? 
    `category = ${filters.categories[0].id} AND bias_score > positive_impact_score AND bias_score >= 0.60` : 'TRUE');

  const bills = await db`
    WITH filtered_bills AS (
      SELECT DISTINCT b.bill_id
      FROM lsv_bill b
      JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
      JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
      WHERE b.state_abbr = ${stateCode.toUpperCase()}
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
          ` : cat.impactTypes.includes('NEUTRAL') ? db`
            AND (
              (subbacs.bias_score = subbacs.positive_impact_score)
              OR (subbacs.bias_score < 0.60 AND subbacs.positive_impact_score < 0.60)
            )
          ` : db``}
        )
      `).reduce((acc, clause, idx) => 
        idx === 0 ? clause : db`${acc} AND ${clause}`
      , db``)}` : db``}
      ${filters.committee ? db`AND b.pending_committee_name = ${filters.committee}` : db``}
      ${filters.party ? db`AND EXISTS (
        SELECT 1 FROM ls_bill_sponsor sp
        JOIN ls_people p ON sp.people_id = p.people_id
        JOIN ls_party party ON p.party_id = party.party_id
        WHERE sp.bill_id = b.bill_id
        AND sp.sponsor_order = 1
        AND party.party_name = ${filters.party}
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
  `.then(rows => rows as unknown as Bill[]);

  // Get total count with same conditions
  const [{ count }] = await db`
    WITH bill_impacts AS (
      SELECT DISTINCT
        bar.bill_id,
        bacs.category,
        bacs.bias_score,
        bacs.positive_impact_score,
        CASE
          WHEN bacs.bias_score = bacs.positive_impact_score THEN 'NEUTRAL'
          WHEN bacs.bias_score < 0.60 AND bacs.positive_impact_score < 0.60 THEN 'NEUTRAL'
          WHEN bacs.bias_score > bacs.positive_impact_score THEN 'BIAS'
          WHEN bacs.positive_impact_score > bacs.bias_score THEN 'POSITIVE'
        END as impact_type
      FROM bill_analysis_results bar
      JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
      WHERE ${filters.categories?.length ? db`${filters.categories.map(cat => db`
        EXISTS (
          SELECT 1
          FROM bill_analysis_results subbar
          JOIN bill_analysis_category_scores subbacs ON subbar.analysis_id = subbacs.analysis_id
          WHERE subbar.bill_id = bar.bill_id
          AND subbacs.category = ${cat.id}
          ${cat.impactTypes.includes('BIAS') ? db`
            AND subbacs.bias_score >= subbacs.positive_impact_score 
            AND subbacs.bias_score >= 0.60
          ` : cat.impactTypes.includes('POSITIVE') ? db`
            AND subbacs.positive_impact_score > subbacs.bias_score
            AND subbacs.positive_impact_score >= 0.60
          ` : cat.impactTypes.includes('NEUTRAL') ? db`
            AND (
              (subbacs.bias_score = subbacs.positive_impact_score)
              OR (subbacs.bias_score < 0.60 AND subbacs.positive_impact_score < 0.60)
            )
          ` : db``}
        )
      `).reduce((acc, clause, idx) => 
        idx === 0 ? clause : db`${acc} AND ${clause}`
      , db``)}` : db`TRUE`}
    )
    SELECT COUNT(DISTINCT b.bill_id)
    FROM lsv_bill b
    ${filters.categories?.length ? db`INNER JOIN bill_impacts bi ON b.bill_id = bi.bill_id` : db``}
    WHERE b.state_abbr = ${stateCode.toUpperCase()}
    AND b.bill_type_id = 1
    ${filters.committee ? db`AND b.pending_committee_name = ${filters.committee}` : db``}
    ${filters.party ? db`AND EXISTS (
      SELECT 1 FROM ls_bill_sponsor sp
      JOIN ls_people p ON sp.people_id = p.people_id
      JOIN ls_party party ON p.party_id = party.party_id
      WHERE sp.bill_id = b.bill_id
      AND sp.sponsor_order = 1
      AND party.party_name = ${filters.party}
    )` : db``}
    ${filters.support === 'HAS_SUPPORT' ? db`AND (
      SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id
    ) >= 2` : filters.support === 'NO_SUPPORT' ? db`AND (
      SELECT COUNT(*) FROM ls_bill_sponsor WHERE bill_id = b.bill_id
    ) < 2` : db``}
  ` as unknown as [{ count: string }];

  // Test query to verify data exists
  const [{ testCount }] = await db`
    SELECT COUNT(*) as "testCount"
    FROM bill_analysis_results bar
    JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
    WHERE bacs.category = 'race'
    AND bacs.bias_score > bacs.positive_impact_score
    AND bacs.bias_score >= 0.60
  `;
  
  console.log('Debug - Test count of matching bills:', testCount);

  return {
    bills: bills,
    totalCount: Number(count)
  };
}

export default async function StatePage({ 
  params,
  searchParams,
}: {
  params: { state: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const stateCode = params.state.toUpperCase();
  const page = parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1');
  const pageSize = 12;
  const offset = (page - 1) * pageSize;

  // Parse category filters from URL
  const categoryFilters = (Array.isArray(searchParams.category) 
    ? searchParams.category 
    : (searchParams.category as string || '').split(',')
  ).filter(Boolean).map(categoryId => {
    // Get impact type for this category if it exists (only take the last one if multiple)
    console.log('Processing category:', categoryId);
    console.log('Search params:', searchParams);
    const impactParam = searchParams[`impact_${categoryId}`];
    const impactType = Array.isArray(impactParam) 
      ? impactParam[impactParam.length - 1] 
      : impactParam;

    // Validate that the impact type is one of the allowed values
    const validImpactType = (impactType === 'POSITIVE' || impactType === 'BIAS' || impactType === 'NEUTRAL') 
      ? impactType as 'POSITIVE' | 'BIAS' | 'NEUTRAL'
      : undefined;
      
    console.log('Impact type found:', validImpactType);

    return {
      id: categoryId,
      impactTypes: validImpactType ? [validImpactType] : []
    } as const; // Use const assertion to preserve literal types
  });

  console.log('Final category filters:', categoryFilters);

  const filters = {
    committee: typeof searchParams.committee === 'string' ? searchParams.committee : undefined,
    categories: categoryFilters,
    party: typeof searchParams.party === 'string' ? searchParams.party : undefined,
    support: typeof searchParams.support === 'string' ? searchParams.support as 'HAS_SUPPORT' | 'NO_SUPPORT' : undefined,
  } as const; // Use const assertion to preserve literal types

  const { bills, totalCount } = await getBills(stateCode, page, pageSize, filters);
  const stateName = bills[0]?.state_name || stateCode;

  // Initialize filter state for the UI
  const billFilters: BillFiltersType = {
    impacts: [],
    categories: [
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
      { id: 'gender', name: 'Gender', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'age', name: 'Age', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'nationality', name: 'Nationality', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'sexual_orientation', name: 'Sexual Orientation', selected: false, impactTypes: [
        { type: 'POSITIVE', selected: false },
        { type: 'BIAS', selected: false },
        { type: 'NEUTRAL', selected: false }
      ]},
      { id: 'disability', name: 'Disability', selected: false, impactTypes: [
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
    party: filters.party as any || 'ALL',
    committees: bills.reduce((acc, bill) => {
      if (bill.pending_committee_name && !acc.find(c => c.name === bill.pending_committee_name)) {
        acc.push({
          id: bill.pending_committee_id || acc.length + 1,
          name: bill.pending_committee_name,
          selected: bill.pending_committee_name === filters.committee
        });
      }
      return acc;
    }, [] as Array<{ id: number; name: string; selected: boolean }>),
    support: filters.support || 'ALL'
  };

  // Update selected states based on URL params
  if (categoryFilters.length > 0) {
    categoryFilters.forEach(({ id, impactTypes }) => {
      const category = billFilters.categories.find(c => c.id === id);
      if (category) {
        category.selected = true;
        // Update impact type selections
        impactTypes.forEach(impactType => {
          const impact = category.impactTypes.find(i => i.type === impactType);
          if (impact) {
            impact.selected = true;
          }
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section with Aurora */}
      <section className="h-[10vh] min-h-[80px]">
        <AuroraBackground>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white text-center">
            {stateName} Bills
          </h1>
          <p className="text-sm md:text-base text-zinc-700 dark:text-neutral-200 text-center mt-1">
            Analyzing legislative impact on demographic equity
          </p>
        </AuroraBackground>
      </section>

      {/* Bills Section */}
      <section className="py-4 md:px-0 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing bills {offset + 1}-{Math.min(offset + bills.length, totalCount)} of {totalCount}
              </div>
              <BillFiltersWrapper filters={billFilters} stateCode={stateCode} />
            </div>
          </div>
          {bills.length > 0 ? (
            <BillList bills={bills} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                <svg
                  className="h-6 w-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No bills found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                {Object.values(filters).some(Boolean)
                  ? "Try adjusting your filters to see more bills."
                  : "There are no bills available at the moment."}
              </p>
              {Object.values(filters).some(Boolean) && (
                <a
                  href={`/${stateCode.toLowerCase()}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  Clear all filters
                </a>
              )}
            </div>
          )}
          <Pagination
            currentPage={page}
            totalItems={totalCount}
            pageSize={pageSize}
            searchParams={searchParams}
          />
        </div>
      </section>
      <Footer />
    </div>
  );
} 