"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkoutDifficulty = "Beginner" | "Intermediate" | "Advanced";
type WorkoutGoal = "Fat Loss" | "Muscle Gain" | "Strength" | "Endurance" | "Mobility" | "General Fitness";

interface WorkoutExercise {
  exercise_name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes: string | null;
  sort_order: number;
}

interface WorkoutDay {
  id: string;
  day_name: string;
  sort_order: number;
  workout_exercises: WorkoutExercise[];
}

interface WorkoutDetail {
  id: string;
  name: string;
  description: string | null;
  goal: WorkoutGoal | null;
  difficulty: WorkoutDifficulty | null;
  duration: number | null;
  workout_days: WorkoutDay[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function difficultyColor(d: WorkoutDifficulty | null): string {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
    default:             return "bg-zinc-100 text-zinc-600";
  }
}

function goalColor(g: WorkoutGoal | null): string {
  switch (g) {
    case "Fat Loss":        return "bg-rose-50 text-rose-700";
    case "Muscle Gain":     return "bg-blue-50 text-blue-700";
    case "Strength":        return "bg-purple-50 text-purple-700";
    case "Endurance":       return "bg-orange-50 text-orange-700";
    case "Mobility":        return "bg-teal-50 text-teal-700";
    case "General Fitness": return "bg-zinc-100 text-zinc-700";
    default:                return "bg-zinc-100 text-zinc-600";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkoutDetailPage() {
  const { success: showToast } = useToast();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function loadWorkout() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("workouts")
        .select(`
          id, name, description, goal, difficulty, duration,
          workout_days (
            id, day_name, sort_order,
            workout_exercises (
              exercise_name, sets, reps, rest_seconds, notes, sort_order
            )
          )
        `)
        .eq("id", params.id)
        .single();

      if (!error && data) {
        // Sort days and exercises by sort_order
        const sortedDays = (data.workout_days || [])
          .sort((a: WorkoutDay, b: WorkoutDay) => a.sort_order - b.sort_order)
          .map((day: WorkoutDay) => ({
            ...day,
            workout_exercises: (day.workout_exercises || [])
              .sort((a: WorkoutExercise, b: WorkoutExercise) => a.sort_order - b.sort_order),
          }));

        setWorkout({
          id: data.id,
          name: data.name,
          description: data.description,
          goal: data.goal as WorkoutGoal | null,
          difficulty: data.difficulty as WorkoutDifficulty | null,
          duration: data.duration,
          workout_days: sortedDays,
        });
      }

      setLoading(false);
    }

    loadWorkout();
  }, [params.id]);

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase.from("workouts").delete().eq("id", params.id);
    if (!error) {
      router.push("/workouts");
    }
  }

  // ── Duplicate ─────────────────────────────────────────────────────────────

  async function handleDuplicate() {
    if (!workout) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Create new workout
    const { data: newWorkout } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: `${workout.name} (Copy)`,
        description: workout.description,
        goal: workout.goal,
        difficulty: workout.difficulty,
        duration: workout.duration,
        is_template: false,
      })
      .select("id")
      .single();

    if (!newWorkout) return;

    // 2. Copy days and exercises
    for (const day of workout.workout_days) {
      const { data: newDay } = await supabase
        .from("workout_days")
        .insert({
          workout_id: newWorkout.id,
          user_id: user.id,
          day_name: day.day_name,
          sort_order: day.sort_order,
        })
        .select("id")
        .single();

      if (!newDay) continue;

      if (day.workout_exercises.length > 0) {
        const exerciseInserts = day.workout_exercises.map((ex) => ({
          workout_day_id: newDay.id,
          user_id: user.id,
          exercise_name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          sort_order: ex.sort_order,
        }));

        await supabase.from("workout_exercises").insert(exerciseInserts);
      }
    }

    showToast("Workout duplicated!");
    router.push(`/workouts/${newWorkout.id}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageLoader text="Loading workout..." />
    );
  }

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

  const totalExercises = workout.workout_days.reduce((s, d) => s + d.workout_exercises.length, 0);

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
              {workout.goal && <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${goalColor(workout.goal)}`}>{workout.goal}</span>}
              {workout.difficulty && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyColor(workout.difficulty)}`}>{workout.difficulty}</span>}
              {workout.duration && <span className="text-xs text-zinc-400">{workout.duration} min</span>}
              <span className="text-xs text-zinc-400">{totalExercises} exercises</span>
              <span className="text-xs text-zinc-400">{workout.workout_days.length} days</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {totalExercises > 0 ? (
              <Link
                href={`/training/start?workout=${workout.id}`}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Start Workout
              </Link>
            ) : (
              <span
                title="Add exercises to this workout before starting"
                className="cursor-not-allowed rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-400"
              >
                Start Workout
              </span>
            )}
            <button type="button" onClick={handleDuplicate} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Duplicate</button>
            <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>

        {/* Workout Days */}
        <div className="flex flex-col gap-4">
          {workout.workout_days.map((day) => (
            <div key={day.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-zinc-900">{day.day_name}</p>
              {day.workout_exercises.length === 0 ? (
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
                      {day.workout_exercises.map((ex, i) => (
                        <tr key={i} className="border-b border-zinc-50">
                          <td className="py-2 font-medium text-zinc-800">{ex.exercise_name}</td>
                          <td className="py-2 text-zinc-600">{ex.sets}</td>
                          <td className="py-2 text-zinc-600">{ex.reps}</td>
                          <td className="py-2 text-zinc-600">{ex.rest_seconds}s</td>
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
    </>
  );
}
