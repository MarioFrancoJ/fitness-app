"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitnessapp_nutrition_goals";

function loadGoals(): NutritionGoals | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveGoals(goals: NutritionGoals) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function loadUserProfile(): UserData | null {
  try {
    const stored = localStorage.getItem("fitnessapp_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NutritionGoalsPage() {
  const [goals, setGoals] = useState<NutritionGoals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [saved, setSaved] = useState(false);
  const [canAutoCalc, setCanAutoCalc] = useState(false);

  useEffect(() => {
    const existingGoals = loadGoals();
    const user = loadUserProfile();
    const autoGoals = user ? calculateFromProfile(user) : null;

    setCanAutoCalc(autoGoals !== null);

    if (existingGoals) {
      setGoals(existingGoals);
      // Determine mode: if matches auto calculation, it's auto
      if (autoGoals && existingGoals.calories === autoGoals.calories) {
        setMode("auto");
      } else {
        setMode("manual");
      }
    } else if (autoGoals) {
      setGoals(autoGoals);
      setMode("auto");
    }
  }, []);

  function handleAutoCalc() {
    const user = loadUserProfile();
    const autoGoals = user ? calculateFromProfile(user) : null;
    if (autoGoals) {
      setGoals(autoGoals);
      setMode("auto");
      saveGoals(autoGoals);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleManualSave(e: FormEvent) {
    e.preventDefault();
    saveGoals(goals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleChange(field: keyof NutritionGoals, value: string) {
    const parsed = parseInt(value, 10);
    setGoals((prev) => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
    setMode("manual");
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
              ? "border-zinc-900 bg-zinc-900 text-white"
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
              ? "border-zinc-900 bg-zinc-900 text-white"
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
          <p className="text-2xl font-bold text-emerald-600">{goals.fat}g</p>
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
            <Button type="submit">Save Goals</Button>
          </div>
        </form>
      )}

      {/* Save confirmation */}
      {saved && (
        <p className="text-sm font-medium text-emerald-600">
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
