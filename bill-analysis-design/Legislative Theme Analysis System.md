# Legislative Theme Analysis System


````mermaid
sequenceDiagram
    participant Scheduler
    participant ClusterService
    participant Database
    participant MLService
    participant LLMService
    participant Cache
    participant UI

    Note over Scheduler,UI: Weekly Clustering Pipeline
    Scheduler->>ClusterService: Trigger Weekly Analysis
    activate ClusterService
    
    ClusterService->>Database: Fetch Bill Embeddings (384-dim)
    activate Database
    Database-->>ClusterService: Return embeddings + metadata
    deactivate Database
    
    ClusterService->>MLService: Request Dimensionality Reduction
    activate MLService
    MLService->>MLService: UMAP (384→128 dim)
    MLService-->>ClusterService: Reduced embeddings
    deactivate MLService
    
    ClusterService->>MLService: Request Clustering
    activate MLService
    MLService->>MLService: HDBSCAN (min_size=15)
    MLService-->>ClusterService: Cluster labels
    deactivate MLService
    
    ClusterService->>Database: Store Clusters
    activate Database
    Database-->>ClusterService: Storage confirmation
    deactivate Database
    
    par LLM Processing
        ClusterService->>LLMService: Process Cluster 1
        activate LLMService
        LLMService->>LLMService: Quen 2.5 Max Analysis
        LLMService-->>ClusterService: Blog content
        deactivate LLMService
        
        ClusterService->>LLMService: Process Cluster 2
        activate LLMService
        LLMService->>LLMService: Quen 2.5 Max Analysis
        LLMService-->>ClusterService: Blog content
        deactivate LLMService
        
        Note right of LLMService: Parallel processing of clusters
    end
    
    ClusterService->>Database: Store Blog Posts
    activate Database
    Database-->>ClusterService: Storage confirmation
    deactivate Database
    
    ClusterService->>Cache: Invalidate CDN
    activate Cache
    Cache-->>ClusterService: Invalidation complete
    deactivate Cache
    
    ClusterService-->>Scheduler: Pipeline complete
    deactivate ClusterService
    
    UI->>Database: Fetch Latest Posts
    activate Database
    Database-->>UI: Return blog list
    deactivate Database
    
    UI->>UI: Render Reverse Chronological List
    UI->>Cache: Load Assets
    activate Cache
    Cache-->>UI: Return cached content
    deactivate Cache

    Note over Scheduler,UI: Error Handling Path
    alt Processing Error
        ClusterService->>ClusterService: Retry (max 3x)
        ClusterService->>Database: Log Failure
        ClusterService-->>Scheduler: Error Report
    end
````
---

## Core Component Updates

### 1. Embedding Specifications
- **Vector Dimensions**: 384 (reduced from 768)
- **Embedding Contents**:
  ```python
  {
      "title": str,           # Bill title
      "description": str,     # Full legislative text summary
      "state_name": str,      # Full state name
      "state_abbrev": str,    # 2-letter state code
  }
  ```

### 2. Clustering Engine Modifications

#### Dimensionality Reduction
````python
UMAP(
    n_components=128,         # Down from 50 to 384→128
    n_neighbors=25,           # Increased neighbor count
    metric='cosine',
    random_state=42
)
````

#### Cluster Identification
````python
HDBSCAN(
    min_cluster_size=15,      # Increased minimum size
    cluster_selection_epsilon=0.35,
    min_samples=5,
    metric='cosine'
)
````

### 3. LLM Configuration
- **Model**: Quen 2.5 Max
- **Context Window**: 1M tokens
- **Max Cluster Analysis**:
  - ~2,500 bills per analysis (avg 400 tokens/bill)
  - 50% capacity buffer for system prompts

---

## Revised Database Schema

````sql
ALTER TABLE legislation_clusters
ALTER COLUMN centroid_vector TYPE VECTOR(384);

