# Admin Clustering Analysis UI Design

## User Requirements
New task to document the approach, no coding please:

Hey, May I get you help providing a technical solution for a Admin Clustering Analysis UI with data stored in the cluster_analysis table in DB to:
(1) Display all clusters for a given week in a year.  The display (table?) shall display the number of bills affected.  Paritial of the executive summary, Analysis status, created and updated dates, there should be an action panel (or column) to execute actions like Create Blog Post, reanalyze (placeholder), change status, "Pending", "no_theme"

(2) Display needs to be paginated 

(3) Data must be fetched into the UI and under the protected /admin endpoint.

(4) When user clicks a Analysis Cluster, they are taking to a detail page where the following sensible fields are display:
- Add data in the Display all clusters view
- Complete execute summary
- cluster and analysis ids 
- Bills affected
- Staes affected
- Analysis results from the cluster_analysis
- a summary of demographic groups in charts.  See @001_create_bill_analysis_tables.sql 
- Action panel similar to the requirements in the display all groups.

This is brainstorm and reasoning task for the approach and documentation into @admin-ui-clustering.md 


## Overview
This document outlines the technical approach for implementing an administrative interface for managing and viewing cluster analysis results. The interface uses Client-Side Rendering (CSR) with Next.js for dynamic data loading and interaction.

## Database Schema (Existing)
The UI will primarily interact with these tables:
- `cluster_analysis`: Main table storing cluster information and analysis results
- `cluster_bills`: Maps bills to clusters
- `bill_analysis_results`: Contains bill-level analysis data
- `bill_analysis_category_scores`: Category-level demographic impact scores
- `bill_analysis_subgroup_scores`: Detailed subgroup impact analysis

## UI Components Structure

### 1. Cluster List View (`/admin/clustering`)
#### Layout
- Client-side rendered data table using TanStack Table (React Table v8)
- Filter controls for week/year selection
- Action panel for bulk operations

#### Table Implementation
Using TanStack Table for advanced features:
```typescript
// Table configuration
const table = useReactTable({
  data: clusters,
  columns: [
    {
      id: 'cluster_id',
      header: 'Cluster ID',
      cell: ({ row }) => (
        <Link href={`/admin/clustering/${row.original.cluster_id}`}>
          {row.original.cluster_id}
        </Link>
      )
    },
    {
      id: 'bill_count',
      header: 'Bills',
      cell: ({ row }) => row.original.bill_count
    },
    {
      id: 'executive_summary',
      header: 'Summary',
      cell: ({ row }) => truncateText(row.original.executive_summary, 100)
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />
    },
    {
      id: 'dates',
      header: 'Dates',
      cell: ({ row }) => (
        <DateDisplay 
          created={row.original.created_at}
          updated={row.original.updated_at}
        />
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ClusterActions cluster={row.original} />
    }
  ],
  state: {
    sorting,
    pagination,
    columnFilters
  },
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel()
})
```

