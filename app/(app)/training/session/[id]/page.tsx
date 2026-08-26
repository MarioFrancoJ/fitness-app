"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SetLog {
  setNumber: number;
  targetReps: number;
  completedReps: number;
  completedWeight: number;
  completed: boolean;
  notes: string | null;
}

interface ExerciseLog {
  exerciseName: string;
  sets: SetLog[];
}

interface SessionDetail {
  id: string;
  workoutName: string;
  date: string;
  durationMinutes: number;
  status: string;
  exerciseLogs: ExerciseLog[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient();

      const { data } = await supabase
        .from("training_sessions")
        .select(`
          id, workout_name, date, duration_minutes, status,
          session_exercise_logs (
            exercise_name, sort_order,
            session_set_logs (
              set_number, target_reps, completed_reps, completed_weight, completed, notes
            )
          )
        `)
        .eq("id", params.id)
        .single();

      if (data) {
        const exerciseLogs = (data.session_exercise_logs || [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((ex: { exercise_name: string; session_set_logs: { set_number: number; target_reps: number | null; completed_reps: number | null; completed_weight: number | null; completed: boolean; notes: string | null }[] }) => ({
            exerciseName: ex.exercise_name,
            sets: (ex.session_set_logs || [])
              .sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number)
              .map((s) => ({
                setNumber: s.set_number,
                targetReps: s.target_reps || 0,
                completedReps: s.completed_reps || 0,
                completedWeight: Number(s.completed_weight) || 0,
                completed: s.completed,
                notes: s.notes,
              })),
          }));

        setSession({
          id: data.id,
          workoutName: data.workout_name || "Workout",
          date: new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
          durationMinutes: data.duration_minutes || 0,
          status: data.status,
          exerciseLogs,
        });
      }

      setLoading(false);
    }

    loadSession();
  }, [params.id]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-400">Loading session...</p>
        </div>
      </div>
    );
  }

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
