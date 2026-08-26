"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Types ─────────────────────────────────────────────────────────────────────

type ExerciseCategory = "Strength" | "Calisthenics" | "Cardio" | "Mobility" | "Flexibility";
type MuscleGroup = "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Forearms" | "Core" | "Glutes" | "Quadriceps" | "Hamstrings" | "Calves" | "Full Body";
type Equipment = "None" | "Dumbbells" | "Barbell" | "Resistance Bands" | "Pull-Up Bar" | "Machine" | "Kettlebell";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  instructions: string[] | null;
  tips: string[] | null;
  common_mistakes: string[] | null;
}

const EXERCISE_CATEGORIES: ExerciseCategory[] = ["Strength", "Calisthenics", "Cardio", "Mobility", "Flexibility"];
const MUSCLE_GROUPS: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms", "Core", "Glutes", "Quadriceps", "Hamstrings", "Calves", "Full Body"];
const EQUIPMENT_OPTIONS: Equipment[] = ["None", "Dumbbells", "Barbell", "Resistance Bands", "Pull-Up Bar", "Machine", "Kettlebell"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

function difficultyColor(d: Difficulty): string {
  switch (d) {
    case "Beginner": return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced": return "bg-red-50 text-red-700";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ExerciseCategory>("All");
  const [muscleFilter, setMuscleFilter] = useState<"All" | MuscleGroup>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | Difficulty>("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("Strength");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Chest");
  const [equipment, setEquipment] = useState<Equipment>("None");
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const [instructionsText, setInstructionsText] = useState("");
  const [tipsText, setTipsText] = useState("");
  const [mistakesText, setMistakesText] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("exercises")
        .select("id, name, description, category, muscle_group, equipment, difficulty, instructions, tips, common_mistakes")
        .order("name");
      if (data) setExercises(data as Exercise[]);
      setLoading(false);
    }
    loadData();
  }, []);

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || ex.category === categoryFilter;
    const matchesMuscle = muscleFilter === "All" || ex.muscle_group === muscleFilter;
    const matchesDiff = difficultyFilter === "All" || ex.difficulty === difficultyFilter;
    return matchesSearch && matchesCat && matchesMuscle && matchesDiff;
  });

  function resetForm() {
    setName(""); setDescription(""); setCategory("Strength"); setMuscleGroup("Chest");
    setEquipment("None"); setDifficulty("Beginner"); setInstructionsText(""); setTipsText("");
    setMistakesText(""); setFormError(""); setEditId(null); setShowForm(false);
  }

  function handleEdit(ex: Exercise) {
    setName(ex.name); setDescription(ex.description || ""); setCategory(ex.category);
    setMuscleGroup(ex.muscle_group); setEquipment(ex.equipment); setDifficulty(ex.difficulty);
    setInstructionsText((ex.instructions || []).join("\n"));
    setTipsText((ex.tips || []).join("\n"));
    setMistakesText((ex.common_mistakes || []).join("\n"));
    setEditId(ex.id); setShowForm(true);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("exercises").delete().eq("id", id);
    if (!error) setExercises((prev) => prev.filter((e) => e.id !== id));
    setDeleteTarget(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Name is required."); return; }

    setSaving(true);
    const supabase = createClient();

    const data = {
      name: name.trim(),
      description: description.trim(),
      category,
      muscle_group: muscleGroup,
      equipment,
      difficulty,
      instructions: instructionsText.split("\n").filter((l) => l.trim()),
      tips: tipsText.split("\n").filter((l) => l.trim()),
      common_mistakes: mistakesText.split("\n").filter((l) => l.trim()),
    };

    try {
      if (editId) {
        const { error } = await supabase.from("exercises").update(data).eq("id", editId);
        if (!error) setExercises((prev) => prev.map((ex) => (ex.id === editId ? { ...ex, ...data } : ex)));
      } else {
        const { data: inserted, error } = await supabase.from("exercises").insert(data).select("id").single();
        if (!error && inserted) setExercises((prev) => [{ id: inserted.id, ...data }, ...prev]);
      }
      resetForm();
    } catch { setFormError("Failed to save."); }
    setSaving(false);
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Exercises</h1>
          <p className="mt-1 text-sm text-zinc-500">{filtered.length} exercise{filtered.length !== 1 ? "s" : ""} in catalogue</p>
        </div>
        <Button type="button" onClick={() => { resetForm(); setShowForm(true); }}>+ New Exercise</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{editId ? "Edit Exercise" : "New Exercise"}</p>
          {formError && <p className="mb-3 text-xs text-red-500" role="alert">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input id="ex-name" type="text" label="Name" value={name} onChange={(e) => { setName(e.target.value); setFormError(""); }} placeholder="e.g. Barbell Squat" />
            <div className="sm:col-span-2"><Input id="ex-desc" type="text" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" /></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-cat" className="text-sm font-medium text-zinc-700">Category</label><select id="ex-cat" value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{EXERCISE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-muscle" className="text-sm font-medium text-zinc-700">Muscle Group</label><select id="ex-muscle" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-equip" className="text-sm font-medium text-zinc-700">Equipment</label><select id="ex-equip" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-diff" className="text-sm font-medium text-zinc-700">Difficulty</label><select id="ex-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-instr" className="text-sm font-medium text-zinc-700">Instructions (one per line)</label><textarea id="ex-instr" value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)} rows={4} placeholder="Step 1&#10;Step 2" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-tips" className="text-sm font-medium text-zinc-700">Tips (one per line)</label><textarea id="ex-tips" value={tipsText} onChange={(e) => setTipsText(e.target.value)} rows={4} placeholder="Tip 1&#10;Tip 2" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
            <div className="flex flex-col gap-1.5"><label htmlFor="ex-mistakes" className="text-sm font-medium text-zinc-700">Common Mistakes (one per line)</label><textarea id="ex-mistakes" value={mistakesText} onChange={(e) => setMistakesText(e.target.value)} rows={4} placeholder="Mistake 1&#10;Mistake 2" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : editId ? "Save Changes" : "Create Exercise"}</Button>
            <button type="button" onClick={resetForm} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64"><svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg><input type="search" placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search exercises" className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as "All" | ExerciseCategory)} aria-label="Filter by category" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="All">All Categories</option>{EXERCISE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value as "All" | MuscleGroup)} aria-label="Filter by muscle group" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="All">All Muscles</option>{MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as "All" | Difficulty)} aria-label="Filter by difficulty" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="All">All Levels</option>{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center"><p className="text-sm text-zinc-400">No exercises found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Name</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Category</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Muscle</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Equipment</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Difficulty</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((ex) => (
                  <tr key={ex.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{ex.name}</td>
                    <td className="px-5 py-3 text-zinc-600">{ex.category}</td>
                    <td className="px-5 py-3 text-zinc-600">{ex.muscle_group}</td>
                    <td className="px-5 py-3 text-zinc-600">{ex.equipment}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(ex.difficulty)}`}>{ex.difficulty}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(ex)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Edit</button>
                        <button type="button" onClick={() => setDeleteTarget(ex.id)} className="text-xs font-medium text-zinc-500 hover:text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete exercise?"
        description="This exercise will be permanently removed. This action cannot be undone."
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
