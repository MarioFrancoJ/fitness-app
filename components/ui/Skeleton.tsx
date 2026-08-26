"use client";

// ── Base Skeleton ─────────────────────────────────────────────────────────────

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} />;
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <Bone className="mb-3 h-3 w-20" />
      <Bone className="mb-2 h-7 w-24" />
      <Bone className="h-3 w-16" />
    </div>
  );
}

// ── Skeleton Stats (row of 4 cards) ───────────────────────────────────────────

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <Bone className="mb-2 h-6 w-12" />
          <Bone className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// ── Skeleton Table ────────────────────────────────────────────────────────────

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-3 w-16 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-4 px-5 py-4">
            {Array.from({ length: cols }).map((_, col) => (
              <Bone key={col} className={`h-4 flex-1 ${col === 0 ? "max-w-[140px]" : "max-w-[80px]"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton List ─────────────────────────────────────────────────────────────

export function SkeletonList({ items = 4 }: { items?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <Bone className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1">
            <Bone className="mb-2 h-4 w-32" />
            <Bone className="h-3 w-48" />
          </div>
          <Bone className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// ── Skeleton Dashboard ────────────────────────────────────────────────────────

export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Bone className="mb-2 h-7 w-36" />
        <Bone className="h-4 w-56" />
      </div>
      {/* Macro cards */}
      <SkeletonStats count={4} />
      {/* Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Quick stats */}
      <SkeletonStats count={4} />
    </div>
  );
}

// ── Skeleton Page (generic) ───────────────────────────────────────────────────

export function SkeletonPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Bone className="mb-2 h-7 w-40" />
        <Bone className="h-4 w-64" />
      </div>
      <SkeletonStats count={4} />
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}