#### Week Selection Implementation
```typescript
interface WeekRange {
  week: number;  // 1-53
  year: number;
  startDate: Date;
  endDate: Date;
}

// Helper function to get week ranges
function getWeekRanges(year: number): WeekRange[] {
  const ranges: WeekRange[] = [];
  for (let week = 1; week <= 53; week++) {
    // Get first day of the week (Monday)
    const firstDay = new Date(year, 0, 1);
    while (firstDay.getDay() !== 1) {
      firstDay.setDate(firstDay.getDate() + 1);
    }
    firstDay.setDate(firstDay.getDate() + (week - 1) * 7);
    
    // Get last day of the week (Sunday)
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);

    // Only include weeks that fall within the year
    if (lastDay.getFullYear() === year) {
      ranges.push({
        week,
        year,
        startDate: firstDay,
        endDate: lastDay
      });
    }
  }
  return ranges;
}

// Week selector component
function WeekSelector({ 
  selectedWeek,
  selectedYear,
  onSelect
}: {
  selectedWeek: number;
  selectedYear: number;
  onSelect: (week: number, year: number) => void;
}) {
  const weeks = getWeekRanges(selectedYear);
  
  return (
    <Select
      value={selectedWeek}
      onValueChange={(week) => onSelect(parseInt(week), selectedYear)}
    >
      {weeks.map((range) => (
        <SelectItem key={range.week} value={range.week}>
          Week {range.week}: {format(range.startDate, 'MMM d')} - {format(range.endDate, 'MMM d')}
        </SelectItem>
      ))}
    </Select>
  );
}

// Usage in filters
function ClusterFilters() {
  const { 
    filters: { week, year },
    setFilters,
    loading 
  } = useCluster();
  
  const handleWeekSelect = (selectedWeek: number, selectedYear: number) => {
    setFilters({
      week: selectedWeek,
      year: selectedYear
    });
  };

  return (
    <div className="flex gap-4">
      <YearSelector
        value={year}
        onChange={(selectedYear) => handleWeekSelect(week, selectedYear)}
        disabled={loading}
      />
      <WeekSelector
        selectedWeek={week}
        selectedYear={year}
        onSelect={handleWeekSelect}
        disabled={loading}
      />
    </div>
  );
}
```

The week selection implementation:
1. Supports ISO week numbering (weeks 1-53)
2. Calculates proper date ranges for each week
3. Handles year boundaries correctly
4. Provides formatted date ranges for better UX
5. Integrates with the existing filter system

#### Data Loading Pattern
```typescript
// Custom hook for cluster data fetching
function useClusterData(filters: ClusterFilters) {
  const { data, error, isLoading } = useSWR(
    ['/admin/api/clustering', filters],
    ([url, filters]) => fetchClusters(url, filters)
  )

  return {
    clusters: data?.clusters ?? [],
    totalCount: data?.totalCount ?? 0,
    isLoading,
    error
  }
}

// Component implementation
function ClusterList() {
  const [filters, setFilters] = useState<ClusterFilters>(defaultFilters)
  const { clusters, isLoading, error } = useClusterData(filters)

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  // Table instance and rendering...
}
```

### 2. Cluster Detail View (`/admin/clustering/[clusterId]`)
#### Layout
- Two-column layout
  - Left: Metadata and actions
  - Right: Analysis results and charts

#### Sections
1. **Header**
   - Cluster/Analysis IDs
   - Status Badge
   - Created/Updated Dates
   - Action Panel

2. **Summary Section**
   - Complete Executive Summary
   - Bills Count
   - Affected States List

3. **Analysis Results**
   - Policy Impacts
   - Risk Assessment
   - Future Outlook

4. **Demographic Impact Charts**
   - Category Distribution Chart
   - Subgroup Impact Breakdown
   - State-wise Distribution

#### Charts Implementation
Using Recharts for visualization:
1. **Category Impact Chart**
   - Bar chart showing impact scores by category
   - Color coding for positive/negative impact

2. **Demographic Breakdown**
   - Pie charts for each category showing subgroup distribution
   - Tooltip with detailed scores

3. **Geographic Distribution**
   - US map showing affected states
   - Color intensity based on bill count

## State Management
Using individual contexts for feature-specific state, with AdminContext for shared UI state:

