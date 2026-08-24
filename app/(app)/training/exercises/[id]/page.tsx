"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { loadExercises } from "@/lib/exercises-store";
import type { Exercise, Difficulty } from "@/data/exercises";

function difficultyColor(d: Difficulty): string {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
  }
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const all = loadExercises();
    const found = all.find((e) => e.id === params.id) ?? null;
    setExercise(found);
    setHydrated(true);
  }, [params.id]);

  if (!hydrated) return null;

  if (!exercise) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/training/exercises" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          &larr; Back to Exercises
        </Link>
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white">
          <p className="text-sm text-zinc-400">Exercise not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link href="/training/exercises" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
        &larr; Back to Exercises
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{exercise.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{exercise.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{exercise.category}</span>
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{exercise.muscleGroup}</span>
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{exercise.equipment}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyColor(exercise.difficulty)}`}>{exercise.difficulty}</span>
        </div>
      </div>

      {/* Image/Video placeholder */}
      <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-10 w-10" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="m9.5 9 5 3-5 3V9Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium">Exercise demonstration</span>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Instructions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">Instructions</h2>
          {exercise.instructions.length > 0 ? (
            <ol className="flex flex-col gap-3">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-zinc-400">No instructions available.</p>
          )}
        </div>

        {/* Tips */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">Tips</h2>
          {exercise.tips.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {exercise.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">No tips available.</p>
          )}
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">Common Mistakes</h2>
        {exercise.commonMistakes.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {exercise.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="mt-0.5 text-red-500">✗</span>
                {mistake}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">No data available.</p>
        )}
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">{exercise.equipment}</p>
          <p className="text-xs text-zinc-400">Equipment</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">{exercise.difficulty}</p>
          <p className="text-xs text-zinc-400">Difficulty</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-900">{exercise.category}</p>
          <p className="text-xs text-zinc-400">Category</p>
        </div>
      </div>

      {/* Add to Workout */}
      <div>
        <Link href="/training/workout-builder"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2">
          + Add to Workout
        </Link>
      </div>
    </div>
  );
}
