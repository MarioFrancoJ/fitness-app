"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadWorkouts, loadTemplates, loadTemplateAsWorkout } from "@/lib/workouts-store";
import type { Workout, WorkoutGoal, WorkoutDifficulty } from "@/data/workouts";

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

function WorkoutCard({ workout, href }: { workout: Workout; href: string }) {
  const totalExercises = workout.workoutDays.reduce((s, d) => s + d.exercises.length, 0);
  return (
    <Link href={href} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{workout.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColor(workout.difficulty)}`}>{workout.difficulty}</span>
      </div>
      {workout.description && <p className="mb-3 text-xs text-zinc-400 line-clamp-2">{workout.description}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${goalColor(workout.goal)}`}>{workout.goal}</span>
        <span className="text-xs text-zinc-400">{totalExercises} exercises</span>
        <span className="text-xs text-zinc-400">{workout.duration} min</span>
      </div>
    </Link>
  );
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setWorkouts(loadWorkouts());
    setTemplates(loadTemplates());
    setHydrated(true);
  }, []);

  function handleLoadTemplate(id: string) {
    const w = loadTemplateAsWorkout(id);
    if (w) {
      setWorkouts(loadWorkouts());
      setToast("Template loaded as workout!");
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Workouts</h1>
          <p className="mt-1 text-sm text-zinc-500">Create and manage your workout routines.</p>
        </div>
        <Link href="/workouts/new" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
          + New Workout
        </Link>
      </div>

      {/* My Workouts */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">My Workouts</h2>
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-12">
            <p className="mb-1 text-sm font-medium text-zinc-600">No workouts yet</p>
            <p className="mb-4 text-xs text-zinc-400">Create one from scratch or load a template.</p>
            <Link href="/workouts/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
              Create Workout
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workouts.map((w) => <WorkoutCard key={w.id} workout={w} href={`/workouts/${w.id}`} />)}
          </div>
        )}
      </div>

      {/* Templates */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Workout Templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <div key={tpl.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">{tpl.name}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColor(tpl.difficulty)}`}>{tpl.difficulty}</span>
              </div>
              <p className="mb-3 text-xs text-zinc-400 line-clamp-2">{tpl.description}</p>
              <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${goalColor(tpl.goal)}`}>{tpl.goal}</span>
                  <span className="text-xs text-zinc-400">{tpl.duration} min</span>
                </div>
                <button type="button" onClick={() => handleLoadTemplate(tpl.id)} className="text-xs font-semibold text-zinc-600 hover:text-zinc-900">
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </div>
  );
}
