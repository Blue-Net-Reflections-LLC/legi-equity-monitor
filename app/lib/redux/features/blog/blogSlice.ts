import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { type TableState } from '../table/types'
import type { BlogPost } from '@/app/lib/validations/blog'

interface BlogFilters {
  status?: string
  author?: string
  dateRange?: { start: Date; end: Date }
  search: string
}

interface BlogState extends TableState<BlogPost, BlogFilters> {
  loading: boolean
  error: string | null
  data: BlogPost[]
  total: number
  posts: BlogPost[]
  filters: {
    status: string
    search: string
  }
  pagination: {
    pageIndex: number
    pageSize: number
    total: number
  }
}

const initialState: BlogState = {
  items: [],
  filters: {
    status: 'all',
    search: ''
  },
  pagination: {
    pageIndex: 0,
    pageSize: 10,
    total: 0
  },
  sorting: [],
  columnFilters: [],
  loading: false,
  error: null,
  data: [],
  total: 0,
  posts: []
}

export const fetchBlogPosts = createAsyncThunk(
  'blog/fetchPosts',
  async ({ pageIndex, pageSize, status, search, sort, order }: { 
    pageIndex: number; 
    pageSize: number; 
    status?: string;
    search?: string;
    sort?: string;
    order?: string;
  }) => {
    const params = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      limit: pageSize.toString()
    });

    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    if (order) params.append('order', order);

    const response = await fetch(`/admin/api/blog/posts?${params}`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  }
);

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.pageIndex = 0
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setSorting: (state, action) => {
      state.sorting = action.payload
    },
    setColumnFilters: (state, action) => {
      state.columnFilters = action.payload
    },
    fetchPostsStart: (state) => {
      state.loading = true
    },
    fetchPostsSuccess: (state, action) => {
      state.loading = false
      state.data = action.payload.data
      state.total = action.payload.total
    },
    fetchPostsFailure: (state, action) => {
      state.loading = false
      state.error = action.payload.message
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogPosts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload.posts
        state.total = action.payload.pagination.total
      })
      .addCase(fetchBlogPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch posts'
      })
  }
})

export const { setItems, setFilters, setPagination, setSorting, setColumnFilters } = blogSlice.actions
export const blogReducer = blogSlice.reducer 