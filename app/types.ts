export type ImpactLevel = 'mild' | 'medium' | 'high' | 'urgent';
export type Sentiment = 'POSITIVE' | 'NEGATIVE';

export interface Bill {
  bill_id: number;
  state_abbr: string;
  bill_number: string;
  status_id: number;
  status_desc: string;
  status_date: Date | null;
  title: string;
  description: string;
  bill_type_id: number;
  bill_type_name: string;
  bill_type_abbr: string;
  body_id: number;
  body_name: string;
  current_body_id: number;
  current_body_name: string;
  pending_committee_id: number | null;
  pending_committee_name: string | null;
  pending_committee_body_name: string | null;
  legiscan_url: string;
  state_url: string;
  state_id: number;
  state_name: string;
  session_id: number;
  session_name: string;
  session_title: string;
  session_year_start: number;
  session_year_end: number;
  session_special?: number;
  session_sine_die?: number;
  session_prior?: number;
}

export interface BillWithImpacts extends Bill {
  racial_impacts?: Record<string, {
    severity: ImpactLevel;
    impact_type: Sentiment;
    analysis_text: string;
  }>;
} 