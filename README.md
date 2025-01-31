# ⚖ LegiEquity - Legislative Impact Analysis

LegiEquity provides comprehensive analysis of legislative bills across all 50 states, DC, and the US Congress, focusing on their impact on various demographic groups and categories.

Visit us at: https://legiequity.us

## Coverage

- All 50 US States
- District of Columbia
- US Congress
- State-level analysis (Coming Soon)

## Features

### Core Features

#### Search and Discovery
- Advanced semantic and trigram-based search
- Real-time results with performance optimizations
- Comprehensive bill and sponsor information
- State-specific navigation and routing
- Committee-based filtering system

#### Bill Analysis
- Detailed analysis of bills' impact on different demographic groups
- Category-based classification and scoring
- Positive impact and bias assessment
- Evidence-based scoring with source citations

#### Sponsor Analysis
- Comprehensive voting history analysis
- Demographic impact breakdown of sponsored bills
- Category-wise analysis of legislative focus
- Overall positive impact and bias assessment
- Integration with VoteSmart API for legislator photos

### Technical Implementation

#### Advanced Search System
- Hybrid search combining trigram and semantic search capabilities
- Real-time search with debouncing and request cancellation
- Grouped results showing both bills and sponsors
- Fallback to semantic search when exact matches aren't found
- Editorial-driven results for empty queries
- Optimized performance with pre-filtering and similarity thresholds

#### Indexing Service
- Python-based service for processing and indexing legislative data
- Automated bill and sponsor text vectorization
- Integration with OpenAI embeddings for semantic search
- Efficient PostgreSQL vector storage and indexing
- Configurable indexing strategies and batch processing
- Automated data synchronization with LegiScan

#### Bill and Sponsor Results Display
- Bills displayed with state icons and bill numbers
- Sponsors shown with VoteSmart photos or color-coded initials
- Clean, modern UI with proper grouping and categorization
- Instant navigation to detailed bill/sponsor pages
- State-specific routing (e.g., `/[state]/bill/[id]`)

#### Filter System
- Committee-based filtering
- Dynamic filter options based on database content
- Server-side filtering for optimal performance
- Sorted and deduplicated filter options

### Demographic Impact Scoring
Our analysis system evaluates bills across two main dimensions:

1. **Category Level Analysis**
   - Bills are analyzed within broad categories (e.g., Race, Religion, Gender, Age, Disability, Veterans)
   - Each category receives an overall impact score based on aggregated subgroup analysis
   - Scores indicate whether the bill has a positive impact or potential bias

2. **Demographic Subgroup Analysis**
   - Detailed analysis of impact on specific subgroups within each category
   - Each subgroup receives individual scores for:
     - Positive Impact (0-100%): Measures beneficial effects
     - Bias Score (0-100%): Identifies potential negative impacts
   - Neutral scoring when impact is minimal or balanced

## Technology Stack
- Next.js 14 with App Router
- TypeScript for type safety
- PostgreSQL with vector extensions for semantic search
- Python 3.11+ for indexing service
- OpenAI API for embeddings
- Tailwind CSS for styling
- Shadcn/ui for component library
- VoteSmart API integration

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with vector extension
- Python 3.11+
- Git

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd indexing_service
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   cd indexing_service
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Run the indexing service (in a separate terminal):
   ```bash
   cd indexing_service
   python indexer.py
   ```

### Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `VOTESMART_API_KEY`: API key for VoteSmart integration
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `LEGISCAN_API_KEY`: LegiScan API key for bill data

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript compiler
- `python indexer.py`: Run the indexing service
- `python test_setup.py`: Test indexing service configuration

## Coming Soon

- Enhanced Search and Filtering
- State-level Analytics Dashboard
- Impact Blog
- API Access

## About

LegiEquity is a collaboration between VoterAI and Blue Net Reflections, LLC, focused on bringing transparency and insight to legislative analysis through advanced AI technology.

For more information, visit https://legiequity.us

## License

Copyright © 2025 Blue Net Reflections, LLC. All rights reserved.
