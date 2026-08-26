"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function difficultyColor(d: string) {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
    default:             return "bg-zinc-100 text-zinc-700";
  }
}

interface ExerciseDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  instructions: string[] | null;
  tips: string[] | null;
  common_mistakes: string[] | null;
}

export default function AdminExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercise() {
      const supabase = createClient();
      const { data } = await supabase
        .from("exercises")
        .select("id, name, description, category, muscle_group, equipment, difficulty, instructions, tips, common_mistakes")
        .eq("id", params.id)
        .single();
      if (data) setExercise(data as ExerciseDetail);
      setLoading(false);
    }
    loadExercise();
  }, [params.id]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold text-zinc-900">Exercise Not Found</p>
        <Link href="/admin/exercises" className="mt-4 text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr; Back to Exercises</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/exercises" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">&larr; Back to Exercises</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{exercise.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{exercise.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{exercise.category}</span>
            <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{exercise.muscle_group}</span>
            <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{exercise.equipment}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyColor(exercise.difficulty)}`}>{exercise.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">Instructions</h2>
            <ol className="flex flex-col gap-2">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {exercise.tips && exercise.tips.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">Tips</h2>
            <ul className="flex flex-col gap-2">
              {exercise.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">Common Mistakes</h2>
            <ul className="flex flex-col gap-2">
              {exercise.common_mistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {mistake}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
