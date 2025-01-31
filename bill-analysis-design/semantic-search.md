<think>
Okay, let's break down how I arrived at the implementation plan for the vector search feature.

First, I considered the user's requirements: adding search for bills and sponsors using vector search with a specific model, integrating with their existing PostgreSQL database, and ensuring the indexing pipeline tracks changes using the existing changed_hash. They also mentioned not including bill analysis data in the index.

The user had previously discussed using a single table for both bills and sponsors, so I needed to consolidate the schema. The key was to leverage the existing changed_hash from the ls_bills table for efficient change detection. I decided on a single VectorIndex table with entity_type to distinguish between bills and sponsors, including state information for relevance.

Next, for the indexing pipeline, I thought about how to handle batches efficiently, especially with GPU acceleration. Using SentenceTransformers with PyTorch made sense, and checking for GPU availability ensures optimal performance. The pipeline needed to process bills and sponsors separately, generating search text that includes state names and abbreviations for better search accuracy.

On the search API side, I realized the need to preprocess queries to handle state names and abbreviations, then generate embeddings. The SQL query combines cosine similarity with state keyword matching to boost relevance. Pagination and limits ensure performance.

For the frontend, using Web Workers prevents the UI from freezing during embedding generation. Debouncing input reduces unnecessary API calls, and prioritizing sponsor matches aligns with the user's initial preference.

Migrations were straightforward with pgvector, but I included the necessary SQL extensions and indexes. Testing considerations focused on edge cases like state name variations and similar bill numbers across states.

Finally, monitoring and scaling steps ensure the system remains efficient as data grows. I made sure each part of the plan addressed the user's requirements while keeping the implementation simple and maintainable.
</think>

Here's a step-by-step implementation plan for the vector search system:

### 1. Database Migrations
```sql:prisma/migrations/20240618000000_add_vector_search.sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector index table
CREATE TABLE vector_index (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(7) NOT NULL CHECK (entity_type IN ('bill', 'sponsor')),
    entity_id INTEGER NOT NULL,
    search_text TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    source_hash VARCHAR(64) NOT NULL,
    state_abbr CHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entity_type, entity_id)
);

-- Create composite index for efficient search
CREATE INDEX idx_vector_search ON vector_index 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 2. Python Indexing Service
```python:services/vector_indexer.py
import torch
from sentence_transformers import SentenceTransformer
from sqlalchemy import update, select
from sqlalchemy.dialects.postgresql import insert

class VectorIndexer:
    def __init__(self, db_session):
        self.db = db_session
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = SentenceTransformer('Xenova/all-MiniLM-L6-v2', device=self.device)
        
    async def index_bills(self, batch_size=100):
        # Get bills needing update
        bills = await self.db.fetch(
            select([ls_bills]).where(
                ls_bills.c.changed_hash != select([vector_index.c.source_hash])
                .where(vector_index.c.entity_id == ls_bills.c.bill_id)
                .where(vector_index.c.entity_type == 'bill')
                .correlate(ls_bills)
                .as_scalar()
            ).limit(batch_size)
        )
        
        # Process bills
        texts = [
            f"{b.state_name} {b.state_abbr} {b.bill_number} {b.title} {b.description}"
            for b in bills
        ]
        embeddings = self.model.encode(texts, convert_to_tensor=True, device=self.device)
        
        # Upsert to vector_index
        stmt = insert(vector_index).values([
            {
                'entity_type': 'bill',
                'entity_id': b.bill_id,
                'search_text': text,
                'embedding': embedding.tolist(),
                'source_hash': b.changed_hash,
                'state_abbr': b.state_abbr,
                'state_name': b.state_name
            }
            for b, text, embedding in zip(bills, texts, embeddings)
        ]).on_conflict_do_update(
            index_elements=['entity_type', 'entity_id'],
            set_={
                'search_text': excluded.search_text,
                'embedding': excluded.embedding,
                'source_hash': excluded.source_hash,
                'indexed_at': func.now()
            }
        )
        
        await self.db.execute(stmt)

    # Similar method for sponsors
```

### 3. Search API Endpoint
```typescript:app/api/search/route.ts
export async function POST(req: Request) {
  const { query, stateFilter } = await req.json();
  
  // 1. Preprocess query
  const processedQuery = query.toLowerCase()
    .replace(/\bgeorgia\b/gi, 'georgia ga')
    .replace(/\bcalifornia\b/gi, 'california ca');
    // ... add other state expansions

  // 2. Generate embedding
  const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await model(processedQuery, { pooling: 'mean' });
  const embedding = Array.from(output.data);
  
  // 3. Search database
  const results = await prisma.$queryRaw`
    SELECT 
      entity_type,
      entity_id,
      0.8 * (1 - (embedding <=> ${embedding}::vector)) +
      0.2 * SIMILARITY(search_text, ${processedQuery}) AS relevance
    FROM vector_index
    WHERE 
      entity_type IN ('bill', 'sponsor')
      AND (search_text ILIKE ${`%${processedQuery}%`} OR ${processedQuery} = '')
    ORDER BY relevance DESC
    LIMIT 20
  `;
  
  return NextResponse.json(results);
}
```

### 4. Frontend Components
```typescript:components/SearchModal.tsx
const SearchModal = () => {
  const [results, setResults] = useState<{bills: Bill[], sponsors: Sponsor[]}>({bills: [], sponsors: []});
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/search.worker.ts', import.meta.url));
    workerRef.current.onmessage = (event) => setResults(event.data);
    return () => workerRef.current?.terminate();
  }, []);

  const handleSearch = useDebounce((query: string) => {
    workerRef.current?.postMessage({ query });
  }, 300);

  return (
    <div className="search-modal">
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search bills and sponsors..."
      />
      <div className="results">
        {results.sponsors.map(sponsor => (
          <SponsorResult key={sponsor.id} {...sponsor} />
        ))}
        {results.bills.map(bill => (
          <BillResult key={bill.bill_id} {...bill} />
        ))}
      </div>
    </div>
  );
};
```

### Implementation Phases

1. **Database Setup** (1 day)
   - Run pgvector migration
   - Create vector_index table
   - Add state abbreviations to sponsors table

2. **Indexing Service** (2 days)
   - Bill indexing with GPU support
   - Sponsor indexing
   - Cron job setup (hourly updates)

3. **Search API** (1 day)
   - Query preprocessing
   - Embedding generation
   - Hybrid search implementation

4. **UI Components** (2 days)
   - Search modal component
   - Web Worker integration
   - Result rendering with virtual scrolling

5. **Optimizations** (1 day)
   - Query debouncing
   - Result caching
   - State-aware scoring

### Key Testing Scenarios
1. Search for "GA HB 102" (exact bill number)
2. Search for "Smith education" (sponsor name + topic)
3. Search for "Texas tax bill" (state + topic)
4. Search for "CA representative Johnson" (state + sponsor)

### Monitoring Metrics
1. Index freshness (time between bill update and indexing)
2. Search latency (75th percentile < 500ms)
3. Cache hit rate (aim for >40% on common queries)
4. GPU utilization during indexing

Would you like me to elaborate on any specific component or provide the Web Worker implementation details next?