```typescript
// AdminContext - Only for truly shared state
interface AdminState {
  // UI state
  sidebarExpanded: boolean;
  activeSection: string | null;
  
  // Global state
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// ClusterContext - Manages clustering-specific state
interface ClusterState {
  items: ClusterListItem[];
  currentCluster: ClusterDetail | null;
  filters: {
    week: number;
    year: number;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme';
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// BlogContext - Manages blog-specific state
interface BlogState {
  posts: BlogPost[];
  filters: {
    status?: 'draft' | 'published';
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// Example of cross-context interaction
function useClusterToBlog() {
  const { setLoading, setError } = useAdmin();
  const { refreshPosts } = useBlog();
  
  const createBlogPostFromCluster = async (clusterId: string) => {
    setLoading('blog-creation', true);
    try {
      // API call with just the ID
      await fetch(`/admin/api/clustering/${clusterId}/blog`, {
        method: 'POST'
      });
      // Refresh blog posts after creation
      await refreshPosts();
    } catch (error) {
      setError('blog-creation', error.message);
    } finally {
      setLoading('blog-creation', false);
    }
  };
  
  return { createBlogPostFromCluster };
}

// Example usage in a component
function ClusterActions({ clusterId }: { clusterId: string }) {
  const { loading } = useAdmin();
  const { createBlogPostFromCluster } = useClusterToBlog();
  
  return (
    <Button 
      onClick={() => createBlogPostFromCluster(clusterId)}
      disabled={loading['blog-creation']}
    >
      Create Blog Post
    </Button>
  );
}

// Provider structure
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      {/* Each section manages its own state */}
      <ClusterProvider>
        <BlogProvider>
          {children}
        </BlogProvider>
      </ClusterProvider>
    </AdminProvider>
  );
}
```

Benefits of this approach:
1. **Clear Separation of Concerns**
   - Each feature manages its own state
   - AdminContext only handles truly shared state
   - Better code organization

2. **Minimal Cross-Context Dependencies**
   - Features communicate through APIs using IDs
   - Reduced state synchronization issues
   - Clearer data flow

3. **Simpler State Management**
   - Each context is focused and specific
   - Easier to maintain and debug
   - More predictable state updates

4. **Better API Design**
   - Endpoints accept minimal required data (IDs)
   - Clearer API boundaries
   - More maintainable backend integration

5. **Improved Testing**
   - Easier to test individual features
   - Clearer mocking boundaries
   - Simpler test setup

Example of cross-feature interaction:
```typescript
// Creating a blog post from a cluster
async function createBlogPost(clusterId: string) {
  // 1. Only pass the ID to the API
  const response = await fetch(`/admin/api/clustering/${clusterId}/blog`, {
    method: 'POST'
  });
  
  // 2. API handles all the logic server-side
  // 3. Return new blog post ID
  const { blogPostId } = await response.json();
  
  // 4. Optionally navigate to new post
  router.push(`/admin/blog/${blogPostId}`);
}

// Analyzing bills in a cluster
async function analyzeBills(clusterId: string) {
  // 1. Only pass the ID
  await fetch(`/admin/api/clustering/${clusterId}/analyze`, {
    method: 'POST'
  });
  
  // 2. Refresh cluster data
  await refreshClusterData(clusterId);
}
```

## API Routes
Protected routes under `/admin/api/clustering`:

1. **List Clusters**
   ```
   GET /admin/api/clustering?page={page}&week={week}&year={year}
   ```

2. **Cluster Details**
   ```
   GET /admin/api/clustering/{clusterId}
   ```

3. **Update Status**
   ```
   PATCH /admin/api/clustering/{clusterId}/status
   ```

4. **Create Blog Post**
   ```
   POST /admin/api/clustering/{clusterId}/blog
   ```

5. **Analyze Cluster**
   ```
   POST /admin/api/clustering/{clusterId}/analyze
   ```

Benefits of `/admin/api` prefix:
1. **Enhanced Security**
   - Clear separation between admin and public APIs
   - Easier to protect all admin routes at the middleware level
   - Reduced risk of accidentally exposing admin endpoints

2. **Middleware Configuration**
   ```typescript
   // middleware.ts
   export const config = {
     matcher: [
       // Protect all admin routes including API
       '/admin/:path*',
       '/admin/api/:path*'
     ]
   }
   ```

