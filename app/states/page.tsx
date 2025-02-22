import sql from '@/lib/db';
import { STATES } from '@/app/constants/states';
import { AuroraBackground } from '@/app/components/ui/aurora-background';
import { Footer } from '@/app/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

interface StateWithBills {
  code: string;
  name: string;
  bill_count: number;
}

async function getStateBillCounts(): Promise<StateWithBills[]> {
  const billCounts = await sql`
    SELECT 
      s.state_abbr as code,
      s.state_name as name,
      COUNT(b.bill_id)::integer as bill_count
    FROM 
      ls_state s
      LEFT JOIN ls_bill b ON s.state_id = b.state_id
      LEFT JOIN ls_type t ON b.bill_type_id = t.bill_type_id
    WHERE 
      (b.bill_type_id = 1 OR b.bill_id IS NULL)
      AND (b.session_id IN (
        SELECT session_id 
        FROM ls_session 
        WHERE prior = 0 
        AND special = 0
      ) OR b.bill_id IS NULL)
    GROUP BY 
      s.state_id,
      s.state_abbr,
      s.state_name
    ORDER BY 
      CASE 
        WHEN s.state_abbr = 'US' THEN 1
        WHEN s.state_abbr = 'DC' THEN 2
        ELSE 3
      END,
      s.state_abbr
  ` as unknown as StateWithBills[];

  return billCounts.map(state => ({
    ...state,
    bill_count: parseInt(state.bill_count.toString(), 10)
  }));
}

export default async function StatesPage() {
  const states = await getStateBillCounts();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section with Aurora */}
      <section className="relative h-[40vh] min-h-[300px]">
        <AuroraBackground>
          <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
            <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white text-center mb-4">
              Legislative Analysis by State
            </h1>
            <p className="text-lg md:text-xl text-zinc-700 dark:text-neutral-200 text-center max-w-3xl mx-auto">
              Explore our analysis of legislative bills across different states, examining their potential impacts on age, disability, gender, race, religion, and veterans.
            </p>
          </div>
        </AuroraBackground>
      </section>

      {/* States Grid Section */}
      <section className="py-12 px-4 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <p className="text-zinc-600 dark:text-zinc-300">
              Click on any state below to explore its legislative impact analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {states.map((state) => (
              <Link
                key={state.code}
                href={`/${state.code.toLowerCase()}`}
                className="group flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    {state.code === 'US' ? (
                      <Image
                        src="/images/Seal_of_the_United_States_Congress.svg"
                        alt={state.name}
                        fill
                        className="object-contain"
                      />
                    ) : state.code === 'DC' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                          DC
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={`/images/states/${state.code.toLowerCase()}.svg`}
                        alt={state.name}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                    {state.name}
                  </h3>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {new Intl.NumberFormat().format(state.bill_count)} bills
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
} 