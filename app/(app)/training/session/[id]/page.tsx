"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSessionById } from "@/lib/training-store";
import type { WorkoutSession } from "@/data/training-sessions";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(getSessionById(params.id) ?? null);
    setHydrated(true);
  }, [params.id]);

  if (!hydrated) return null;

  if (!session) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/training/history" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr; Back to History</Link>
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white">
          <p className="text-sm text-zinc-400">Session not found.</p>
        </div>
      </div>
    );
  }

  const totalSets = session.exerciseLogs.reduce((s, ex) => s + ex.sets.length, 0);
  const completedSets = session.exerciseLogs.reduce((s, ex) => s + ex.sets.filter((set) => set.completed).length, 0);
  const totalVolume = session.exerciseLogs.reduce((vol, ex) => {
    return vol + ex.sets.reduce((sv, set) => sv + (set.completed ? set.completedWeight * set.completedReps : 0), 0);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/training/history" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        &larr; Back to History
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{session.workoutName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>{session.date}</span>
          <span>{session.durationMinutes} minutes</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${session.status === "Completed" ? "bg-emerald-50 text-emerald-700" : session.status === "Cancelled" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-zinc-900">{session.exerciseLogs.length}</p>
          <p className="text-xs text-zinc-400">Exercises</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-zinc-900">{completedSets}/{totalSets}</p>
          <p className="text-xs text-zinc-400">Sets</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-blue-600">{Math.round(totalVolume)}</p>
          <p className="text-xs text-zinc-400">Volume (kg)</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-emerald-600">{session.durationMinutes}</p>
          <p className="text-xs text-zinc-400">Minutes</p>
        </div>
      </div>

      {/* Exercise details */}
      <div className="flex flex-col gap-4">
        {session.exerciseLogs.map((exLog, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-zinc-900">{exLog.exerciseName}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="pb-2 text-xs font-semibold text-zinc-400">Set</th>
                    <th className="pb-2 text-xs font-semibold text-zinc-400">Reps</th>
                    <th className="pb-2 text-xs font-semibold text-zinc-400">Weight</th>
                    <th className="pb-2 text-xs font-semibold text-zinc-400">Status</th>
                    <th className="pb-2 text-xs font-semibold text-zinc-400">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {exLog.sets.map((set) => (
                    <tr key={set.setNumber} className="border-b border-zinc-50">
                      <td className="py-2 text-zinc-600">{set.setNumber}</td>
                      <td className="py-2 text-zinc-700">{set.completed ? set.completedReps : "—"} <span className="text-zinc-300">/ {set.targetReps}</span></td>
                      <td className="py-2 text-zinc-700">{set.completed && set.completedWeight > 0 ? `${set.completedWeight} kg` : "—"}</td>
                      <td className="py-2">
                        {set.completed ? (
                          <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Done</span>
                        ) : (
                          <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Skipped</span>
                        )}
                      </td>
                      <td className="py-2 text-xs text-zinc-400">{set.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
