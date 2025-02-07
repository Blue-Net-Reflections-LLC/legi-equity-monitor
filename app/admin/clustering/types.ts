export type ClusterStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'no_theme';

export type ClusterType = 
  | 'bills'
  | 'amendments'
  | 'resolutions';

export interface ClusterListItem {
  cluster_id: string
  bill_count: number
  state_count: number
  min_date: string
  status: ClusterStatus
  executive_summary: string
  created_at: string
  updated_at: string
}

export interface ClusterFilters {
  week: number
  year: number
  status?: ClusterStatus
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
  total: number
}

export type SetPaginationState = (state: Partial<PaginationState>) => void

export type SortingState = Array<{
  id: string
  desc: boolean
}>

export type ColumnFiltersState = Array<{
  id: string
  value: unknown
}>

export type ClusterAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ClusterDetail {
  cluster_id: string;
  cluster_name: string | null;
  min_date: string;
  max_date: string;
  bill_count: number;
  state_count: number;
  cluster_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClusterAnalysis {
  analysis_id: string;
  cluster_id: string;
  status: ClusterAnalysisStatus;
  executive_summary: string | null;
  policy_impacts: Record<string, string | string[]> | null;
  risk_assessment: Record<string, string> | null;
  future_outlook: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClusterBill {
  bill_id: number;
  distance_to_centroid: number;
  membership_confidence: number;
  added_at: string;
  bill_number: string;
  title: string;
  description: string;
  status_date: string;
  state_abbr: string;
  state_name: string;
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  categories: Array<{
    category: string;
    bias_score: number;
    positive_impact_score: number;
  }> | null;
}

export interface ClusterDetailState {
  cluster: ClusterDetail | null;
  analysis: ClusterAnalysis | null;
  bills: ClusterBill[];
  loading: boolean;
  error: string | null;
}

export interface ClusterStats {
  actual_bill_count: number;
  actual_state_count: number;
  min_confidence: number;
  avg_confidence: number;
  max_confidence: number;
  earliest_bill_date: string;
  latest_bill_date: string;
  analysis_count: number;
  blog_post_count: number;
}

export type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null; 