3. **Route Organization**
   ```typescript
   // app/admin/api/clustering/[clusterId]/route.ts
   import { auth } from '@/app/(auth)/auth'
   import { ADMIN_ROLES } from '@/app/constants/user-roles'

   export async function GET(
     request: Request,
     { params: { clusterId } }: { params: { clusterId: string } }
   ) {
     const session = await auth()
     
     // 1. Check authentication
     if (!session) {
       return new Response('Unauthorized', { status: 401 })
     }

     // 2. Check admin role
     if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
       return new Response('Forbidden', { status: 403 })
     }

     // 3. Process request
     // ...
   }
   ```

4. **API Client Configuration**
   ```typescript
   // lib/api.ts
   const adminApi = {
     clusters: {
       list: (params: ClusterListParams) => 
         fetch(`/admin/api/clustering?${new URLSearchParams(params)}`),
       
       get: (clusterId: string) => 
         fetch(`/admin/api/clustering/${clusterId}`),
       
       updateStatus: (clusterId: string, status: string) =>
         fetch(`/admin/api/clustering/${clusterId}/status`, {
           method: 'PATCH',
           body: JSON.stringify({ status })
         }),
       
       createBlogPost: (clusterId: string) =>
         fetch(`/admin/api/clustering/${clusterId}/blog`, {
           method: 'POST'
         }),
         
       analyze: (clusterId: string) =>
         fetch(`/admin/api/clustering/${clusterId}/analyze`, {
           method: 'POST'
         })
     }
   }
   ```

This structure ensures:
1. All admin API routes are consistently protected
2. Clear separation between admin and public APIs
3. Easy to add role-based access control
4. Centralized admin API client
5. Better organization of admin-specific route handlers

## Client-Side Data Management
1. **SWR Configuration**
   ```typescript
   // Global SWR configuration
   export const swrConfig = {
     fetcher: async (url: string) => {
       const res = await fetch(url)
       if (!res.ok) throw new Error('API error')
       return res.json()
     },
     revalidateOnFocus: false,
     revalidateOnReconnect: true,
     dedupingInterval: 10000
   }
   ```

2. **Optimistic Updates**
   ```typescript
   // Example of optimistic update for status change
   const updateClusterStatus = async (clusterId: string, newStatus: string) => {
     // Optimistically update the UI
     mutate(
       '/admin/api/clustering',
       (data) => ({
         ...data,
         clusters: data.clusters.map((c) =>
           c.id === clusterId ? { ...c, status: newStatus } : c
         ),
       }),
       false
     )

     // Make the API call
     await fetch(`/admin/api/clustering/${clusterId}/status`, {
       method: 'PATCH',
       body: JSON.stringify({ status: newStatus }),
     })

     // Revalidate the data
     mutate('/admin/api/clustering')
   }
   ```

## Security Considerations
1. All routes protected by admin middleware
2. Role-based access control for specific actions
3. Input validation for all API endpoints
4. Rate limiting for analysis operations

## Performance Optimizations
1. Client-side pagination and sorting with TanStack Table
2. Optimized database queries using proper indexes
3. SWR caching for frequently accessed data
4. Lazy loading for demographic charts
5. Virtual scrolling for large datasets
6. Debounced search and filter operations

## Error Handling
1. Global error boundary for UI components
2. Graceful degradation for failed API calls
3. User-friendly error messages
4. Retry mechanism for transient failures
5. Optimistic UI updates with rollback

## Future Enhancements
1. Real-time updates for analysis status
2. Bulk operations for multiple clusters
3. Advanced filtering and search
4. Export functionality for analysis results
5. Comparison view for multiple clusters

## Dependencies
- TanStack Table (React Table v8) for data tables
- SWR for data fetching and caching
- Recharts for data visualization
- Tailwind CSS for styling
- React Context for state management

This design leverages modern React patterns with CSR for dynamic data loading and interaction. The combination of TanStack Table for data management and SWR for fetching provides a robust foundation for building a responsive and efficient admin interface.

