import db from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import BackButton from './BackButton';
import SponsorList from './SponsorList';
import RollCallVotes from './RollCallVotes';
import BillAnalysis from './BillAnalysis';

export const revalidate = 3600; // Revalidate every hour

interface Bill {
  bill_id: string;
  bill_number: string;
  title: string;
  description: string;
  state_abbr: string;
  state_name: string;
  status_id: number;
  status_desc: string;
  status_date: Date;
  bill_type_id: number;
  bill_type_name: string;
  bill_type_abbr: string;
  body_id: number;
  body_name: string;
  current_body_id: number;
  current_body_name: string;
  pending_committee_id: number;
  pending_committee_name: string;
  pending_committee_body_name: string;
  legiscan_url: string;
  state_url: string;
  session_id: number;
  session_name: string;
  session_title: string;
  session_year_start: number;
  session_year_end: number;
  session_special: number;
  session_sine_die: number;
  session_prior: number;
}

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

interface BillDocument {
  text_id?: number;
  supplement_id?: number;
  date: Date;
  title: string;
  type_desc: string;
  mime_type: string;
  mime_ext: string;
  size: number;
  legiscan_url: string;
  state_url: string;
}

interface Amendment {
  amendment_id: number;
  amendment_date: Date;
  amendment_title: string;
  amendment_desc: string;
  adopted: number;
  mime_type: string;
  mime_ext: string;
  legiscan_url: string;
  state_url: string;
}

interface BillAnalysis {
  overall_analysis: {
    bias_score: number;
    positive_impact_score: number;
    confidence: 'High' | 'Medium' | 'Low';
  };
  demographic_categories: Array<{
    category: 'race' | 'religion' | 'gender' | 'age' | 'disability' | 'socioeconomic';
    bias_score: number;
    positive_impact_score: number;
    subgroups: Array<{
      code: string;
      bias_score: number;
      positive_impact_score: number;
      evidence: string;
    }>;
  }>;
}

async function getBillDocuments(billId: string): Promise<BillDocument[]> {
  const [texts, supplements] = await Promise.all([
    // Get bill texts
    db`
      SELECT 
        text_id,
        bill_text_date as date,
        bill_text_name as title,
        'Bill Text' as type_desc,
        bill_text_size as size,
        mime_type,
        mime_ext,
        legiscan_url,
        state_url
      FROM lsv_bill_text
      WHERE bill_id = ${billId}
      ORDER BY bill_text_date DESC
    `,
    // Get bill supplements
    db`
      SELECT 
        supplement_id,
        supplement_date as date,
        supplement_type_desc as title,
        supplement_type_desc as type_desc,
        supplement_size as size,
        mime_type,
        mime_ext,
        legiscan_url,
        state_url
      FROM lsv_bill_supplement
      WHERE bill_id = ${billId}
      ORDER BY supplement_date DESC
    `
  ]);

  return [
    ...texts.map((doc) => ({ ...doc, text_id: doc.text_id } as BillDocument)),
    ...supplements.map((doc) => ({ ...doc, supplement_id: doc.supplement_id } as BillDocument))
  ];
}

