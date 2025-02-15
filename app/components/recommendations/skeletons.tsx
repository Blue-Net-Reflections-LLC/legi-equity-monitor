import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface RecommendationSkeletonProps {
  count?: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

function RecommendationCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}

export function RecommendationsSkeleton({ 
  count = 4, 
  orientation = 'horizontal',
  className 
}: RecommendationSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-4',
      orientation === 'horizontal' 
        ? 'grid-flow-col auto-cols-[minmax(200px,1fr)]'
        : 'grid-cols-1',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <RecommendationCardSkeleton key={i} />
      ))}
    </div>
  );
} 