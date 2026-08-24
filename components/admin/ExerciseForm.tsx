"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { MuscleGroup, Difficulty } from "@/data/exercises";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExerciseFormData {
  name: string;
  muscleGroup: MuscleGroup | "";
  equipment: string;
  difficulty: Difficulty | "";
  instructions: string;
  commonMistakes: string;
  alternatives: string;
}

interface ExerciseFormProps {
  initialData?: ExerciseFormData;
  mode: "create" | "edit";
  exerciseId?: string;
}

const MUSCLE_GROUPS: MuscleGroup[] = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const EQUIPMENT_OPTIONS = ["Barbell", "Dumbbell", "Bodyweight", "Cable", "Machine", "Kettlebell", "Resistance Band"];

const EMPTY_FORM: ExerciseFormData = {
  name: "",
  muscleGroup: "",
  equipment: "",
  difficulty: "",
  instructions: "",
  commonMistakes: "",
  alternatives: "",
};

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitnessapp_admin_exercises";

function loadCustomExercises(): ExerciseFormData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomExercises(data: ExerciseFormData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseForm({ initialData, mode, exerciseId }: ExerciseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ExerciseFormData>(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseFormData, string>>>({});
  const [saved, setSaved] = useState(false);

  function validate(): boolean {
    const errs: Partial<Record<keyof ExerciseFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Exercise name is required.";
    if (!form.muscleGroup) errs.muscleGroup = "Select a muscle group.";
    if (!form.equipment.trim()) errs.equipment = "Equipment is required.";
    if (!form.difficulty) errs.difficulty = "Select a difficulty level.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleChange(field: keyof ExerciseFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const existing = loadCustomExercises();

    if (mode === "edit" && exerciseId) {
      // Update in localStorage
      const updated = existing.map((ex, i) =>
        i.toString() === exerciseId ? form : ex
      );
      saveCustomExercises(updated);
    } else {
      // Create new
      saveCustomExercises([...existing, form]);
    }

    setSaved(true);
    setTimeout(() => {
      router.push("/admin/exercises");
    }, 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="mb-5 text-sm font-semibold text-zinc-700">Basic Information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="name"
            type="text"
            label="Exercise Name"
            placeholder="e.g. Bulgarian Split Squat"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="muscleGroup" className="text-sm font-medium text-zinc-700">
              Muscle Group
            </label>
            <select
              id="muscleGroup"
              value={form.muscleGroup}
              onChange={(e) => handleChange("muscleGroup", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="" disabled>Select muscle group</option>
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
            {errors.muscleGroup && <p className="text-xs text-red-500" role="alert">{errors.muscleGroup}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="equipment" className="text-sm font-medium text-zinc-700">
              Equipment
            </label>
            <select
              id="equipment"
              value={form.equipment}
              onChange={(e) => handleChange("equipment", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="" disabled>Select equipment</option>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            {errors.equipment && <p className="text-xs text-red-500" role="alert">{errors.equipment}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="difficulty" className="text-sm font-medium text-zinc-700">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={form.difficulty}
              onChange={(e) => handleChange("difficulty", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              <option value="" disabled>Select difficulty</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.difficulty && <p className="text-xs text-red-500" role="alert">{errors.difficulty}</p>}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="mb-5 text-sm font-semibold text-zinc-700">Details</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="instructions" className="text-sm font-medium text-zinc-700">
              Instructions (one per line)
            </label>
            <textarea
              id="instructions"
              rows={5}
              placeholder="Step 1...&#10;Step 2...&#10;Step 3..."
              value={form.instructions}
              onChange={(e) => handleChange("instructions", e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="commonMistakes" className="text-sm font-medium text-zinc-700">
              Common Mistakes (one per line)
            </label>
            <textarea
              id="commonMistakes"
              rows={3}
              placeholder="Mistake 1...&#10;Mistake 2..."
              value={form.commonMistakes}
              onChange={(e) => handleChange("commonMistakes", e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="alternatives" className="text-sm font-medium text-zinc-700">
              Alternatives (comma-separated)
            </label>
            <input
              id="alternatives"
              type="text"
              placeholder="e.g. Goblet Squat, Leg Press, Hack Squat"
              value={form.alternatives}
              onChange={(e) => handleChange("alternatives", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit">
          {mode === "edit" ? "Save Changes" : "Create Exercise"}
        </Button>
        <button
          type="button"
          onClick={() => router.push("/admin/exercises")}
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Cancel
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-600">
            ✓ {mode === "edit" ? "Changes saved" : "Exercise created"}
          </span>
        )}
      </div>
    </form>
  );
}
