"use client";

/**
 * PageLoader — Replaces all inline spinners across the app.
 * Use this as the loading state in any page that fetches data from Supabase.
 *
 * Usage:
 *   if (loading) return <PageLoader />;
 *   if (loading) return <PageLoader text="Loading workouts..." />;
 */

export default function PageLoader({ text }: { text?: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        {text && <p className="text-sm text-zinc-400">{text}</p>}
      </div>
    </div>
  );
}