CREATE TABLE llm_analysis_context (
    analysis_id UUID PRIMARY KEY,
    cluster_id UUID REFERENCES legislation_clusters,
    input_token_count INT CHECK (input_token_count <= 1000000),
    llm_parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
````

---

## Updated Blog Generation Process

### Context Assembly Optimization
````python
def prepare_cluster_context(cluster_bills: List[Bill], max_tokens=900000):
    """Smart context selection for 1M token window"""
    context = []
    token_count = 0
    
    # Priority order: 
    # 1. Committee leadership bills
    # 2. Cross-state duplicates
    # 3. Recent amendments
    # 4. Random sampling
    
    for bill in prioritized_bills:
        bill_text = f"{bill.title}\n{bill.description[:2000]}"
        estimated_tokens = len(bill_text) // 4  # Conservative estimate
        
        if token_count + estimated_tokens > max_tokens:
            break
            
        context.append(bill_text)
        token_count += estimated_tokens
    
    return "\n\n".join(context)
````

---

## Quen 2.5 Max Specific Implementation

### Prompt Engineering
````text
SYSTEM: You are a legislative analyst with 20 years of experience. Analyze 
this collection of {bill_count} bills from {cluster_size} states, focusing on:

1. Emerging cross-state policy patterns
2. Partisan alignment indicators
3. Potential implementation challenges
4. Historical context from similar legislation

Structure your analysis with:
- 500-word executive summary
- Top 5 policy impact areas
- Risk assessment matrix
- 3-5 year outlook projection

Use markdown with collapsible sections.
````

### Performance Considerations
- **Throughput**: 1 cluster analysis every 4-6 minutes
- **Cost Optimization**:
  - Batch processing during off-peak hours
  - Context-aware token recycling
  - Semantic caching of similar clusters

---

## Modified Evaluation Metrics

| Category          | New Target                  | Rationale                          |
|-------------------|-----------------------------|-------------------------------------|
| Cluster Size      | 50-800 bills/cluster        | Leverage 1M token context          |
| Analysis Depth    | 10+ cross-references/cluster| Increased context capacity          |
| Temporal Analysis | 3-year trend projections    | Quen's long-term reasoning capacity |

---

## Failure Recovery Updates

### LLM-Specific Fallbacks
1. **Context Overflow Protection**:
   ```python
   if cluster.token_count > 950000:
       apply_hierarchical_analysis(
           cluster.split(subsets=2)
       )
   ```
   
2. **Model Degradation Response**:
   - Automatic quality scoring
   - Human-in-the-loop validation
   - Model rollback capability

---

## Updated Infrastructure Diagram

````mermaid
graph TB
    A[384-Dim Vectors] --> B[UMAP 128-Dim]
    B --> C[HDBSCAN Clustering]
    C --> D[PostgreSQL]
    D --> E[Quen 2.5 Max]
    E --> F[Markdown Validation]
    F --> G[CDN Edge]
    
    subgraph Quen_Optimizations
        E --> H[Token Budgeting]
        E --> I[Context Chunking]
        E --> J[Semantic Cache]
    end
````

---

## Key Advantages of 384-D + Quen 2.5

1. **Enhanced Cluster Resolution**
   - Finer-grained similarity detection
   - Improved noise reduction

2. **Deep Context Analysis**
   - Full legislative text analysis
   - Cross-cluster comparisons
   - Long-term trend modeling

3. **Operational Efficiency**
   - Fewer API calls per cluster
   - Reduced post-processing
   - Higher analysis consistency

---

## Presentation Layer: Next.js Implementation

### 1. UI Architecture
````mermaid
graph TD
    A[Blog List] --> B[Individual Post]
    B --> C[Bill Explorer]
    C --> D[Theme Visualizer]
    
    subgraph Next.js App
        A
        B
        C
        D
        E[API Routes]
    end
    
    E --> F[Database]
    E --> G[Cache Layer]
````

---

### 2. Key Pages and Components

#### Blog List Page (`/app/blog/page.tsx`)
- **Features**:
  - Reverse chronological sorting
  - Infinite scroll with loading states
  - Multi-column layout for desktop
  - Search/filter sidebar

**Data Flow**:
````mermaid
sequenceDiagram
    Browser->>+API Route: GET /api/blog/posts
    API Route->>+PostgreSQL: Query published posts
    PostgreSQL-->>-API Route: Return ordered posts
    API Route-->>-Browser: JSON response
    Browser->>+CDN: Cache assets
    CDN-->>-Browser: Static content
````

---

#### Blog Post Page (`/app/blog/[slug]/page.tsx`)
- **Dynamic Routes**:
  ```typescript
  export async function generateStaticParams() {
    const posts = await getPublishedPosts();
    return posts.map(post => ({ slug: post.post_id }));
  }
  ```
  
- **Features**:
  - ISR (Revalidate every 6 hours)
  - Related bills sidebar
  - Theme evolution timeline
  - Interactive policy maps

**Component Structure**:
````typescript
<BlogPostLayout>
  <ArticleHeader />
  <ThemeImpactChart />
  <BillRelationshipGraph />
  <DynamicTOC />
  <AnalystCommentary />
  <ShareWidget />
</BlogPostLayout>
````

---

### 3. API Routes

#### Blog Post List (`/app/api/blog/posts/route.ts`)
````typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const query = sql`
    SELECT 
      p.*,
      COUNT(b.bill_id)::INT as bill_count
    FROM legislation_blog_posts p
    JOIN blog_post_bill_associations b ON p.post_id = b.post_id
    WHERE p.publication_status = 'published'
    GROUP BY p.post_id
    ORDER BY p.created_at DESC
    LIMIT ${PAGE_SIZE}
    OFFSET ${parseOffset(searchParams)}
  `;

  // ... implementation ...
}
````

