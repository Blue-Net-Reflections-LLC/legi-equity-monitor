export type ImpactLevel = 'mild' | 'medium' | 'high' | 'urgent';
export type Sentiment = 'POSITIVE' | 'NEGATIVE';

export interface Bill {
  bill_id: number;
  bill_number: string;
  bill_type: string;
  title: string;
  description: string;
  committee_name: string | null;
  last_action: string | null;
  last_action_date: Date | null;
  pdf_url: string | null;
  inferred_categories: Record<string, any> | null;
}

export interface BillWithImpacts extends Bill {
  racial_impacts?: Record<string, {
    severity: ImpactLevel;
    impact_type: Sentiment;
    analysis_text: string;
  }>;
} 