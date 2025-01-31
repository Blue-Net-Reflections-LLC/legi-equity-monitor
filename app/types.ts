export type ImpactLevel = 'mild' | 'medium' | 'high' | 'urgent';
export type Sentiment = 'POSITIVE' | 'NEGATIVE';

export interface Bill {
  bill_id: number;
  bill_number: string;
  title: string;
  description: string;
  state_abbr: string;
  state_name: string;
  status_id: number;
  status_desc: string;
  status_date: Date;
  latest_action_date: Date;
  bill_type_id: number;
  bill_type_name: string;
  body_id: number | null;
  body_name: string | null;
  current_body_id: number | null;
  current_body_name: string | null;
  pending_committee_id: number | null;
  pending_committee_name: string | null;
  legiscan_url: string;
  state_url: string;
  session_id: number;
  session_name: string;
  session_title: string;
  session_year_start: number;
  session_year_end: number;
  sponsors?: Array<{
    people_id: number;
    party: string;
    type: 'Primary' | 'Co';
  }>;
  created: Date;
  updated: Date;
  analysis_results?: {
    overall_score: number;
    overall_sentiment: 'POSITIVE' | 'NEGATIVE';
    bias_detected: boolean;
    categories?: Record<string, {
      score: number;
      sentiment: 'POSITIVE' | 'NEGATIVE';
    }>;
  };
}

export interface BillWithImpacts extends Bill {
  racial_impacts?: Record<string, {
    severity: ImpactLevel;
    impact_type: Sentiment;
    analysis_text: string;
  }>;
}

export interface Sponsor {
  people_id: number;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  nickname: string;
  party_id: number;
  party_name: string;
  state_id: number;
  state_abbr: string;
  state_name: string;
  district: string;
  photo_url?: string;
  role_id: number;
  committee_sponsor_id: number;
  person_hash: string;
  created: Date;
  updated: Date;
  body_name: string;
} 