'use client';

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative h-12 w-12">
        {/* Basketball */}
        <div className="absolute inset-0 animate-bounce rounded-full bg-tournament-orange shadow-lg">
          <div className="absolute inset-0 rounded-full border-2 border-orange-800/40" />
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-orange-800/40" />
          <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-orange-800/40" />
        </div>
        {/* Shadow */}
        <div className="absolute -bottom-2 left-1/2 h-2 w-8 -translate-x-1/2 animate-pulse rounded-full bg-white/10" />
      </div>
      <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-navy p-6 border border-white/10">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
