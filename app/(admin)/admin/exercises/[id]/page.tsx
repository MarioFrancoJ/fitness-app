import { notFound } from "next/navigation";
import Link from "next/link";
import { exercises } from "@/data/exercises";

function difficultyColor(d: string) {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
    default:             return "bg-zinc-100 text-zinc-700";
  }
}

export async function generateStaticParams() {
  return exercises.map((ex) => ({ id: ex.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = exercises.find((ex) => ex.id === id);
  return { title: exercise ? `${exercise.name} — Admin` : "Exercise Not Found" };
}

export default async function AdminExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = exercises.find((ex) => ex.id === id);

  if (!exercise) notFound();

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link href="/admin/exercises" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
        &larr; Back to Exercises
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
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
        <div className="flex gap-2">
          <Link href={`/admin/exercises/${exercise.id}/edit`} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
            Edit
          </Link>
        </div>
      </div>

      {/* Content */}
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
                  <span className="mt-0.5 text-emerald-500">&#10003;</span>
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
                <span className="mt-0.5 text-red-500">&#10007;</span>
                {mistake}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">No data available.</p>
        )}
      </div>
    </div>
  );
}
