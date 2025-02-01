export function BillCardSkeleton() {
  return (
    <div className="block transition-all">
      <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm transition-shadow hover:shadow-lg">
        <div className="p-6">
          {/* Top Row: Bill Number, Status, Impact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-6 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-6 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Title */}
          <div className="mt-4">
            <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Description */}
          <div className="mt-2">
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded mt-2 animate-pulse" />
          </div>

          {/* Committee info */}
          <div className="flex items-center gap-2 mt-4">
            <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg !my-4">
            {/* Date */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>

            {/* Support */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>

            {/* Party */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Impact bars */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 