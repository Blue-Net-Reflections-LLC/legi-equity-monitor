import sql from '@/lib/db';
import { BillList } from '@/app/components/BillList';
import SearchForm from '@/app/search/SearchForm';
import { BillWithImpacts } from '@/app/types';

export const revalidate = 0; // Disable caching for search results

async function searchBills(query: string): Promise<BillWithImpacts[]> {
  return sql<BillWithImpacts[]>`
    WITH bill_impacts AS (
      SELECT 
        bill_id,
        jsonb_object_agg(
          race_code,
          jsonb_build_object(
            'severity', severity,
            'impact_type', impact_type::impact_type_enum,
            'analysis_text', analysis_text
          )
        ) as racial_impacts
      FROM racial_impact_analysis
      GROUP BY bill_id
    )
    SELECT DISTINCT 
      b.bill_id,
      b.state_abbr,
      b.bill_number,
      b.status_id,
      b.status_desc,
      b.status_date,
      b.title,
      b.description,
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
      b.state_id,
      b.state_name,
      b.session_id,
      b.session_name,
      b.session_title,
      b.session_year_start,
      b.session_year_end,
      bi.racial_impacts
    FROM lsv_bill b
    LEFT JOIN bill_impacts bi ON b.bill_id = bi.bill_id
    WHERE b.title ILIKE ${'%' + query + '%'} 
    OR b.description ILIKE ${'%' + query + '%'}
    OR b.bill_number ILIKE ${'%' + query + '%'}
    ORDER BY b.status_date DESC NULLS LAST
    LIMIT 20
  `;
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  const bills = query ? await searchBills(query) : [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Search Legislation</h1>
      <SearchForm initialQuery={query} />
      {query && (
        <>
          <h2 className="text-xl font-semibold">Search Results for &quot;{query}&quot;</h2>
          <BillList bills={bills} />
        </>
      )}
    </div>
  );
}

