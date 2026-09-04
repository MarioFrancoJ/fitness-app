"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type MuscleGroup = "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Forearms" | "Core" | "Glutes" | "Quadriceps" | "Hamstrings" | "Calves" | "Full Body";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type Equipment = "None" | "Dumbbells" | "Barbell" | "Resistance Bands" | "Pull-Up Bar" | "Machine" | "Kettlebell";

export interface ExerciseFormData {
  name: string;
  muscleGroup: MuscleGroup | "";
  equipment: Equipment | string;
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

const MUSCLE_GROUPS: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms", "Core", "Glutes", "Quadriceps", "Hamstrings", "Calves", "Full Body"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const EQUIPMENT_OPTIONS: Equipment[] = ["None", "Dumbbells", "Barbell", "Resistance Bands", "Pull-Up Bar", "Machine", "Kettlebell"];

const EMPTY_FORM: ExerciseFormData = {
  name: "",
  muscleGroup: "",
  equipment: "",
  difficulty: "",
  instructions: "",
  commonMistakes: "",
  alternatives: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciseForm({ initialData, mode, exerciseId }: ExerciseFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ExerciseFormData>(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ExerciseFormData, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const supabase = createClient();

    const data = {
      name: form.name.trim(),
      muscle_group: form.muscleGroup as MuscleGroup,
      equipment: form.equipment as Equipment,
      difficulty: form.difficulty as Difficulty,
      category: "Strength" as const,
      instructions: form.instructions.split("\n").filter((l) => l.trim()),
      common_mistakes: form.commonMistakes.split("\n").filter((l) => l.trim()),
    };

    try {
      if (mode === "edit" && exerciseId) {
        await supabase.from("exercises").update(data).eq("id", exerciseId);
      } else {
        await supabase.from("exercises").insert(data);
      }
      setSaved(true);
      setTimeout(() => router.push("/admin/exercises"), 1000);
    } catch {
      setErrors({ name: "Failed to save. Please try again." });
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-border-brand bg-success-light">
        <p className="text-sm font-medium text-success">✓ Exercise {mode === "edit" ? "updated" : "created"} successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="ex-name" type="text" label="Exercise Name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="e.g. Barbell Squat" error={errors.name} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ex-muscle" className="text-sm font-medium text-zinc-700">Muscle Group</label>
          <select id="ex-muscle" value={form.muscleGroup} onChange={(e) => handleChange("muscleGroup", e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
            <option value="">Select...</option>
            {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.muscleGroup && <p className="text-xs text-red-500">{errors.muscleGroup}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ex-equip" className="text-sm font-medium text-zinc-700">Equipment</label>
          <select id="ex-equip" value={form.equipment} onChange={(e) => handleChange("equipment", e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
            <option value="">Select...</option>
            {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
          </select>
          {errors.equipment && <p className="text-xs text-red-500">{errors.equipment}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ex-diff" className="text-sm font-medium text-zinc-700">Difficulty</label>
          <select id="ex-diff" value={form.difficulty} onChange={(e) => handleChange("difficulty", e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
            <option value="">Select...</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.difficulty && <p className="text-xs text-red-500">{errors.difficulty}</p>}
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="ex-instr" className="text-sm font-medium text-zinc-700">Instructions (one per line)</label>
          <textarea id="ex-instr" value={form.instructions} onChange={(e) => handleChange("instructions", e.target.value)} rows={4} placeholder="Step 1&#10;Step 2&#10;Step 3" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="ex-mistakes" className="text-sm font-medium text-zinc-700">Common Mistakes (one per line)</label>
          <textarea id="ex-mistakes" value={form.commonMistakes} onChange={(e) => handleChange("commonMistakes", e.target.value)} rows={3} placeholder="Mistake 1&#10;Mistake 2" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Exercise"}</Button>
        <button type="button" onClick={() => router.back()} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Cancel</button>
      </div>
    </form>
  );
}
