"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";
import { readSlot, getWeekBounds, type PlanSlotValue } from "@/lib/nutrition";

// ── Types ─────────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

type Day = (typeof DAYS)[number];
type Meal = (typeof MEALS)[number];
// A slot value may be a legacy recipe-id string or a structured entry.
type MealPlan = Record<Day, Record<Meal, PlanSlotValue>>;

interface RecipeSummary {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyPlan(): MealPlan {
  const plan = {} as MealPlan;
  for (const day of DAYS) {
    plan[day] = { Breakfast: null, Lunch: null, Dinner: null, Snack: null };
  }
  return plan;
}

/** Monday (YYYY-MM-DD) of the week containing `ref`. Parses/works in UTC to
 * avoid timezone drift, consistent with lib/nutrition helpers. */
function mondayOf(ref: Date): string {
  const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const dow = d.getUTCDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** This week's Monday key (today). */
function currentWeekStart(): string {
  return getWeekBounds(new Date()).start;
}

/** Shift a Monday key by ±7*n days, returning the new Monday key. */
function shiftWeek(weekStart: string, weeks: number): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

/** Sunday key for a given Monday key. */
function weekEnd(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** Human label e.g. "Aug 25 – Aug 31, 2026" for a Monday key. */
function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(`${weekEnd(weekStart)}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const startStr = start.toLocaleDateString("en-US", opts);
  const endStr = end.toLocaleDateString("en-US", opts);
  return `${startStr} – ${endStr}, ${end.getUTCFullYear()}`;
}

/** Resolve a slot value (legacy string or structured) into recipe + servings. */
function getSlot(
  value: PlanSlotValue,
  recipes: RecipeSummary[]
): { recipe: RecipeSummary; servings: number } | undefined {
  const entry = readSlot(value);
  if (!entry) return undefined;
  const recipe = recipes.find((r) => r.id === entry.recipeId);
  if (!recipe) return undefined;
  return { recipe, servings: entry.servings };
}

function dayTotals(plan: MealPlan, day: Day, recipes: RecipeSummary[]) {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  for (const meal of MEALS) {
    const s = getSlot(plan[day][meal], recipes);
    if (s) {
      calories += s.recipe.calories * s.servings;
      protein += s.recipe.protein * s.servings;
      carbs += s.recipe.carbs * s.servings;
      fat += s.recipe.fat * s.servings;
    }
  }
  return { calories, protein, carbs, fat };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MealPlannerPage() {
  const { success: showToast } = useToast();
  const [plan, setPlan] = useState<MealPlan>(emptyPlan());
  const [planId, setPlanId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedDay, setSelectedDay] = useState<Day>("Monday");
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // The Monday of the week currently being edited. Starts on the current week.
  const [weekStart, setWeekStart] = useState<string>(() => currentWeekStart());

  const isCurrentWeek = weekStart === currentWeekStart();

  // Load recipes once (they don't change per week).
  useEffect(() => {
    async function loadRecipes() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: recipesData } = await supabase
        .from("recipes")
        .select("id, name, calories, protein, carbs, fat")
        .order("name");

      if (recipesData) {
        setRecipes(recipesData.map((r) => ({
          id: r.id,
          name: r.name,
          calories: r.calories || 0,
          protein: r.protein || 0,
          carbs: r.carbs || 0,
          fat: r.fat || 0,
        })));
      }
      setLoading(false);
    }
    loadRecipes();
  }, []);

  // Load the plan for the selected week whenever it changes.
  useEffect(() => {
    async function loadWeek() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setWeekLoading(true);
      const start = weekStart;
      const end = weekEnd(weekStart);

      // Tolerant read: order by updated_at so any historical duplicate for the
      // same week never breaks the load (maybeSingle would otherwise error).
      const { data: planData } = await supabase
        .from("meal_plans")
        .select("id, plan_data")
        .eq("user_id", user.id)
        .eq("week_start_date", start)
        .eq("week_end_date", end)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData && planData.plan_data) {
        setPlanId(planData.id);
        setPlan(planData.plan_data as MealPlan);
      } else {
        setPlanId(null);
        setPlan(emptyPlan());
      }
      setWeekLoading(false);
    }
    loadWeek();
  }, [weekStart]);

  // ── Persist to Supabase (always the SELECTED week) ───────────────────────────

  const savePlan = useCallback(async (updatedPlan: MealPlan) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const start = weekStart;
    const end = weekEnd(weekStart);

    if (planId) {
      await supabase
        .from("meal_plans")
        .update({ plan_data: updatedPlan as any })
        .eq("id", planId);
    } else {
      const { data: inserted } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          week_start_date: start,
          week_end_date: end,
          plan_data: updatedPlan as any,
          is_saved: true,
        })
        .select("id")
        .single();

      if (inserted) setPlanId(inserted.id);
    }
    setSaving(false);
  }, [weekStart, planId]);

  // ── Week navigation ──────────────────────────────────────────────────────────
  function goPrevWeek() { setWeekStart((w) => shiftWeek(w, -1)); }
  function goNextWeek() { setWeekStart((w) => shiftWeek(w, 1)); }
  function goCurrentWeek() { setWeekStart(currentWeekStart()); }

  // ── Handlers ────────────────────────────────────────────────────────────────

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

  async function handleClearAll() {
    const cleared = emptyPlan();
    setPlan(cleared);
    await savePlan(cleared);
    showToast("Meal plan cleared");
  }

  const totals = useMemo(() => dayTotals(plan, selectedDay, recipes), [plan, selectedDay, recipes]);

  // Weekly totals
  const weekTotals = useMemo(() => {
    return DAYS.reduce(
      (acc, day) => {
        const t = dayTotals(plan, day, recipes);
        return { calories: acc.calories + t.calories, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fat: acc.fat + t.fat };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [plan, recipes]);

  if (loading) {
    return (
      <PageLoader text="Loading meal planner..." />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Meal Planner</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Plan your meals for the week by assigning recipes to each slot.
              {weekLoading && <span className="ml-2 text-xs text-zinc-400">(Loading week...)</span>}
              {saving && <span className="ml-2 text-xs text-zinc-400">(Saving...)</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Clear Week
          </button>
        </div>

        {/* Week navigation — mirrors the Calendar's prev/next/today pattern */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={goPrevWeek}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            aria-label="Previous week"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
            <span className="hidden sm:inline">Previous Week</span>
          </button>

          <div className="flex items-center gap-2 text-center">
            <span className="text-sm font-semibold text-zinc-900">{formatWeekRange(weekStart)}</span>
            {isCurrentWeek ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">Current Week</span>
            ) : (
              <button
                type="button"
                onClick={goCurrentWeek}
                className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={goNextWeek}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            aria-label="Next week"
          >
            <span className="hidden sm:inline">Next Week</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
          </button>
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
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16">
            <p className="mb-1 text-base font-semibold text-zinc-900">No recipes available</p>
            <p className="text-sm text-zinc-500">Create recipes first to start building your meal plan.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {MEALS.map((meal) => {
              const slotData = getSlot(plan[selectedDay][meal], recipes);
              const selected = slotData?.recipe;
              const selectedServings = slotData?.servings ?? 1;
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
                      <p className="text-sm font-medium text-zinc-900">
                        {selected.name}{selectedServings > 1 ? ` ×${selectedServings}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {selected.calories * selectedServings} kcal · P {selected.protein * selectedServings}g · C {selected.carbs * selectedServings}g · F {selected.fat * selectedServings}g
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
        )}

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

    </>
  );
}