---

### 4. UI Component Library

#### Theme Visualization Components
````typescript
// components/theme/ClusterMap.tsx
export default function ClusterMap({ clusterId }) {
  const { data } = useSWR(`/api/clusters/${clusterId}/geo`, fetcher);
  
  return (
    <ResponsiveChoropleth
      data={data.states}
      features={usStates.features}
      // ... visualization config ...
    />
  );
}
````

---

### 5. Performance Optimizations

**Next.js Config** (`next.config.js`):
````javascript
module.exports = {
  experimental: {
    optimizePackageImports: [
      '@visx/geo',
      'react-markdown',
      'date-fns'
    ],
    isrMemoryCacheSize: 512, // MB
  },
  
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'legiequity.us',
      pathname: '/blog-assets/**',
    }]
  }
};
````

---

### 6. State Management

**Blog UI Context**:
````typescript
// context/BlogContext.tsx
const BlogContext = createContext<{
  activeTheme?: string;
  relatedBills: Bill[];
  setActiveTheme: (theme: string) => void;
}>({ /* ... */ });

export function BlogProvider({ children }) {
  const [state, setState] = useState({ /* ... */ });
  
  return (
    <BlogContext.Provider value={{
      ...state,
      setActiveTheme: (theme) => {/* ... */}
    }}>
      {children}
    </BlogContext.Provider>
  );
}
````

---

### 7. Real-time Features

**WebSocket Integration**:
````typescript
// hooks/useLiveClusters.ts
export function useLiveClusters() {
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'CLUSTER_UPDATE') {
        // Refresh ISR cache
        router.refresh();
      }
    };

    return () => ws.close();
  }, []);
}
````

---

### 8. Accessibility Features

**Semantic Markup**:
````jsx
<article aria-labelledby="post-title">
  <h1 id="post-title">{post.title}</h1>
  <div role="doc-subtitle">{post.subtitle}</div>
  
  <section aria-label="Key findings">
    <ClusterFindings findings={post.findings} />
  </section>
</article>
````

---

### 9. Analytics Integration

**Blog Post Telemetry**:
````typescript
// components/BlogPost.tsx
useEffect(() => {
  if (postId) {
    trackView({
      post_id: postId,
      duration: 0,
      scroll_depth: 0
    });
    
    const scrollListener = () => {/* ... */};
    
    return () => window.removeEventListener('scroll', scrollListener);
  }
}, [postId]);
````

---

### 10. Security Measures

**Content Security Policy**:
````javascript
// middleware.ts
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  const csp = [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: *.votesmart.org",
    "connect-src 'self' api.legiequity.us",
  ];

  // ... apply headers ...
}
````