'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateEmbeddings } from '@/app/services/embedding.service';
import { useInView } from 'react-intersection-observer';
import { RecommendationsProps, RecommendationState } from './types';
import { RecommendationsSkeleton } from './skeletons';
import { SearchResult } from '../search/SearchDialog';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bill, BlogPost } from '@/app/types';

export function Recommendations({
  keyphrases,
  limit = 4,
  exclude,
  entityType,
  title,
  description,
  orientation = 'horizontal',
  itemsPerView = 4,
  loadOnView = true,
  className
}: RecommendationsProps) {
  const [state, setState] = useState<RecommendationState>({
    results: [],
    loading: false,
    error: null,
    currentPage: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const router = useRouter();

  const handleNavigate = useCallback((direction: 'next' | 'prev') => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollAmount = direction === 'next' ? itemsPerView : -itemsPerView;
    const itemWidth = container.scrollWidth / state.results.length;
    
    if (orientation === 'horizontal') {
      container.scrollBy({
        left: scrollAmount * itemWidth,
        behavior: 'smooth'
      });
    } else {
      container.scrollBy({
        top: scrollAmount * itemWidth,
        behavior: 'smooth'
      });
    }
  }, [itemsPerView, state.results.length, orientation]);

  const handleItemClick = useCallback((result: SearchResult) => {
    let href: string;
    switch (result.type) {
      case 'bill':
        const bill = result.item as Bill;
        href = `/${bill.state_abbr.toLowerCase()}/bill/${bill.bill_id}`;
        break;
      case 'blog_post':
        const post = result.item as BlogPost;
        href = `/blog/${post.slug}`;
        break;
      default:
        return;
    }
    router.push(href);
  }, [router]);

  const fetchRecommendations = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
debugger
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const embeddings = await generateEmbeddings(keyphrases);
      const response = await fetch('/api/search/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeddings,
          entity_type: entityType,
          limit,
          exclude,
          offset: 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        results: data.results,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load recommendations'
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, [keyphrases, entityType, limit, exclude]);

  useEffect(() => {
    debugger
    if (!loadOnView || inView) {
      fetchRecommendations();
    }
  }, [fetchRecommendations, inView, loadOnView]);

  return (
    <div className={cn(
      "min-h-[300px]", // Reduced minimum height to prevent CLS
      className
    )} ref={inViewRef}>
      {/* Header */}
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {state.loading ? (
        <RecommendationsSkeleton 
          count={itemsPerView} 
          orientation={orientation}
        />
      ) : state.error ? (
        null // Fail silently as requested
      ) : !state.results.length ? (
        null
      ) : (
        /* Navigation Container */
        <div className="relative group">
          {/* Navigation Buttons */}
          {orientation === 'horizontal' ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600 h-24 w-8 rounded-none"
                onClick={() => handleNavigate('prev')}
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600 h-24 w-8 rounded-none"
                onClick={() => handleNavigate('next')}
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-1/2 -top-4 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600 h-24 w-4 rounded-none"
                onClick={() => handleNavigate('prev')}
              >
                <ChevronUp className="h-6 w-6 text-white" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-1/2 -bottom-4 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600 h-24 w-4 rounded-none"
                onClick={() => handleNavigate('next')}
              >
                <ChevronDown className="h-6 w-6 text-white" />
              </Button>
            </>
          )}

          {/* Results Container */}
          <div
            ref={containerRef}
            className={cn(
              'grid gap-4 overflow-hidden scroll-smooth',
              orientation === 'horizontal'
                ? 'grid-flow-col auto-cols-[minmax(200px,1fr)]'
                : 'grid-cols-1',
              'pb-1' // Prevent scrollbar from hiding box-shadow
            )}
          >
            {state.results.map((result, index) => {
              const item = result.type === 'bill' 
                ? (result.item as Bill)
                : (result.item as BlogPost);
                
              const itemKey = result.type === 'bill' 
                ? `${result.type}-${(result.item as Bill).bill_id}-${index}`
                : `${result.type}-${(result.item as BlogPost).post_id}-${index}`;
                
              return (
                <div
                  key={itemKey}
                  className="group/item cursor-pointer"
                  onClick={() => handleItemClick(result)}
                >
                  {/* Image/Icon */}
                  <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {result.type === 'blog_post' && (item as BlogPost).main_image ? (
                      <Image
                        src={(item as BlogPost).main_image!}
                        alt={(item as BlogPost).title}
                        fill
                        className="object-cover transition-transform group-hover/item:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-medium line-clamp-2 group-hover/item:text-primary transition-colors">
                    {result.type === 'bill' ? (item as Bill).bill_number : (item as BlogPost).title}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 