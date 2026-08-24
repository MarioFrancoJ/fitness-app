"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ExerciseForm, { type ExerciseFormData } from "@/components/admin/ExerciseForm";
import { exercises } from "@/data/exercises";
import { exerciseDetails } from "@/data/exercise-details";

export default function EditExercisePage() {
  const params = useParams<{ id: string }>();
  const exercise = exercises.find((ex) => ex.id === params.id);
  const detail = exerciseDetails.find((d) => d.id === params.id);

  if (!exercise) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-zinc-400">Exercise not found.</p>
      </div>
    );
  }

  const initialData: ExerciseFormData = {
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    instructions: detail?.instructions.join("\n") || "",
    commonMistakes: detail?.commonMistakes.join("\n") || "",
    alternatives: detail?.alternatives.join(", ") || "",
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/exercises/${params.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        ← Back to {exercise.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Edit Exercise
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Editing: {exercise.name}
        </p>
      </div>

      <ExerciseForm mode="edit" exerciseId={params.id} initialData={initialData} />
    </div>
  );
}
