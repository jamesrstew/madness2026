'use client';

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-old-gold/20 border-t-old-gold" />
      </div>
      <p className="text-sm text-ink-muted animate-pulse font-display italic">Loading&hellip;</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-ink/[0.06] ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface p-6 border border-rule">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
