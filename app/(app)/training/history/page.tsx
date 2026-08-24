"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { loadSessions } from "@/lib/training-store";
import type { WorkoutSession } from "@/data/training-sessions";

type FilterPeriod = "today" | "week" | "month" | "all";

function getDateRange(filter: FilterPeriod): Date | null {
  const now = new Date();
  switch (filter) {
    case "today": { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    case "week": { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
    case "month": { const d = new Date(now); d.setDate(now.getDate() - 30); return d; }
    default: return null;
  }
}

export default function TrainingHistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [filter, setFilter] = useState<FilterPeriod>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setHydrated(true);
  }, []);

  const filtered = useMemo(() => {
    const cutoff = getDateRange(filter);
    return sessions
      .filter((s) => s.status === "Completed")
      .filter((s) => !cutoff || new Date(s.date) >= cutoff);
  }, [sessions, filter]);

  const filters: { label: string; value: FilterPeriod }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "All Time", value: "all" },
  ];

  if (!hydrated) return null;

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
                {filtered.map((s) => {
                  const totalSets = s.exerciseLogs.reduce((sum, ex) => sum + ex.sets.filter((set) => set.completed).length, 0);
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">
                        <Link href={`/training/session/${s.id}`} className="hover:underline">{s.date}</Link>
                      </td>
                      <td className="px-5 py-3 text-zinc-700">{s.workoutName}</td>
                      <td className="px-5 py-3 text-zinc-600">{s.durationMinutes} min</td>
                      <td className="px-5 py-3 text-zinc-600">{s.exerciseLogs.length}</td>
                      <td className="px-5 py-3 text-zinc-600">{totalSets}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
