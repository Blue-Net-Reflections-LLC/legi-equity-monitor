import db from "@/lib/db";
import BillList from "@/app/components/BillList";
import Pagination from "@/app/components/Pagination";
import { BillWithImpacts } from "@/app/types";
import { AuroraBackground } from "@/app/components/ui/aurora-background";

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
};

async function getBills(
  stateCode: string,
  page = 1,
  pageSize = 12
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
    ORDER BY b.last_action_date DESC NULLS LAST
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // Get total count
  const [{ count }] = await db`
    SELECT COUNT(DISTINCT b.bill_id) 
    FROM bills b
    WHERE b.bill_type = 'B'
  ` as unknown as [{ count: string }];

  return {
    bills: bills as unknown as BillWithImpacts[],
    totalCount: Number(count)
  };
}

export default async function StatePage({ 
  params,
  searchParams 
}: { 
  params: { state: string };
  searchParams: { page?: string } 
}) {
  const stateCode = params.state.toUpperCase();
  const stateName = STATE_NAMES[stateCode];
  const page = parseInt(searchParams.page || '1');
  const pageSize = 12;

  const { bills, totalCount } = await getBills(stateCode, page, pageSize);

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