async function getBill(stateCode: string, billId: string): Promise<Bill | null> {
  const [bill] = await db`
    WITH first_history AS (
      SELECT history_date
      FROM lsv_bill_history
      WHERE bill_id = ${billId}
      ORDER BY history_step ASC
      LIMIT 1
    )
    SELECT 
      b.bill_id,
      b.bill_number,
      b.title,
      b.description,
      b.state_abbr,
      b.state_name,
      b.status_id,
      b.status_desc,
      CASE 
        WHEN b.status_desc = 'Introduced' THEN fh.history_date
        ELSE b.status_date
      END as status_date,
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
      b.session_year_end,
      b.session_special,
      b.session_sine_die,
      b.session_prior
    FROM lsv_bill b
    LEFT JOIN first_history fh ON true
    WHERE b.state_abbr = ${stateCode.toUpperCase()}
    AND b.bill_id = ${billId}
  `;

  if (!bill) return null;

  return bill as Bill;
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

async function getAmendments(billId: string): Promise<Amendment[]> {
  return db`
    SELECT 
      amendment_id,
      amendment_date,
      amendment_title,
      amendment_desc,
      adopted,
      mime_type,
      mime_ext,
      legiscan_url,
      state_url
    FROM lsv_bill_amendment
    WHERE bill_id = ${billId}
    ORDER BY amendment_date DESC
  `;
}

async function getBillAnalysis(billId: string): Promise<BillAnalysis | null> {
  const [result] = await db`
    SELECT 
      bar.overall_bias_score,
      bar.overall_positive_impact_score,
      bar.confidence,
      json_agg(
        json_build_object(
          'category', bacs.category,
          'bias_score', bacs.bias_score,
          'positive_impact_score', bacs.positive_impact_score,
          'subgroups', (
            SELECT json_agg(
              json_build_object(
                'code', bass.subgroup_code,
                'bias_score', bass.bias_score,
                'positive_impact_score', bass.positive_impact_score,
                'evidence', bass.evidence
              )
            )
            FROM bill_analysis_subgroup_scores bass
            WHERE bass.category_score_id = bacs.category_score_id
          )
        )
      ) as demographic_categories
    FROM bill_analysis_results bar
    LEFT JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
    WHERE bar.bill_id = ${billId}
    GROUP BY bar.analysis_id, bar.overall_bias_score, bar.overall_positive_impact_score, bar.confidence
  `;

  if (!result) return null;

  return {
    overall_analysis: {
      bias_score: result.overall_bias_score,
      positive_impact_score: result.overall_positive_impact_score,
      confidence: result.confidence
    },
    demographic_categories: result.demographic_categories || []
  };
}

export default async function BillPage({ 
  params 
}: { 
  params: { state: string; id: string } 
}) {
  const stateCode = params.state.toUpperCase();
  
  const [bill, sponsors, rollCalls, history, documents, analysis, amendments] = await Promise.all([
    getBill(stateCode, params.id),
    getSponsors(params.id),
    getRollCalls(params.id),
    getBillHistory(params.id),
    getBillDocuments(params.id),
    getBillAnalysis(params.id),
    getAmendments(params.id)
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
                {bill.bill_number}{bill.title !== bill.description && `: ${bill.title}`}
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

            <BillAnalysis analysis={analysis} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              {amendments.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Amendments</h2>
                  <div className="space-y-4">
                    {amendments.map((amendment) => (
                      <div 
                        key={amendment.amendment_id}
                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-zinc-900 dark:text-white">
                              {amendment.amendment_title}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              {amendment.amendment_desc}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {amendment.amendment_date && (
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {new Date(amendment.amendment_date).toLocaleDateString()}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                amendment.adopted 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {amendment.adopted ? 'Adopted' : 'Not Adopted'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {amendment.legiscan_url && (
                            <a 
                              href={amendment.legiscan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              View on LegiScan
                            </a>
                          )}
                          {amendment.state_url && (
                            <a 
                              href={amendment.state_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              View on State Site
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {rollCalls.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Roll Call Votes</h2>
                <RollCallVotes rollCalls={rollCalls} />
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

                <div>
                  <div className="mt-2 flex gap-2">
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

            {/* Sponsors Card */}
            {sponsors.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sponsors</h2>
                <SponsorList sponsors={sponsors.sort((a, b) => 
                  a.sponsor_type_desc === 'Primary Sponsor' ? -1 : 
                  b.sponsor_type_desc === 'Primary Sponsor' ? 1 : 0
                )} />
              </Card>
            )}

            {/* Documents Card */}
            {documents.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Documents</h3>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div 
                      key={doc.text_id || doc.supplement_id}
                      className="p-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-zinc-900 dark:text-white text-sm">
                        {doc.title}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        {doc.type_desc} • {new Date(doc.date).toLocaleDateString()} • {(doc.size / 1024).toFixed(1)} KB
                      </div>
                      <div className="flex gap-2 mt-2">
                        {doc.legiscan_url && (
                          <a 
                            href={doc.legiscan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            LegiScan
                          </a>
                        )}
                        {doc.state_url && (
                          <a 
                            href={doc.state_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-100 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            State Site
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

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