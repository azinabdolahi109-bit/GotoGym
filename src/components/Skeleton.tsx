'use client';

export function SkeletonCard() {
  return (
    <div
      className="skeleton rounded-2xl h-24 mb-3"
      style={{ backgroundColor: 'var(--bg-tertiary)' }}
    />
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
