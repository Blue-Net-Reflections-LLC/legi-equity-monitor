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

export interface ClusterDetail extends ClusterListItem {
  bills: {
    bill_id: number
    title: string
    state: string
    status: string
  }[]
}

export type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null; 