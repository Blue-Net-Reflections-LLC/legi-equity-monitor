import { SearchResult } from '../search/SearchDialog';

export interface RecommendationsProps {
  keyphrases: string[];  // Array of phrases to generate embeddings for
  limit?: number;        // Number of results to fetch (default: 4)
  exclude?: {           // Items to exclude from results
    entity_type: 'bill' | 'blog_post';
    entity_id: string | number;
  }[];
  entityType?: 'bill' | 'blog_post';  // Optional filter for specific entity types
  title?: string;       // Section title
  description?: string; // Section description/dek
  orientation?: 'horizontal' | 'vertical';  // Layout direction (default: horizontal)
  itemsPerView?: number; // Number of items to show at once (default: 4)
  loadOnView?: boolean;  // Whether to load when component enters viewport (default: true)
  className?: string;    // Additional CSS classes
}

export interface RecommendationState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  currentPage: number;
} 