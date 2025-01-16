import sql from '@/lib/db';
import BillList from '@/app/components/BillList';
import Pagination from '@/app/components/Pagination';
import RightSidebar from '@/app/components/RightSidebar';
import { Bill } from '@/types';

export const revalidate = 3600; // Revalidate every hour

interface FilterParams {
  race_code?: string;
  impact_type?: string;
  severity?: string;
  committee?: string;
  category?: string;
}

async function getBills(
  page = 1, 
  pageSize = 12,
  filters: FilterParams = {}
): Promise<{ bills: Bill[], totalCount: number }> {
  const offset = (page - 1) * pageSize;
  
  // Build the base query
  let query = sql`
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
      b.title, 
      b.description, 
      b.last_action, 
      b.last_action_date,
      bi.racial_impacts
    FROM bills b
    LEFT JOIN bill_impacts bi ON b.bill_id = bi.bill_id
    WHERE b.bill_type = 'B'
  `;
  
  // Build WHERE clause
  const conditions = [];
  
  if (filters.race_code || filters.impact_type || filters.severity) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM racial_impact_analysis ria 
      WHERE ria.bill_id = b.bill_id
      ${filters.race_code ? sql`AND ria.race_code = ${filters.race_code}` : sql``}
      ${filters.impact_type ? sql`AND ria.impact_type = ${filters.impact_type}::impact_type_enum` : sql``}
      ${filters.severity ? sql`AND ria.severity = ${filters.severity}::impact_severity` : sql``}
    )`);
  }

  if (filters.committee) {
    conditions.push(sql`b.committee_name = ${filters.committee}`);
  }
  if (filters.category) {
    conditions.push(sql`
      EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(b.inferred_categories) as cat
        WHERE cat->>'category' = ${filters.category}
      )
    `);
  }
  
  // Add additional WHERE conditions if there are any
  if (conditions.length > 0) {
    for (const condition of conditions) {
      query = sql`${query} AND ${condition}`;
    }
  }
  
  // Add ordering and pagination
  const finalQuery = sql`
    ${query}
    ORDER BY b.last_action_date DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;
  
  // Execute the query
  const bills = await finalQuery;
  
  // Build and execute count query
  let countQuery = sql`
    SELECT COUNT(DISTINCT b.bill_id) 
    FROM bills b
    WHERE b.bill_type = 'B'
  `;
  
  // Add racial impact conditions to count query if needed
  if (conditions.length > 0) {
    for (const condition of conditions) {
      countQuery = sql`${countQuery} AND ${condition}`;
    }
  }

  const [{ count }] = await countQuery as unknown as [{ count: string }];
  
  return { 
    bills: bills as unknown as Bill[], 
    totalCount: Number(count) 
  };
}

export default async function Home({ 
  searchParams 
}: { 
  searchParams: { 
    page?: string;
    race_code?: string;
    impact_type?: string;
    severity?: string;
    committee?: string;
    category?: string;
  } 
}) {
  const page = parseInt(searchParams.page || '1');
  const pageSize = 12;
  
  const filters: FilterParams = {
    race_code: searchParams.race_code,
    impact_type: searchParams.impact_type,
    severity: searchParams.severity,
    committee: searchParams.committee,
    category: searchParams.category,
  };
  
  const { bills, totalCount } = await getBills(page, pageSize, filters);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Recent Legislation</h1>
          <div className="text-sm text-gray-500">
            Showing {bills.length} of {totalCount} bills
          </div>
        </div>
        <BillList bills={bills} />
        <Pagination
          currentPage={page}
          totalItems={totalCount}
          pageSize={pageSize}
          className="mt-8"
        />
      </div>
      <div className="w-full lg:w-auto">
        <RightSidebar />
      </div>
    </div>
  );
}

