export interface ClusterListItem {
  cluster_id: string
  bill_count: number
  state_count: number
  executive_summary: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'
  created_at: Date
  updated_at: Date
}

export interface ClusterDetail extends ClusterListItem {
  bills: {
    bill_id: number
    title: string
    state: string
    status: string
  }[]
} 