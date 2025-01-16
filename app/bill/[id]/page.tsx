import sql from '@/lib/db';
import { notFound } from 'next/navigation';
import ImpactBadge from '@/app/components/ImpactBadge';
import SponsorList from './SponsorList';
import RollCallVotes from './RollCallVotes';
import { Bill, Sponsor, RollCall } from '@/types';

export const revalidate = 3600; // Revalidate every hour

const RACE_CODES = {
  AI: 'American Indian/Alaska Native',
  AP: 'Asian/Pacific Islander',
  BH: 'Black/African American',
  WH: 'White'
} as const;

interface BillWithImpacts extends Bill {
  racial_impacts?: Record<string, {
    severity: string;
    impact_type: string;
    analysis_text: string;
  }>;
}

async function getBill(id: number): Promise<BillWithImpacts> {
  const [bill] = await sql<BillWithImpacts[]>`
    WITH bill_impacts AS (
      SELECT 
        ria.bill_id,
        jsonb_object_agg(
          race_code,
          jsonb_build_object(
            'severity', severity,
            'impact_type', impact_type,
            'analysis_text', analysis_text
          )
        ) as racial_impacts
      FROM racial_impact_analysis ria
      JOIN bills b ON b.bill_id = ria.bill_id
      WHERE b.bill_type != 'R'
      GROUP BY ria.bill_id
    )
    SELECT b.*, bi.racial_impacts
    FROM bills b
    LEFT JOIN bill_impacts bi ON b.bill_id = bi.bill_id
    WHERE b.bill_id = ${id}
  `;
  if (!bill) notFound();
  return bill;
}

async function getSponsors(id: number): Promise<Sponsor[]> {
  return sql<Sponsor[]>`
    SELECT s.* FROM sponsors s
    JOIN bill_sponsors bs ON s.sponsor_id = bs.sponsor_id
    WHERE bs.bill_id = ${id}
  `;
}

async function getRollCalls(id: number): Promise<RollCall[]> {
  return sql<RollCall[]>`
    SELECT * FROM roll_calls
    WHERE bill_id = ${id}
    ORDER BY date DESC
  `;
}

export default async function BillPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [bill, sponsors, rollCalls] = await Promise.all([
    getBill(id),
    getSponsors(id),
    getRollCalls(id)
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">{bill.bill_number}: {bill.title}</h1>
        <p className="text-lg mb-8">{bill.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Bill Details</h2>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">Committee</dt>
                <dd>{bill.committee_name}</dd>
              </div>
              <div>
                <dt className="font-medium">Last Action</dt>
                <dd>{bill.last_action} on {new Date(bill.last_action_date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="font-medium">PDF</dt>
                <dd>
                  <a href={bill.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View Bill PDF
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Sponsors</h2>
            <SponsorList sponsors={sponsors} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Roll Call Votes</h2>
            <RollCallVotes rollCalls={rollCalls} />
          </div>
        </div>

        {bill.bill_type !== 'R' && bill.racial_impacts && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Racial Impact Analysis</h2>
            <div className="space-y-6">
              {Object.entries(RACE_CODES).map(([code, name]) => {
                const impact = bill.racial_impacts?.[code];
                if (!impact) return null;
                
                return (
                  <div key={code} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{name}</h3>
                      <ImpactBadge 
                        level={impact.severity as any} 
                        sentiment={impact.impact_type.toLowerCase() as any}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{impact.analysis_text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

