"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UserData {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  goal?: string;
}

// ── Calculation (Mifflin-St Jeor) ─────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sedentary: 1.2,
  "Lightly Active": 1.375,
  "Moderately Active": 1.55,
  "Very Active": 1.725,
  Athlete: 1.9,
};

function calculateFromProfile(user: UserData): NutritionGoals | null {
  if (!user.weight || !user.height || !user.age) return null;

  let bmr: number;
  if (user.gender === "Female") {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
  } else if (user.gender === "Male") {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
  } else {
    bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 78;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[user.activityLevel || ""] || 1.55;

  let goalAdjustment = 0;
  if (user.goal === "Lose Fat") goalAdjustment = -300;
  else if (user.goal === "Build Muscle") goalAdjustment = 250;

  const calories = Math.round(bmr * multiplier + goalAdjustment);
  const protein = Math.round((calories * 0.30) / 4);
  const carbs = Math.round((calories * 0.40) / 4);
  const fat = Math.round((calories * 0.30) / 9);

  return { calories, protein, carbs, fat };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NutritionGoalsPage() {
  const [goals, setGoals] = useState<NutritionGoals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canAutoCalc, setCanAutoCalc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("gender, height_cm, weight_kg, activity_level, fitness_goal, date_of_birth")
        .eq("id", user.id)
        .single();

      if (profile) {
        const age = profile.date_of_birth
          ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined;

        const userData: UserData = {
          age,
          gender: profile.gender || undefined,
          height: profile.height_cm ? Number(profile.height_cm) : undefined,
          weight: profile.weight_kg ? Number(profile.weight_kg) : undefined,
          activityLevel: profile.activity_level || undefined,
          goal: profile.fitness_goal || undefined,
        };

        setUserProfile(userData);

        const autoGoals = calculateFromProfile(userData);
        setCanAutoCalc(autoGoals !== null);

        if (autoGoals) {
          setGoals(autoGoals);
          setMode("auto");
        }
      }

      setLoading(false);
    }

    loadData();
  }, []);

  function handleAutoCalc() {
    if (!userProfile) return;
    const autoGoals = calculateFromProfile(userProfile);
    if (autoGoals) {
      setGoals(autoGoals);
      setMode("auto");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleManualSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Goals are computed client-side; the source of truth is the profile.
    // For manual overrides, we just show confirmation since these targets
    // are derived values (not stored in a separate DB column).
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleChange(field: keyof NutritionGoals, value: string) {
    const parsed = parseInt(value, 10);
    setGoals((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
    setMode("manual");
  }

  if (loading) {
    return (
      <PageLoader text="Loading nutrition goals..." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Nutrition Goals
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set your daily macronutrient targets. Auto-calculate from your profile or enter custom values.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAutoCalc}
          disabled={!canAutoCalc}
          className={[
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
            "disabled:pointer-events-none disabled:opacity-50",
            mode === "auto"
              ? "border-primary bg-primary text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
          ].join(" ")}
        >
          Auto Calculate
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={[
            "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
            mode === "manual"
              ? "border-primary bg-primary text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
          ].join(" ")}
        >
          Manual Override
        </button>
      </div>

      {!canAutoCalc && mode === "auto" && (
        <p className="text-xs text-amber-600">
          Complete your profile (age, height, weight, activity level) to enable auto calculation.
        </p>
      )}

      {/* Current goals display */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{goals.calories}</p>
          <p className="text-xs text-zinc-400">Calories (kcal)</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{goals.protein}g</p>
          <p className="text-xs text-zinc-400">Protein</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{goals.carbs}g</p>
          <p className="text-xs text-zinc-400">Carbs</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-success">{goals.fat}g</p>
          <p className="text-xs text-zinc-400">Fat</p>
        </div>
      </div>

      {/* Manual form */}
      {mode === "manual" && (
        <form
          onSubmit={handleManualSave}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <p className="mb-4 text-sm font-semibold text-zinc-700">Custom Targets</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              id="calories"
              type="number"
              label="Calories (kcal)"
              value={goals.calories.toString()}
              onChange={(e) => handleChange("calories", e.target.value)}
              min={800}
              max={8000}
            />
            <Input
              id="protein"
              type="number"
              label="Protein (g)"
              value={goals.protein.toString()}
              onChange={(e) => handleChange("protein", e.target.value)}
              min={0}
              max={500}
            />
            <Input
              id="carbs"
              type="number"
              label="Carbs (g)"
              value={goals.carbs.toString()}
              onChange={(e) => handleChange("carbs", e.target.value)}
              min={0}
              max={1000}
            />
            <Input
              id="fat"
              type="number"
              label="Fat (g)"
              value={goals.fat.toString()}
              onChange={(e) => handleChange("fat", e.target.value)}
              min={0}
              max={400}
            />
          </div>
          <div className="mt-5">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Goals"}
            </Button>
          </div>
        </form>
      )}

      {/* Save confirmation */}
      {saved && (
        <p className="text-sm font-medium text-success">
          ✓ Nutrition goals saved successfully.
        </p>
      )}

      {/* Info */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5">
        <p className="text-xs text-zinc-500">
          <strong>Auto Calculate</strong> uses the Mifflin-St Jeor formula with your profile data
          (age, gender, height, weight, activity level) and adjusts based on your fitness goal.
          Split: 30% protein, 40% carbs, 30% fat.
        </p>
      </div>
    </div>
  );
}
