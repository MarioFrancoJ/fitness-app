"use client";

import { useState, useEffect, useCallback } from "react";
import {
  generateAndSaveRecommendations,
  loadRecommendations,
  updateRecommendationStatus,
  getWeeklySummary,
  type Recommendation,
  type RecommendationCategory,
  type RecommendationPriority,
  type RecommendationStatus,
  type WeeklySummary,
} from "@/lib/recommendation-engine";

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityColor(p: RecommendationPriority): string {
  switch (p) {
    case "Critical": return "border-l-red-600 bg-red-50";
    case "High":     return "border-l-orange-500 bg-orange-50";
    case "Medium":   return "border-l-amber-400 bg-amber-50";
    case "Low":      return "border-l-emerald-400 bg-emerald-50";
  }
}

function priorityBadge(p: RecommendationPriority): string {
  switch (p) {
    case "Critical": return "bg-red-100 text-red-700";
    case "High":     return "bg-orange-100 text-orange-700";
    case "Medium":   return "bg-amber-100 text-amber-700";
    case "Low":      return "bg-emerald-100 text-emerald-700";
  }
}

function categoryIcon(c: RecommendationCategory): string {
  switch (c) {
    case "Nutrition":         return "🥗";
    case "Training":          return "💪";
    case "Recovery":          return "😴";
    case "Weight Management": return "⚖️";
    case "Consistency":       return "📈";
    case "Motivation":        return "🔥";
    case "Goal Achievement":  return "🎯";
  }
}

type FilterTab = "active" | "completed" | "dismissed";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<WeeklySummary>({ topRecommendations: [], improvements: [], risks: [] });
  const [filter, setFilter] = useState<FilterTab>("active");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    generateAndSaveRecommendations();
    setRecommendations(loadRecommendations());
    setSummary(getWeeklySummary());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(dismissToast, 3000);
      return () => clearTimeout(t);
    }
  }, [toast, dismissToast]);

  function refresh() {
    setRecommendations(loadRecommendations());
    setSummary(getWeeklySummary());
  }

  function handleMarkViewed(id: string) {
    updateRecommendationStatus(id, "Viewed");
    refresh();
  }

  function handleDismiss(id: string) {
    updateRecommendationStatus(id, "Dismissed");
    refresh();
    setToast("Recommendation dismissed");
  }

  function handleComplete(id: string) {
    updateRecommendationStatus(id, "Completed");
    refresh();
    setToast("Marked as completed!");
  }

  function handleRegenerate() {
    generateAndSaveRecommendations();
    refresh();
    setToast("Recommendations refreshed");
  }

  // Filtered lists
  const active = recommendations.filter((r) => r.status === "New" || r.status === "Viewed");
  const completed = recommendations.filter((r) => r.status === "Completed");
  const dismissed = recommendations.filter((r) => r.status === "Dismissed");
  const critical = active.filter((r) => r.priority === "Critical");

  const displayed = filter === "active" ? active : filter === "completed" ? completed : dismissed;

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recommendations</h1>
            <p className="mt-1 text-sm text-zinc-500">Personalized guidance based on your data and behavior.</p>
          </div>
          <button type="button" onClick={handleRegenerate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.28a.75.75 0 0 0-.75.75v3.955a.75.75 0 0 0 1.5 0v-2.134l.235.234A7 7 0 0 0 17 10a.75.75 0 0 0-1.5 0c0 .51-.07 1.003-.188 1.424ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h3.952a.75.75 0 0 0 .75-.75V3.216a.75.75 0 0 0-1.5 0v2.134l-.235-.234A7 7 0 0 0 3 10a.75.75 0 0 0 1.5 0c0-.51.07-1.003.188-1.424Z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{active.length}</p>
            <p className="text-xs text-zinc-400">Active</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-red-600">{critical.length}</p>
            <p className="text-xs text-zinc-400">Critical</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-emerald-600">{completed.length}</p>
            <p className="text-xs text-zinc-400">Completed</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-400">{dismissed.length}</p>
            <p className="text-xs text-zinc-400">Dismissed</p>
          </div>
        </div>

        {/* Weekly Summary */}
        {(summary.improvements.length > 0 || summary.risks.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {summary.risks.length > 0 && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-400">Biggest Risks</p>
                <ul className="flex flex-col gap-1.5">
                  {summary.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="mt-0.5 text-red-400">&#9679;</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.improvements.length > 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">Improvements</p>
                <ul className="flex flex-col gap-1.5">
                  {summary.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <span className="mt-0.5 text-emerald-400">&#10003;</span>{imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit">
          {([["active", "Active"], ["completed", "Completed"], ["dismissed", "Dismissed"]] as [FilterTab, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={["rounded-md px-4 py-1.5 text-xs font-semibold transition-colors", filter === key ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>
              {label}
            </button>
          ))}
        </div>

        {/* Recommendations list */}
        {displayed.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
            <p className="text-sm text-zinc-400">
              {filter === "active" ? "No active recommendations. You're on track!" : `No ${filter} recommendations.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map((rec) => (
              <div key={rec.id} className={`rounded-xl border-l-4 border border-zinc-200 p-5 shadow-sm ${priorityColor(rec.priority)}`}
                onClick={() => rec.status === "New" && handleMarkViewed(rec.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">{categoryIcon(rec.category)}</span>
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900">{rec.title}</p>
                        {rec.status === "New" && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-xs text-zinc-500">{rec.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityBadge(rec.priority)}`}>{rec.priority}</span>
                        <span className="text-[10px] text-zinc-300">{rec.category}</span>
                        <span className="text-[10px] text-zinc-300">{rec.generatedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {filter === "active" && (
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleComplete(rec.id); }}
                        className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
                        Complete
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleDismiss(rec.id); }}
                        className="rounded-md bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-200">
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
