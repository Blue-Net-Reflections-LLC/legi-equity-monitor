import { Metadata } from 'next'
import { notFound } from "next/navigation"
import db from "@/lib/db"
import { STATE_NAMES } from '@/app/constants/states'
import BillPageClient from './BillPageClient'

export const revalidate = 3600 // Revalidate every hour

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
  votesmart_id: string | null;
  sponsor_order: number;
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
  votes: Array<{
    people_id: number;
    name: string;
    party_name: string;
    vote_desc: string;
  }>;
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

interface Props {
  params: { 
    stateCode: string;
    billId: string;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stateCode = params.stateCode.toUpperCase();
  const bill = await getBill(stateCode, params.billId);
  
  if (!bill) {
    return {
      title: 'Bill Not Found - LegiEquity',
      description: 'The requested bill could not be found.',
    }
  }

  const stateName = STATE_NAMES[stateCode] || stateCode;
  const title = `${bill.bill_number}${bill.title !== bill.description ? `: ${bill.title}` : ''}`;
  const description = bill.description.length > 200 
    ? bill.description.substring(0, 197) + '...' 
    : bill.description;

  return {
    title: `${title} - ${stateName} Legislature - LegiEquity`,
    description,
    openGraph: {
      title: `${title} - ${stateName} Legislature`,
      description,
      url: `https://legiequity.us/${params.stateCode.toLowerCase()}/bill/${params.billId}`,
      siteName: 'LegiEquity',
      images: [
        {
          url: `https://legiequity.us/api/og/bill?state=${stateCode}&id=${params.billId}`,
          width: 1200,
          height: 630,
          alt: `${bill.bill_number} - ${stateName} Legislature`,
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${stateName} Legislature`,
      description,
      images: [`https://legiequity.us/api/og/bill?state=${stateCode}&id=${params.billId}`],
    },
  }
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
      bs.sponsor_type_desc,
      bs.sponsor_order,
      p.votesmart_id
    FROM lsv_bill_sponsor bs
    LEFT JOIN ls_people p ON bs.people_id = p.people_id
    WHERE bs.bill_id = ${billId}
    ORDER BY bs.sponsor_order
  `;
}

async function getRollCalls(billId: string): Promise<RollCall[]> {
  const rollCalls = await db`
    SELECT 
      bv.roll_call_id,
      bv.roll_call_date,
      bv.roll_call_desc,
      bv.yea,
      bv.nay,
      bv.nv,
      bv.absent,
      bv.passed,
      bv.roll_call_body_name
    FROM lsv_bill_vote bv
    WHERE bv.bill_id = ${billId}
    ORDER BY bv.roll_call_date DESC
  `;

  // Fetch individual votes for each roll call
  const rollCallsWithVotes = await Promise.all(
    rollCalls.map(async (rollCall) => {
      const votes = await db`
        SELECT 
          bvd.people_id,
          p.name,
          pa.party_name,
          v.vote_desc
        FROM ls_bill_vote_detail bvd
        INNER JOIN ls_people p ON bvd.people_id = p.people_id
        INNER JOIN ls_party pa ON p.party_id = pa.party_id
        INNER JOIN ls_vote v ON bvd.vote_id = v.vote_id
        WHERE bvd.roll_call_id = ${rollCall.roll_call_id}
        ORDER BY p.name
      `;
      
      return {
        roll_call_id: Number(rollCall.roll_call_id),
        roll_call_date: new Date(rollCall.roll_call_date),
        roll_call_desc: String(rollCall.roll_call_desc),
        yea: Number(rollCall.yea),
        nay: Number(rollCall.nay),
        nv: Number(rollCall.nv),
        absent: Number(rollCall.absent),
        passed: Number(rollCall.passed),
        roll_call_body_name: String(rollCall.roll_call_body_name),
        votes: votes.map(v => ({
          people_id: Number(v.people_id),
          name: String(v.name),
          party_name: String(v.party_name),
          vote_desc: String(v.vote_desc)
        }))
      } satisfies RollCall;
    })
  );

  return rollCallsWithVotes;
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

export default async function BillPage({ params }: Props) {
  const stateCode = params.stateCode.toUpperCase();
  
  const [bill, sponsors, rollCalls, history, documents, analysis, amendments] = await Promise.all([
    getBill(stateCode, params.billId),
    getSponsors(params.billId),
    getRollCalls(params.billId),
    getBillHistory(params.billId),
    getBillDocuments(params.billId),
    getBillAnalysis(params.billId),
    getAmendments(params.billId)
  ]);
  
  if (!bill) {
    notFound();
  }

  return (
    <BillPageClient 
      bill={bill}
      sponsors={sponsors}
      rollCalls={rollCalls}
      history={history}
      documents={documents}
      analysis={analysis}
      amendments={amendments}
    />
  );
} 