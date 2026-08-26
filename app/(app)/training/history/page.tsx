"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterPeriod = "today" | "week" | "month" | "all";

interface SessionRow {
  id: string;
  date: string;
  workout_name: string | null;
  duration_minutes: number | null;
  exerciseCount: number;
  completedSets: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDateCutoff(filter: FilterPeriod): string | null {
  const now = new Date();
  switch (filter) {
    case "today": return now.toISOString().split("T")[0];
    case "week": { const d = new Date(now); d.setDate(now.getDate() - 7); return d.toISOString().split("T")[0]; }
    case "month": { const d = new Date(now); d.setDate(now.getDate() - 30); return d.toISOString().split("T")[0]; }
    default: return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TrainingHistoryPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("training_sessions")
        .select("id, date, workout_name, duration_minutes, session_exercise_logs(id, session_set_logs(completed))")
        .eq("user_id", user.id)
        .eq("status", "Completed")
        .order("date", { ascending: false });

      if (data) {
        setSessions(data.map((s) => {
          const logs = s.session_exercise_logs || [];
          const completedSets = logs.reduce(
            (sum: number, ex: { session_set_logs: { completed: boolean }[] }) =>
              sum + (ex.session_set_logs || []).filter((set) => set.completed).length, 0
          );
          return {
            id: s.id,
            date: s.date,
            workout_name: s.workout_name,
            duration_minutes: s.duration_minutes,
            exerciseCount: logs.length,
            completedSets,
          };
        }));
      }

      setLoading(false);
    }

    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    const cutoff = getDateCutoff(filter);
    if (!cutoff) return sessions;
    return sessions.filter((s) => s.date >= cutoff);
  }, [sessions, filter]);

  const filters: { label: string; value: FilterPeriod }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "All Time", value: "all" },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Training History</h1>
          <p className="mt-1 text-sm text-zinc-500">{filtered.length} completed session{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/training/start" className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
          Start Workout
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit">
        {filters.map((f) => (
          <button key={f.value} type="button" onClick={() => setFilter(f.value)}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
              filter === f.value ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            ].join(" ")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-zinc-400">No sessions found for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Workout</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Duration</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Exercises</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Sets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">
                      <Link href={`/training/session/${s.id}`} className="hover:underline">
                        {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-700">{s.workout_name || "Custom"}</td>
                    <td className="px-5 py-3 text-zinc-600">{s.duration_minutes || 0} min</td>
                    <td className="px-5 py-3 text-zinc-600">{s.exerciseCount}</td>
                    <td className="px-5 py-3 text-zinc-600">{s.completedSets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
