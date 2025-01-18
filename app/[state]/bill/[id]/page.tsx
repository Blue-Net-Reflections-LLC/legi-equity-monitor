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

const RACE_CODES = {
  AI: 'American Indian/Alaska Native',
  AP: 'Asian/Pacific Islander',
  BH: 'Black/African American',
  WH: 'White'
} as const;

interface Sponsor {
  people_id: number;
  name: string;
  party_name: string;
  role_name: string;
  sponsor_type_desc: string;
}

interface RollCall {
  roll_call_id: number;
  roll_call_date: Date;
  roll_call_desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  passed: number;
  roll_call_body_name: string;
}

interface BillHistory {
  history_step: number;
  history_date: Date;
  history_action: string;
  history_body_name: string;
}

async function getBill(stateCode: string, billId: string): Promise<BillWithImpacts | null> {
  const [bill] = await db`
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
      b.bill_type_abbr,
      b.body_id,
      b.body_name,
      b.current_body_id,
      b.current_body_name,
      b.pending_committee_id,
      b.pending_committee_name,
      b.pending_committee_body_name,
      b.legiscan_url,
      b.state_url,
      b.session_id,
      b.session_name,
      b.session_title,
      b.session_year_start,
      b.session_year_end
    FROM lsv_bill b
    WHERE b.state_abbr = ${stateCode.toUpperCase()}
    AND b.bill_id = ${billId}
  `;

  if (!bill) return null;

  return bill as unknown as BillWithImpacts;
}

async function getSponsors(billId: string): Promise<Sponsor[]> {
  return db`
    SELECT 
      bs.people_id,
      bs.name,
      bs.party_name,
      bs.role_name,
      bs.sponsor_type_desc
    FROM lsv_bill_sponsor bs
    WHERE bs.bill_id = ${billId}
    ORDER BY bs.sponsor_order
  `;
}

async function getRollCalls(billId: string): Promise<RollCall[]> {
  return db`
    SELECT 
      roll_call_id,
      roll_call_date,
      roll_call_desc,
      yea,
      nay,
      nv,
      absent,
      passed,
      roll_call_body_name
    FROM lsv_bill_vote
    WHERE bill_id = ${billId}
    ORDER BY roll_call_date DESC
  `;
}

async function getBillHistory(billId: string): Promise<BillHistory[]> {
  return db`
    SELECT 
      bh.history_step,
      bh.history_date,
      bh.history_action,
      bh.history_body_name
    FROM lsv_bill_history bh
    WHERE bh.bill_id = ${billId}
    ORDER BY bh.history_step ASC
  `;
}

export default async function BillPage({ 
  params 
}: { 
  params: { state: string; id: string } 
}) {
  const stateCode = params.state.toUpperCase();
  
  const [bill, sponsors, rollCalls, history] = await Promise.all([
    getBill(stateCode, params.id),
    getSponsors(params.id),
    getRollCalls(params.id),
    getBillHistory(params.id)
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
                {bill.state_name} Legislature • {bill.session_title}
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
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p>{bill.description}</p>
              </div>
            </Card>

            {sponsors.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sponsors</h2>
                <SponsorList sponsors={sponsors} />
              </Card>
            )}

            {rollCalls.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Roll Call Votes</h2>
                <RollCallVotes rollCalls={rollCalls} />
              </Card>
            )}

            {history.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Bill History</h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
                  <div className="space-y-6">
                    {history.map((event) => (
                      <div key={event.history_step} className="relative pl-8">
                        <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 ring-4 ring-white dark:ring-zinc-900" />
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {new Date(event.history_date).toLocaleDateString()}
                        </div>
                        <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                          {event.history_action}
                        </div>
                        {event.history_body_name && (
                          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            {event.history_body_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Current Status
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {bill.status_desc}
                    {bill.status_date && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                        ({new Date(bill.status_date).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Type
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {bill.bill_type_name} ({bill.bill_type_abbr})
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Chamber
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {bill.current_body_name}
                  </div>
                </div>

                {bill.pending_committee_name && (
                  <div>
                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Committee
                    </div>
                    <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                      {bill.pending_committee_name}
                      {bill.pending_committee_body_name && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                          ({bill.pending_committee_body_name})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Session Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Session Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Session
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {bill.session_title}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Period
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {bill.session_year_start}-{bill.session_year_end}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Session Type
                  </div>
                  <div className="mt-1 flex gap-2">
                    {bill.session_special === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Special Session
                      </span>
                    )}
                    {bill.session_sine_die === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Sine Die
                      </span>
                    )}
                    {bill.session_prior === 1 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        Prior Session
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Links Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">External Links</h3>
              <div className="space-y-3">
                <a 
                  href={bill.legiscan_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on LegiScan
                </a>
                <a 
                  href={bill.state_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on State Website
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 