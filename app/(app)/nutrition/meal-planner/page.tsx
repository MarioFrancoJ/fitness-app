"use client";

import { useState, useEffect } from "react";
import { recipes, type Recipe } from "@/data/recipes";

// ── Types ─────────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

type Day = (typeof DAYS)[number];
type Meal = (typeof MEALS)[number];
type MealPlan = Record<Day, Record<Meal, string | null>>; // recipe ID or null

const STORAGE_KEY = "fitnessapp_meal_plan";

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyPlan(): MealPlan {
  const plan = {} as MealPlan;
  for (const day of DAYS) {
    plan[day] = { Breakfast: null, Lunch: null, Dinner: null, Snack: null };
  }
  return plan;
}

function loadPlan(): MealPlan {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : emptyPlan();
  } catch {
    return emptyPlan();
  }
}

function savePlan(plan: MealPlan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function getRecipe(id: string | null): Recipe | undefined {
  if (!id) return undefined;
  return recipes.find((r) => r.id === id);
}

function dayTotals(plan: MealPlan, day: Day) {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  for (const meal of MEALS) {
    const r = getRecipe(plan[day][meal]);
    if (r) { calories += r.calories; protein += r.protein; carbs += r.carbs; fat += r.fat; }
  }
  return { calories, protein, carbs, fat };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MealPlannerPage() {
  const [plan, setPlan] = useState<MealPlan>(emptyPlan());
  const [selectedDay, setSelectedDay] = useState<Day>("Monday");

  useEffect(() => {
    setPlan(loadPlan());
  }, []);

  function handleSelect(meal: Meal, recipeId: string) {
    const updated = { ...plan, [selectedDay]: { ...plan[selectedDay], [meal]: recipeId || null } };
    setPlan(updated);
    savePlan(updated);
  }

  function handleClear(meal: Meal) {
    const updated = { ...plan, [selectedDay]: { ...plan[selectedDay], [meal]: null } };
    setPlan(updated);
    savePlan(updated);
  }

  const totals = dayTotals(plan, selectedDay);

  // Weekly totals
  const weekTotals = DAYS.reduce(
    (acc, day) => {
      const t = dayTotals(plan, day);
      return { calories: acc.calories + t.calories, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fat: acc.fat + t.fat };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Meal Planner</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Plan your meals for the week by assigning recipes to each slot.
        </p>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-1">
        {DAYS.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelectedDay(day)}
            className={[
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
              selectedDay === day
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900",
            ].join(" ")}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Day totals */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-zinc-900">{totals.calories}</p>
          <p className="text-xs text-zinc-400">Calories</p>
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
          <p className="text-lg font-bold text-emerald-600">{totals.fat}g</p>
          <p className="text-xs text-zinc-400">Fat</p>
        </div>
      </div>

      {/* Meal slots */}
      <div className="grid gap-4 sm:grid-cols-2">
        {MEALS.map((meal) => {
          const selected = getRecipe(plan[selectedDay][meal]);
          return (
            <div key={meal} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-700">{meal}</p>
                {selected && (
                  <button
                    type="button"
                    onClick={() => handleClear(meal)}
                    className="text-xs font-medium text-zinc-400 transition-colors hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>

              {selected ? (
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-sm font-medium text-zinc-900">{selected.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {selected.calories} kcal · P {selected.protein}g · C {selected.carbs}g · F {selected.fat}g
                  </p>
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => handleSelect(meal, e.target.value)}
                  aria-label={`Select recipe for ${meal}`}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="" disabled>
                    Select a recipe...
                  </option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.calories} kcal)
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly summary */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Weekly Totals
        </p>
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-zinc-700">
            <strong className="text-zinc-900">{weekTotals.calories}</strong> kcal
          </span>
          <span className="text-zinc-700">
            <strong className="text-blue-600">{weekTotals.protein}g</strong> protein
          </span>
          <span className="text-zinc-700">
            <strong className="text-amber-600">{weekTotals.carbs}g</strong> carbs
          </span>
          <span className="text-zinc-700">
            <strong className="text-emerald-600">{weekTotals.fat}g</strong> fat
          </span>
        </div>
      </div>
    </div>
  );
}
