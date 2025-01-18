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
    categories?: string[];
  } = {}
): Promise<{ bills: BillWithImpacts[], totalCount: number }> {
  const offset = (page - 1) * pageSize;

  // Get bills with pagination using LegiScan view
  const bills = await db`
    SELECT 
      b.bill_id,
      b.bill_number,
      b.title,
      b.description,
      b.state_abbr,
      b.state_name,
      b.status_id,
      b.status_desc,
      b.status_date,
      b.bill_type_id,
      b.bill_type_name,
      b.body_id,
      b.body_name,
      b.current_body_id,
      b.current_body_name,
      b.pending_committee_id,
      b.pending_committee_name,
      b.legiscan_url,
      b.state_url,
      b.session_id,
      b.session_name,
      b.session_title,
      b.session_year_start,
      b.session_year_end
    FROM lsv_bill b
    WHERE b.state_abbr = ${stateCode.toUpperCase()}
    ${filters.committee ? db` AND b.pending_committee_name = ${filters.committee}` : db``}
    ORDER BY b.status_date DESC NULLS LAST
    LIMIT ${pageSize} 
    OFFSET ${offset}
  `;

  // Get total count with same conditions
  const [{ count }] = await db`
    SELECT COUNT(DISTINCT b.bill_id) 
    FROM lsv_bill b
    WHERE b.state_abbr = ${stateCode.toUpperCase()}
    ${filters.committee ? db` AND b.pending_committee_name = ${filters.committee}` : db``}
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
  const page = parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1');
  const pageSize = 12;

  const filters = {
    race_code: typeof searchParams.race_code === 'string' ? searchParams.race_code : undefined,
    impact_type: typeof searchParams.impact_type === 'string' ? searchParams.impact_type : undefined,
    severity: typeof searchParams.severity === 'string' ? searchParams.severity : undefined,
    committee: typeof searchParams.committee === 'string' ? searchParams.committee : undefined,
    categories: Array.isArray(searchParams.categories) 
      ? searchParams.categories 
      : typeof searchParams.categories === 'string' 
        ? [searchParams.categories]
        : undefined,
  };

  const { bills, totalCount } = await getBills(stateCode, page, pageSize, filters);
  const stateName = bills[0]?.state_name || stateCode;

  // Helper function to generate filter URLs
  const getFilterUrl = (newFilters: typeof filters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });
    return `/${stateCode.toLowerCase()}${params.toString() ? `?${params.toString()}` : ''}`;
  };

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
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {bills.length} of {totalCount} bills
              </div>
              {/* <FilterDrawer /> */}
            </div>
            
            {/* Active Filters */}
            {Object.values(filters).some(Boolean) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filters.committee && (
                  <a
                    href={getFilterUrl({ ...filters, committee: undefined })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer"
                  >
                    Committee: {filters.committee}
                    <span className="ml-1">×</span>
                  </a>
                )}
                {filters.categories && (
                  <a
                    href={getFilterUrl({ ...filters, categories: undefined })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-800 cursor-pointer"
                  >
                    Categories: {filters.categories.join(', ')}
                    <span className="ml-1">×</span>
                  </a>
                )}
                {filters.race_code && (
                  <a
                    href={getFilterUrl({ ...filters, race_code: undefined })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer"
                  >
                    Race: {filters.race_code}
                    <span className="ml-1">×</span>
                  </a>
                )}
                {filters.impact_type && (
                  <a
                    href={getFilterUrl({ ...filters, impact_type: undefined })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800 cursor-pointer"
                  >
                    Impact: {filters.impact_type}
                    <span className="ml-1">×</span>
                  </a>
                )}
                {filters.severity && (
                  <a
                    href={getFilterUrl({ ...filters, severity: undefined })}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer"
                  >
                    Severity: {filters.severity}
                    <span className="ml-1">×</span>
                  </a>
                )}
                <a 
                  href={`/${stateCode.toLowerCase()}`}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                >
                  Clear all filters
                </a>
              </div>
            )}
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
    </>
  );
} 