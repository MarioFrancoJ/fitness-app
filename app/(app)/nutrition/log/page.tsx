"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FoodLogPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>({ calories: 2200, protein: 165, carbs: 220, fat: 73 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ── Load from Supabase ────────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load today's meals
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("id, name, calories, protein, carbs, fat, time")
        .eq("date", today)
        .order("created_at", { ascending: true });

      if (meals) {
        setEntries(meals.map((m) => ({
          id: m.id,
          name: m.name,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          time: m.time || "",
        })));
      }

      // Load profile for goals calculation
      const { data: profile } = await supabase
        .from("users")
        .select("weight_kg, height_cm, gender, activity_level, fitness_goal, date_of_birth")
        .eq("id", user.id)
        .single();

      if (profile && profile.weight_kg && profile.height_cm) {
        const weight = Number(profile.weight_kg);
        const height = Number(profile.height_cm);
        const age = profile.date_of_birth
          ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 30;
        const isFemale = profile.gender === "Female";
        const bmr = isFemale
          ? 10 * weight + 6.25 * height - 5 * age - 161
          : 10 * weight + 6.25 * height - 5 * age + 5;
        const multipliers: Record<string, number> = { Sedentary: 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55, "Very Active": 1.725, Athlete: 1.9 };
        const mult = multipliers[profile.activity_level || ""] || 1.55;
        const goalAdj = (profile.fitness_goal || "").includes("Lose") ? -300 : (profile.fitness_goal || "").includes("Build") ? 250 : 0;
        const cal = Math.round(bmr * mult + goalAdj);
        setGoals({ calories: cal, protein: Math.round((cal * 0.3) / 4), carbs: Math.round((cal * 0.4) / 4), fat: Math.round((cal * 0.3) / 9) });
      }

      setLoading(false);
    }
    loadData();
  }, [today]);

  // ── Totals ────────────────────────────────────────────────────────────────

  const totals = entries.reduce(
    (acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const remaining = goals.calories - totals.calories;

  // ── Add entry ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Food name is required."); return; }
    const cal = parseInt(calories, 10);
    if (!calories.trim() || isNaN(cal) || cal < 0) { setError("Enter valid calories."); return; }

    setError("");
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const timeNow = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const { data: inserted, error: insertErr } = await supabase
      .from("meal_logs")
      .insert({
        user_id: user.id,
        meal_type: "Snack",
        name: name.trim(),
        calories: cal,
        protein: parseInt(protein, 10) || 0,
        carbs: parseInt(carbs, 10) || 0,
        fat: parseInt(fat, 10) || 0,
        date: today,
        time: timeNow,
      })
      .select("id, name, calories, protein, carbs, fat, time")
      .single();

    if (!insertErr && inserted) {
      setEntries((prev) => [...prev, { id: inserted.id, name: inserted.name, calories: inserted.calories, protein: inserted.protein, carbs: inserted.carbs, fat: inserted.fat, time: inserted.time || "" }]);
    }

    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setSaving(false);
  }

  // ── Remove entry ──────────────────────────────────────────────────────────

  async function handleRemove(id: string) {
    const supabase = createClient();
    await supabase.from("meal_logs").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageLoader text="Loading food log..." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Food Log</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track what you eat today. {entries.length} entr{entries.length !== 1 ? "ies" : "y"} logged.
        </p>
      </div>

      {/* Daily summary cards */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-zinc-900">{totals.calories}</p>
          <p className="text-xs text-zinc-400">Eaten</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className={`text-lg font-bold ${remaining >= 0 ? "text-success" : "text-red-600"}`}>{remaining}</p>
          <p className="text-xs text-zinc-400">Remaining</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-blue-600">{totals.protein}g</p>
          <p className="text-xs text-zinc-400">Protein</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-amber-600">{totals.carbs}g</p>
          <p className="text-xs text-zinc-400">Carbs</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-success">{totals.fat}g</p>
          <p className="text-xs text-zinc-400">Fat</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">{totals.calories} / {goals.calories} kcal</span>
          <span className="font-medium text-zinc-700">{Math.min(Math.round((totals.calories / goals.calories) * 100), 100)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className={`h-full rounded-full transition-all ${totals.calories > goals.calories ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Add food form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-zinc-700">Add Food</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input id="food-name" type="text" label="Food" placeholder="e.g. Grilled Chicken" value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} />
          <Input id="food-cal" type="number" label="Calories" placeholder="e.g. 320" min={0} value={calories} onChange={(e) => { setCalories(e.target.value); if (error) setError(""); }} />
          <Input id="food-protein" type="number" label="Protein (g)" placeholder="e.g. 38" min={0} value={protein} onChange={(e) => setProtein(e.target.value)} />
          <Input id="food-carbs" type="number" label="Carbs (g)" placeholder="e.g. 12" min={0} value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          <Input id="food-fat" type="number" label="Fat (g)" placeholder="e.g. 14" min={0} value={fat} onChange={(e) => setFat(e.target.value)} />
        </div>
        {error && <p className="mt-2 text-xs text-red-500" role="alert">{error}</p>}
        <div className="mt-5">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Log Food"}</Button>
        </div>
      </form>

      {/* Today's entries */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-700">Today&apos;s Log</p>
        </div>
        {entries.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">No food logged today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Time</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Food</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Cal</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Protein</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Carbs</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Fat</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-400">{entry.time}</td>
                    <td className="px-5 py-3 font-medium text-zinc-900">{entry.name}</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.calories}</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.protein}g</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.carbs}g</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.fat}g</td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => handleRemove(entry.id)} aria-label={`Remove ${entry.name}`} className="text-xs font-medium text-zinc-400 transition-colors hover:text-red-600">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
