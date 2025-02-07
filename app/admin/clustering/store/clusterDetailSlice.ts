import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ClusterDetailState, ClusterDetail, ClusterAnalysis, ClusterBill } from '../types';

const initialState: ClusterDetailState = {
  cluster: null,
  analysis: null,
  bills: [],
  loading: false,
  error: null,
};

export const fetchClusterDetail = createAsyncThunk(
  'clusterDetail/fetchClusterDetail',
  async (clusterId: string) => {
    const response = await fetch(`/api/admin/clustering/${clusterId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cluster details');
    }
    return response.json();
  }
);

export const fetchClusterAnalysis = createAsyncThunk(
  'clusterDetail/fetchClusterAnalysis',
  async (clusterId: string) => {
    const response = await fetch(`/api/admin/clustering/${clusterId}/analysis`);
    if (!response.ok) {
      throw new Error('Failed to fetch cluster analysis');
    }
    return response.json();
  }
);

export const fetchClusterBills = createAsyncThunk(
  'clusterDetail/fetchClusterBills',
  async (clusterId: string) => {
    const response = await fetch(`/api/admin/clustering/${clusterId}/bills`);
    if (!response.ok) {
      throw new Error('Failed to fetch cluster bills');
    }
    return response.json();
  }
);

const clusterDetailSlice = createSlice({
  name: 'clusterDetail',
  initialState,
  reducers: {
    resetClusterDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cluster Detail
      .addCase(fetchClusterDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClusterDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.cluster = action.payload;
      })
      .addCase(fetchClusterDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cluster details';
      })
      // Fetch Cluster Analysis
      .addCase(fetchClusterAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClusterAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.analysis = action.payload;
      })
      .addCase(fetchClusterAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cluster analysis';
      })
      // Fetch Cluster Bills
      .addCase(fetchClusterBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClusterBills.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = action.payload;
      })
      .addCase(fetchClusterBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cluster bills';
      });
  },
});

export const { resetClusterDetail } = clusterDetailSlice.actions;
export default clusterDetailSlice.reducer; 