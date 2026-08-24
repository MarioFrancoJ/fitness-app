"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getWorkoutById, deleteWorkout, duplicateWorkout } from "@/lib/workouts-store";
import type { Workout, WorkoutDifficulty, WorkoutGoal } from "@/data/workouts";

function difficultyColor(d: WorkoutDifficulty): string {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
  }
}

function goalColor(g: WorkoutGoal): string {
  switch (g) {
    case "Fat Loss":       return "bg-rose-50 text-rose-700";
    case "Muscle Gain":    return "bg-blue-50 text-blue-700";
    case "Strength":       return "bg-purple-50 text-purple-700";
    case "Endurance":      return "bg-orange-50 text-orange-700";
    case "Mobility":       return "bg-teal-50 text-teal-700";
    case "General Fitness":return "bg-zinc-100 text-zinc-700";
  }
}

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const w = getWorkoutById(params.id);
    setWorkout(w ?? null);
    setHydrated(true);
  }, [params.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(dismissToast, 3000);
      return () => clearTimeout(t);
    }
  }, [toast, dismissToast]);

  function handleDelete() {
    deleteWorkout(params.id);
    router.push("/workouts");
  }

  function handleDuplicate() {
    const dup = duplicateWorkout(params.id);
    if (dup) {
      setToast("Workout duplicated!");
      router.push(`/workouts/${dup.id}`);
    }
  }

  if (!hydrated) return null;

  if (!workout) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/workouts" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr; Back to Workouts</Link>
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white">
          <p className="text-sm text-zinc-400">Workout not found.</p>
        </div>
      </div>
    );
  }

  const totalExercises = workout.workoutDays.reduce((s, d) => s + d.exercises.length, 0);

  return (
    <>
      <div className="flex flex-col gap-6">
        <Link href="/workouts" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          &larr; Back to Workouts
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{workout.name}</h1>
            {workout.description && <p className="mt-1 text-sm text-zinc-500">{workout.description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${goalColor(workout.goal)}`}>{workout.goal}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyColor(workout.difficulty)}`}>{workout.difficulty}</span>
              <span className="text-xs text-zinc-400">{workout.duration} min</span>
              <span className="text-xs text-zinc-400">{totalExercises} exercises</span>
              <span className="text-xs text-zinc-400">{workout.workoutDays.length} days</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleDuplicate} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Duplicate</button>
            <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>

        {/* Workout Days */}
        <div className="flex flex-col gap-4">
          {workout.workoutDays.map((day) => (
            <div key={day.dayName} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-zinc-900">{day.dayName}</p>
              {day.exercises.length === 0 ? (
                <p className="text-xs text-zinc-400">Rest day</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="pb-2 text-xs font-semibold text-zinc-400">Exercise</th>
                        <th className="pb-2 text-xs font-semibold text-zinc-400">Sets</th>
                        <th className="pb-2 text-xs font-semibold text-zinc-400">Reps</th>
                        <th className="pb-2 text-xs font-semibold text-zinc-400">Rest</th>
                        <th className="pb-2 text-xs font-semibold text-zinc-400">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((ex, i) => (
                        <tr key={i} className="border-b border-zinc-50">
                          <td className="py-2 font-medium text-zinc-800">{ex.exerciseName}</td>
                          <td className="py-2 text-zinc-600">{ex.sets}</td>
                          <td className="py-2 text-zinc-600">{ex.reps}</td>
                          <td className="py-2 text-zinc-600">{ex.restSeconds}s</td>
                          <td className="py-2 text-zinc-400">{ex.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
