"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TemplateItem {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  duration: number | null;
  exercises: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function difficultyColor(d: string | null) {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
    default:             return "bg-zinc-100 text-zinc-700";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      const supabase = createClient();

      const { data } = await supabase
        .from("workouts")
        .select("id, name, description, goal, difficulty, duration, workout_days(workout_exercises(exercise_name))")
        .eq("is_template", true)
        .is("user_id", null)
        .order("name");

      if (data) {
        setTemplates(data.map((t) => {
          // Flatten all exercise names from all days
          const exercises: string[] = [];
          for (const day of (t.workout_days || [])) {
            for (const ex of (day.workout_exercises || [])) {
              if (!exercises.includes(ex.exercise_name)) {
                exercises.push(ex.exercise_name);
              }
            }
          }

          return {
            id: t.id,
            name: t.name,
            description: t.description,
            goal: t.goal,
            difficulty: t.difficulty,
            duration: t.duration,
            exercises,
          };
        }));
      }

      setLoading(false);
    }

    loadTemplates();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageLoader text="Loading templates..." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Workout Templates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Choose a pre-built template to get started quickly.
        </p>
      </div>

      {/* Template cards */}
      {templates.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-200 bg-white">
          <p className="text-sm text-zinc-400">No templates available.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              {/* Top row */}
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-base font-semibold text-zinc-900">{tmpl.name}</h3>
                {tmpl.difficulty && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(tmpl.difficulty)}`}
                  >
                    {tmpl.difficulty}
                  </span>
                )}
              </div>

              {/* Meta */}
              <div className="mb-3 flex items-center gap-2">
                {tmpl.goal && (
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {tmpl.goal}
                  </span>
                )}
                {tmpl.duration && (
                  <span className="text-xs text-zinc-400">{tmpl.duration} min</span>
                )}
              </div>

              {/* Description */}
              {tmpl.description && (
                <p className="mb-4 text-sm leading-relaxed text-zinc-500">
                  {tmpl.description}
                </p>
              )}

              {/* Exercises list */}
              <div className="mt-auto border-t border-zinc-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Exercises ({tmpl.exercises.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.exercises.map((ex) => (
                    <span
                      key={ex}
                      className="rounded-md bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
