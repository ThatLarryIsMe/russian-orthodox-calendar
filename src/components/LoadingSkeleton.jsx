/**
 * LoadingSkeleton.jsx
 * Shimmer placeholders shown while liturgical data is loading.
 */

function SkeletonBlock({ height = 'h-4', width = 'w-full', className = '' }) {
  return (
    <div
      className={`shimmer rounded ${height} ${width} ${className}`}
      aria-hidden="true"
    />
  );
}

function SkeletonSection({ title = true, lines = 3 }) {
  return (
    <div className="mb-8">
      {title && <SkeletonBlock height="h-7" width="w-48" className="mb-4" />}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            height="h-4"
            width={i === lines - 1 ? 'w-3/4' : 'w-full'}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8 py-8" aria-label="Loading liturgical content">
      {/* Calendar position skeleton */}
      <div className="bg-parchment-dark rounded-lg p-6">
        <SkeletonBlock height="h-6" width="w-64" className="mb-3" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <SkeletonBlock height="h-12" />
          <SkeletonBlock height="h-12" />
          <SkeletonBlock height="h-12" />
          <SkeletonBlock height="h-12" />
        </div>
      </div>

      {/* Feast skeleton */}
      <SkeletonSection title={true} lines={2} />

      {/* Saint skeleton */}
      <div className="mb-8">
        <SkeletonBlock height="h-7" width="w-48" className="mb-4" />
        <div className="flex gap-6">
          <SkeletonBlock height="h-40" width="w-32" className="flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock height="h-5" width="w-48" />
            <SkeletonBlock height="h-4" />
            <SkeletonBlock height="h-4" />
            <SkeletonBlock height="h-4" width="w-5/6" />
            <SkeletonBlock height="h-4" />
          </div>
        </div>
      </div>

      {/* Readings skeleton */}
      <SkeletonSection title={true} lines={4} />

      {/* Patristic skeleton */}
      <SkeletonSection title={true} lines={5} />
    </div>
  );
}

export function InlineLoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-warm-gray py-2" aria-label={label}>
      <svg
        className="animate-spin h-4 w-4 text-gold"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
}
