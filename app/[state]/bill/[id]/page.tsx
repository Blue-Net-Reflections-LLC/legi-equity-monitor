import db from "@/lib/db";
import { BillWithImpacts } from "@/app/types";
import { notFound } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import ImpactBadge from "@/app/components/ImpactBadge";
import SponsorList from './SponsorList';
import RollCallVotes from './RollCallVotes';
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import BackButton from './BackButton';

export const revalidate = 3600; // Revalidate every hour

const STATE_NAMES: Record<string, string> = {
  GA: "Georgia",
};

const RACE_CODES = {
  AI: 'American Indian/Alaska Native',
  AP: 'Asian/Pacific Islander',
  BH: 'Black/African American',
  WH: 'White'
} as const;

interface Sponsor {
  sponsor_id: number;
  name: string;
  district: string;
  party: string;
}

interface RollCall {
  roll_call_id: number;
  bill_id: number;
  date: Date;
  description: string;
  yea: number;
  nay: number;
  nv: number;
  exc: number;
  result: string;
}

async function getBill(stateCode: string, billId: string): Promise<BillWithImpacts | null> {
  const [bill] = await db`
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
    WHERE b.bill_id = ${parseInt(billId)}
  `;

  return bill as unknown as BillWithImpacts;
}

async function getSponsors(billId: string): Promise<Sponsor[]> {
  return db`
    SELECT s.* FROM sponsors s
    JOIN bill_sponsors bs ON s.sponsor_id = bs.sponsor_id
    WHERE bs.bill_id = ${parseInt(billId)}
  `;
}

async function getRollCalls(billId: string): Promise<RollCall[]> {
  return db`
    SELECT * FROM roll_calls
    WHERE bill_id = ${parseInt(billId)}
    ORDER BY date DESC
  `;
}

export default async function BillPage({ 
  params 
}: { 
  params: { state: string; id: string } 
}) {
  const stateCode = params.state.toUpperCase();
  const stateName = STATE_NAMES[stateCode];
  
  if (!stateName) {
    notFound();
  }

  const [bill, sponsors, rollCalls] = await Promise.all([
    getBill(stateCode, params.id),
    getSponsors(params.id),
    getRollCalls(params.id)
  ]);
  
  if (!bill) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <AuroraBackground className="h-[20vh] min-h-[160px] flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {stateName} Legislature
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
                {bill.bill_number}: {bill.title}
              </h1>
            </div>
            <BackButton />
          </div>
        </div>
      </AuroraBackground>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                Bill Details
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Description
                  </h3>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {bill.description}
                  </p>
                </div>

                {bill.committee_name && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Committee
                    </h3>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {bill.committee_name}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    Last Action
                  </h3>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {bill.last_action}
                    {bill.last_action_date && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                        ({new Date(bill.last_action_date).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                </div>

                {bill.pdf_url && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      PDF
                    </h3>
                    <a 
                      href={bill.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Bill PDF
                    </a>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                Sponsors
              </h2>
              <SponsorList sponsors={sponsors} />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
                Roll Call Votes
              </h2>
              <RollCallVotes rollCalls={rollCalls} />
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-white">
                Racial Impact Analysis
              </h2>
              {bill.racial_impacts ? (
                <div className="space-y-6">
                  {Object.entries(RACE_CODES).map(([code, name]) => {
                    const impact = bill.racial_impacts?.[code];
                    if (!impact) return null;

                    return (
                      <div key={code} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
                            {name}
                          </h3>
                          <ImpactBadge
                            level={impact.severity}
                            sentiment={impact.impact_type.toLowerCase() as 'positive' | 'negative'}
                          />
                        </div>
                        {impact.analysis_text && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            {impact.analysis_text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No impact analysis available
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 