function BlogCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-4" />
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
    </div>
  );
}

function FeaturedBlogCardSkeleton() {
  return (
    <div className="animate-pulse text-center">
      <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-6" />
      <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mx-auto mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mx-auto" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mx-auto" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mx-auto" />
      </div>
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 mx-auto mt-4" />
    </div>
  );
}

export function BlogSkeleton() {
  return (
    <div className="max-w-[1920px] mx-auto space-y-12">
      {/* Featured Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
        {/* Left Column */}
        <div className="space-y-8 order-2 md:order-1">
          {[1, 2].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>

        {/* Center Column - Featured Post */}
        <div className="md:col-span-2 order-1 md:order-2">
          <FeaturedBlogCardSkeleton />
        </div>

        {/* Right Column */}
        <div className="space-y-8 order-3">
          {[1, 2].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Remaining Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(16)].map((_, i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function RegularGridSkeleton() {
  return (
    <div className="max-w-[1920px] mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[...Array(20)].map((_, i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
} 