export function BillCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="space-y-3">
        {/* Bill number */}
        <div className="h-4 w-16 bg-gray-200 rounded" />
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
        </div>
        
        {/* Metadata */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
} 