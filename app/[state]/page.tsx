import db from "@/lib/db";
import BillList from "@/app/components/BillList";
import Pagination from "@/app/components/Pagination";
import { BillWithImpacts } from "@/app/types";
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import FilterDrawer from '@/app/components/FilterDrawer';

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
};

async function getBills(
  stateCode: string,
  page = 1,
  pageSize = 12,
  filters: {
    race_code?: string;
    impact_type?: string;
    severity?: string;
    committee?: string;
    category?: string;
  } = {}
): Promise<{ bills: BillWithImpacts[], totalCount: number }> {
  const offset = (page - 1) * pageSize;

  // Get bills with pagination
  const bills = await db`
    WITH bill_impacts AS (
      SELECT 
        bill_id,
        jsonb_object_agg(
          race_code,
          jsonb_build_object(
            'severity', severity,
            'impact_type', CASE WHEN impact_type::impact_type_enum = 'POSITIVE' THEN 'positive' ELSE 'negative' END
          )
        ) as racial_impacts
      FROM racial_impact_analysis
      GROUP BY bill_id
    )
    SELECT DISTINCT 
      b.bill_id,
      b.bill_number,
      b.bill_type,
      b.title,
      b.description,
      b.committee_name,
      b.last_action,
      b.last_action_date,
      b.pdf_url,
      b.inferred_categories,
      bi.racial_impacts
    FROM bills b
    LEFT JOIN bill_impacts bi ON b.bill_id = bi.bill_id
    WHERE b.bill_type = 'B'
    ${filters.committee ? db` AND b.committee_name = ${filters.committee}` : db``}
    ${filters.category ? db` AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(b.inferred_categories) cat 
      WHERE cat->>'category' = ${filters.category}
    )` : db``}
    ${filters.race_code ? db` AND EXISTS (
      SELECT 1 FROM racial_impact_analysis ria 
      WHERE ria.bill_id = b.bill_id 
      AND ria.race_code = ${filters.race_code}
      ${filters.impact_type ? db` AND ria.impact_type::text = ${filters.impact_type}` : db``}
      ${filters.severity ? db` AND ria.severity = ${filters.severity}` : db``}
    )` : filters.impact_type || filters.severity ? db` AND EXISTS (
      SELECT 1 FROM racial_impact_analysis ria 
      WHERE ria.bill_id = b.bill_id 
      ${filters.impact_type ? db` AND ria.impact_type::text = ${filters.impact_type}` : db``}
      ${filters.severity ? db` AND ria.severity = ${filters.severity}` : db``}
    )` : db``}
    ORDER BY b.last_action_date DESC NULLS LAST
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // Get total count with same conditions
  const [{ count }] = await db`
    SELECT COUNT(DISTINCT b.bill_id) 
    FROM bills b
    WHERE b.bill_type = 'B'
    ${filters.committee ? db` AND b.committee_name = ${filters.committee}` : db``}
    ${filters.category ? db` AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(b.inferred_categories) cat 
      WHERE cat->>'category' = ${filters.category}
    )` : db``}
    ${filters.race_code ? db` AND EXISTS (
      SELECT 1 FROM racial_impact_analysis ria 
      WHERE ria.bill_id = b.bill_id 
      AND ria.race_code = ${filters.race_code}
      ${filters.impact_type ? db` AND ria.impact_type::text = ${filters.impact_type}` : db``}
      ${filters.severity ? db` AND ria.severity = ${filters.severity}` : db``}
    )` : filters.impact_type || filters.severity ? db` AND EXISTS (
      SELECT 1 FROM racial_impact_analysis ria 
      WHERE ria.bill_id = b.bill_id 
      ${filters.impact_type ? db` AND ria.impact_type::text = ${filters.impact_type}` : db``}
      ${filters.severity ? db` AND ria.severity = ${filters.severity}` : db``}
    )` : db``}
  ` as unknown as [{ count: string }];

  return {
    bills: bills as unknown as BillWithImpacts[],
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
  const stateName = STATE_NAMES[stateCode];
  const page = parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1');
  const pageSize = 12;

  const filters = {
    race_code: typeof searchParams.race_code === 'string' ? searchParams.race_code : undefined,
    impact_type: typeof searchParams.impact_type === 'string' ? searchParams.impact_type : undefined,
    severity: typeof searchParams.severity === 'string' ? searchParams.severity : undefined,
    committee: typeof searchParams.committee === 'string' ? searchParams.committee : undefined,
    category: typeof searchParams.category === 'string' ? searchParams.category : undefined,
  };

  const { bills, totalCount } = await getBills(stateCode, page, pageSize, filters);

  return (
    <>
      {/* Hero Section with Aurora */}
      <section className="h-[10vh] min-h-[80px]">
        <AuroraBackground>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white text-center">
            {stateName} Bills
          </h1>
          <p className="text-sm md:text-base text-zinc-700 dark:text-neutral-200 text-center mt-1">
            Analyzing legislative impact on racial equity
          </p>
        </AuroraBackground>
      </section>

      {/* Bills Section */}
      <section className="py-4 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {bills.length} of {totalCount} bills
            </div>
            <FilterDrawer />
          </div>
          <BillList bills={bills} />
          <Pagination
            currentPage={page}
            totalItems={totalCount}
            pageSize={pageSize}
            baseUrl={`/${stateCode.toLowerCase()}`}
          />
        </div>
      </section>
    </>
  );
} 