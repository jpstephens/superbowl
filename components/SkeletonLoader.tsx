export function GridSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="grid grid-cols-10 gap-1 mx-auto">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="w-16 h-16 bg-gray-200 rounded-md border-2 border-gray-300"
          />
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="w-12 h-4 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}



