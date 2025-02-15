export type ImpactLevel = 'mild' | 'medium' | 'high' | 'urgent';
export type Sentiment = 'POSITIVE' | 'NEGATIVE';

export interface Bill {
  bill_id: string;
  bill_number: string;
  title: string;
  description: string;
  state_abbr: string;
  state_name: string;
  status_desc: string;
  latest_action_date: string | null;
  pending_committee_id?: number;
  pending_committee_name?: string;
  pending_committee_body_name?: string;
  sponsors: Array<{
    people_id: number;
    party: string;
    type: 'Primary' | 'Co';
  }>;
  analysis_results?: {
    overall_score: number;
    overall_sentiment: 'POSITIVE' | 'NEGATIVE';
    bias_detected: boolean;
    categories: {
      [key: string]: {
        score: number;
        sentiment: 'POSITIVE' | 'NEGATIVE';
      };
    };
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
  votesmart_id: string | null;
}

export { type BlogPost } from '@/app/lib/validations/blog'; 