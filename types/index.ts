export interface Bill {
  bill_id: number;
  bill_number: string;
  bill_type: string;
  title: string;
  description: string;
  committee_name: string;
  last_action: string;
  last_action_date: string;
  impact_level: 'mild' | 'medium' | 'high' | 'urgent';
  sentiment: 'positive' | 'negative';
  pdf_url: string;
}

export interface Sponsor {
  sponsor_id: number;
  name: string;
  party: string;
  district: string;
  role: string;
}

export interface RollCall {
  roll_call_id: number;
  bill_id: number;
  date: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  passed: boolean;
  chamber: string;
  chamber_id: number;
}

