import { workoutTemplates } from "@/data/workout-templates";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workout Templates — FitnessApp",
};

function difficultyColor(d: string) {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
    default:             return "bg-zinc-100 text-zinc-700";
  }
}

export default function TemplatesPage() {
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workoutTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            {/* Top row */}
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-base font-semibold text-zinc-900">{tmpl.name}</h3>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(tmpl.difficulty)}`}
              >
                {tmpl.difficulty}
              </span>
            </div>

            {/* Meta */}
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {tmpl.category}
              </span>
              <span className="text-xs text-zinc-400">{tmpl.duration}</span>
            </div>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-zinc-500">
              {tmpl.description}
            </p>

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
    </div>
  );
}
