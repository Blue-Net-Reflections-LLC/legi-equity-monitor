import sql from '@/lib/db';
import BillList from '@/app/components/BillList';
import SearchForm from '@/app/search/SearchForm';
import { BillWithImpacts } from '@/app/types';

export const revalidate = 0; // Disable caching for search results

async function searchBills(query: string): Promise<BillWithImpacts[]> {
  return sql<BillWithImpacts[]>`
    SELECT bill_id, bill_number, title, description, last_action, last_action_date, inferred_categories
    FROM bills
    WHERE title ILIKE ${'%' + query + '%'} OR description ILIKE ${'%' + query + '%'}
    ORDER BY last_action_date DESC
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