5. **Error Boundary Implementation**
   ```typescript
   // app/admin/components/AdminErrorBoundary.tsx
   export class AdminErrorBoundary extends React.Component<
     { children: ReactNode },
     { hasError: boolean; error?: Error }
   > {
     constructor(props: { children: ReactNode }) {
       super(props);
       this.state = { hasError: false };
     }

     static getDerivedStateFromError(error: Error) {
       return { hasError: true, error };
     }

     render() {
       if (this.state.hasError) {
         return (
           <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg">
             <h2 className="text-red-600 dark:text-red-400 font-semibold">Something went wrong</h2>
             <p className="text-sm text-red-500 dark:text-red-400 mt-1">
               {this.state.error?.message}
             </p>
           </div>
         );
       }
       return this.props.children;
     }
   }

   // Usage in layout
   export default function AdminLayout({ children }: { children: ReactNode }) {
     return (
       <AdminProvider>
         <AdminErrorBoundary>
           {children}
         </AdminErrorBoundary>
       </AdminProvider>
     );
   }
   ```

6. **Loading States**
   ```typescript
   // Components/LoadingState.tsx
   export function LoadingState({ feature }: { feature: string }) {
     const { loading } = useAdmin();
     
     if (!loading[feature]) return null;
     
     return (
       <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
         <div className="space-y-4">
           <Spinner className="w-8 h-8 text-orange-500" />
           <p className="text-sm text-zinc-600 dark:text-zinc-400">
             Loading {feature}...
           </p>
         </div>
       </div>
     );
   }

   // Usage in components
   function ClusterList() {
     return (
       <div className="relative">
         <LoadingState feature="clusters" />
         {/* Table content */}
       </div>
     );
   }
   ```

7. **API Client Setup**
   ```typescript
   // lib/api/admin.ts
   import { AdminApiError } from './errors';

   export class AdminApiClient {
     private static instance: AdminApiClient;
     private baseUrl = '/admin/api';

     private constructor() {}

     static getInstance(): AdminApiClient {
       if (!this.instance) {
         this.instance = new AdminApiClient();
       }
       return this.instance;
     }

     private async fetch<T>(
       endpoint: string, 
       options?: RequestInit
     ): Promise<T> {
       const response = await fetch(`${this.baseUrl}${endpoint}`, {
         ...options,
         headers: {
           'Content-Type': 'application/json',
           ...options?.headers,
         },
       });

       if (!response.ok) {
         throw new AdminApiError(
           response.statusText,
           response.status,
           await response.json()
         );
       }

       return response.json();
     }

     clusters = {
       list: (params: ClusterListParams) => 
         this.fetch<ClusterListResponse>(
           `/clustering?${new URLSearchParams(params)}`
         ),
       
       get: (clusterId: string) => 
         this.fetch<ClusterDetail>(`/clustering/${clusterId}`),
       
       updateStatus: (clusterId: string, status: string) =>
         this.fetch<void>(`/clustering/${clusterId}/status`, {
           method: 'PATCH',
           body: JSON.stringify({ status })
         }),
       
       createBlogPost: (clusterId: string) =>
         this.fetch<{ blogPostId: string }>(`/clustering/${clusterId}/blog`, {
           method: 'POST'
         }),
         
       analyze: (clusterId: string) =>
         this.fetch<void>(`/clustering/${clusterId}/analyze`, {
           method: 'POST'
         })
     };
   }

   export const adminApi = AdminApiClient.getInstance();
   ```

This structure ensures:
1. All admin API routes are consistently protected
2. Clear separation between admin and public APIs
3. Easy to add role-based access control
4. Centralized admin API client
5. Better organization of admin-specific route handlers

6. **Type-Safe API Client**
   - Singleton pattern for API client
   - Proper error handling and types
   - Consistent request/response handling
   - Centralized configuration

7. **Comprehensive Error Handling**
   - Error boundaries for component failures
   - API error handling and retries
   - User-friendly error messages
   - Proper error typing

8. **Loading State Management**
   - Feature-specific loading states
   - Consistent loading UI
   - Proper loading indicators
   - Prevents user interaction during loading
