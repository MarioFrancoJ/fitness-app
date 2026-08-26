"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecommendationCategory = "Nutrition" | "Training" | "Recovery" | "Weight Management" | "Consistency" | "Motivation" | "Goal Achievement";
type RecommendationPriority = "Low" | "Medium" | "High" | "Critical";
type RecommendationStatus = "New" | "Viewed" | "Dismissed" | "Completed";
type FilterTab = "active" | "completed" | "dismissed";

interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  status: RecommendationStatus;
  generatedDate: string;
}

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filter, setFilter] = useState<FilterTab>("active");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("recommendations")
        .select("id, category, priority, title, description, status, generated_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setRecommendations(data.map((r) => ({
          id: r.id,
          category: r.category as RecommendationCategory,
          priority: r.priority as RecommendationPriority,
          title: r.title,
          description: r.description,
          status: r.status as RecommendationStatus,
          generatedDate: r.generated_date,
        })));
      }

      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); }
  }, [toast, dismissToast]);

  async function handleUpdateStatus(id: string, status: RecommendationStatus) {
    try {
      const supabase = createClient();
      await supabase.from("recommendations").update({ status }).eq("id", id);
      setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      if (status === "Completed") setToast("Marked as completed!");
      if (status === "Dismissed") setToast("Recommendation dismissed");
    } catch (err) {
      console.error("Failed to update recommendation:", err);
    }
  }

  // Filtered lists
  const active = recommendations.filter((r) => r.status === "New" || r.status === "Viewed");
  const completed = recommendations.filter((r) => r.status === "Completed");
  const dismissed = recommendations.filter((r) => r.status === "Dismissed");
  const critical = active.filter((r) => r.priority === "Critical");
  const displayed = filter === "active" ? active : filter === "completed" ? completed : dismissed;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-400">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recommendations</h1>
          <p className="mt-1 text-sm text-zinc-500">Personalized guidance based on your data and behavior.</p>
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
                onClick={() => rec.status === "New" && handleUpdateStatus(rec.id, "Viewed")}>
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

                  {filter === "active" && (
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(rec.id, "Completed"); }}
                        className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
                        Complete
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(rec.id, "Dismissed"); }}
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

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
