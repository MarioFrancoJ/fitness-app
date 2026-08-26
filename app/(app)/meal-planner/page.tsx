"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
type MealSlot = "Breakfast" | "Lunch" | "Dinner" | "Snack 1" | "Snack 2";

interface MealPlanRow {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  plan: Record<Day, Record<MealSlot, string | null>>;
  isSaved: boolean;
}

interface RecipeSummary {
  id: string;
  name: string;
  goal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DaySummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_SLOTS: MealSlot[] = ["Breakfast", "Lunch", "Dinner", "Snack 1", "Snack 2"];

// ── Templates ─────────────────────────────────────────────────────────────────

interface PlanTemplate {
  name: string;
  goal: string;
  description: string;
}

const TEMPLATES: PlanTemplate[] = [
  { name: "Fat Loss", goal: "Fat Loss", description: "Low-calorie plan focused on lean proteins and vegetables." },
  { name: "Maintenance", goal: "Maintenance", description: "Balanced plan to maintain current weight and energy." },
  { name: "Muscle Gain", goal: "Muscle Gain", description: "High-protein, high-calorie plan for muscle growth." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyPlan(): Record<Day, Record<MealSlot, string | null>> {
  const plan = {} as Record<Day, Record<MealSlot, string | null>>;
  for (const day of DAYS) {
    plan[day] = { Breakfast: null, Lunch: null, Dinner: null, "Snack 1": null, "Snack 2": null };
  }
  return plan;
}

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

function getDaySummary(plan: Record<MealSlot, string | null>, recipes: RecipeSummary[]): DaySummary {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  for (const slot of MEAL_SLOTS) {
    const id = plan[slot];
    if (!id) continue;
    const r = recipes.find((rec) => rec.id === id);
    if (r) { calories += r.calories; protein += r.protein; carbs += r.carbs; fat += r.fat; }
  }
  return { calories, protein, carbs, fat };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
      </span>
      <p className="text-sm font-medium text-zinc-800">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="ml-1 text-zinc-400 hover:text-zinc-600 focus-visible:outline-none">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-zinc-400" aria-hidden="true">
          <path fillRule="evenodd" d="M9.965 3.038C7.67 3.28 5.64 4.533 4.25 6.492a8.014 8.014 0 0 0-1.223 6.584c.194.8.96 1.284 1.746 1.07A7.95 7.95 0 0 0 7 13.5c1.18 0 2.3.256 3.31.713C10.86 15.48 12.15 16 13.5 16c1.657 0 3-.828 3-2.5C16.5 7.649 13.576 2.664 9.965 3.038Z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="mb-1 text-base font-semibold text-zinc-900">No recipes available</p>
      <p className="mb-6 text-sm text-zinc-500">Create recipes first to start building your meal plan.</p>
      <Link
        href="/nutrition/recipes"
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        View Recipes
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MealPlannerPage() {
  const { success: showToast } = useToast();
  const [mealPlan, setMealPlan] = useState<MealPlanRow>({
    id: "",
    weekStartDate: "",
    weekEndDate: "",
    plan: emptyPlan(),
    isSaved: false,
  });
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedPlans, setSavedPlans] = useState<MealPlanRow[]>([]);
  const [clipboardDay, setClipboardDay] = useState<Record<MealSlot, string | null> | null>(null);


  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load recipes
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("id, name, goal, calories, protein, carbs, fat")
        .order("name");

      if (recipesData) {
        setRecipes(recipesData.map((r) => ({
          id: r.id,
          name: r.name,
          goal: r.goal || "Maintenance",
          calories: r.calories || 0,
          protein: r.protein || 0,
          carbs: r.carbs || 0,
          fat: r.fat || 0,
        })));
      }

      // Load current week's meal plan
      const { start, end } = getWeekDates();
      const { data: planData } = await supabase
        .from("meal_plans")
        .select("id, week_start_date, week_end_date, plan_data, is_saved")
        .eq("user_id", user.id)
        .eq("week_start_date", start)
        .eq("week_end_date", end)
        .maybeSingle();

      if (planData) {
        setMealPlan({
          id: planData.id,
          weekStartDate: planData.week_start_date,
          weekEndDate: planData.week_end_date,
          plan: (planData.plan_data as any) || emptyPlan(),
          isSaved: planData.is_saved || false,
        });
      } else {
        setMealPlan({
          id: "",
          weekStartDate: start,
          weekEndDate: end,
          plan: emptyPlan(),
          isSaved: false,
        });
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // ── Persist ─────────────────────────────────────────────────────────────────

  async function persistPlan(updatedPlan: Record<Day, Record<MealSlot, string | null>>, isSaved?: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    if (mealPlan.id) {
      await supabase
        .from("meal_plans")
        .update({
          plan_data: updatedPlan as any,
          ...(isSaved !== undefined ? { is_saved: isSaved } : {}),
        })
        .eq("id", mealPlan.id);
    } else {
      const { start, end } = getWeekDates();
      const { data: inserted } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          week_start_date: start,
          week_end_date: end,
          plan_data: updatedPlan as any,
          is_saved: isSaved ?? false,
        })
        .select("id")
        .single();

      if (inserted) {
        setMealPlan((prev) => ({ ...prev, id: inserted.id }));
      }
    }

    setSaving(false);
  }

  // ── Setters ────────────────────────────────────────────────────────────────

  function updateSlot(day: Day, slot: MealSlot, recipeId: string | null) {
    setMealPlan((prev) => {
      const next = { ...prev, plan: { ...prev.plan, [day]: { ...prev.plan[day], [slot]: recipeId } } };
      persistPlan(next.plan);
      return next;
    });
  }

  // ── Quick actions ──────────────────────────────────────────────────────────

  function copyDay(day: Day) {
    setClipboardDay({ ...mealPlan.plan[day] });
    showToast(`${day} copied to clipboard`);
  }

  function pasteDay(day: Day) {
    if (!clipboardDay) return;
    setMealPlan((prev) => {
      const next = { ...prev, plan: { ...prev.plan, [day]: { ...clipboardDay } } };
      persistPlan(next.plan);
      return next;
    });
    showToast(`Pasted to ${day}`);
  }

  function clearDay(day: Day) {
    setMealPlan((prev) => {
      const next = { ...prev, plan: { ...prev.plan, [day]: { Breakfast: null, Lunch: null, Dinner: null, "Snack 1": null, "Snack 2": null } } };
      persistPlan(next.plan);
      return next;
    });
    showToast(`${day} cleared`);
  }

  function clearWeek() {
    const cleared = emptyPlan();
    setMealPlan((prev) => ({ ...prev, plan: cleared }));
    persistPlan(cleared);
    showToast("Week cleared");
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  function applyTemplate(template: PlanTemplate) {
    const goalRecipes = recipes.filter((r) => r.goal === template.goal);
    if (goalRecipes.length === 0) {
      showToast("No recipes match this template goal");
      setShowTemplates(false);
      return;
    }

    const newPlan = emptyPlan();
    for (const day of DAYS) {
      for (const slot of MEAL_SLOTS) {
        const idx = (DAYS.indexOf(day) * MEAL_SLOTS.length + MEAL_SLOTS.indexOf(slot)) % goalRecipes.length;
        newPlan[day][slot] = goalRecipes[idx].id;
      }
    }

    setMealPlan((prev) => ({ ...prev, plan: newPlan }));
    persistPlan(newPlan);
    setShowTemplates(false);
    showToast(`${template.name} template applied`);
  }

  // ── Save & Load ────────────────────────────────────────────────────────────

  async function handleSave() {
    await persistPlan(mealPlan.plan, true);
    setMealPlan((prev) => ({ ...prev, isSaved: true }));
    showToast("Meal plan saved!");
  }

  async function handleLoadSaved() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: plans } = await supabase
      .from("meal_plans")
      .select("id, week_start_date, week_end_date, plan_data, is_saved")
      .eq("user_id", user.id)
      .eq("is_saved", true)
      .order("week_start_date", { ascending: false })
      .limit(10);

    if (plans) {
      setSavedPlans(plans.map((p) => ({
        id: p.id,
        weekStartDate: p.week_start_date,
        weekEndDate: p.week_end_date,
        plan: (p.plan_data as any) || emptyPlan(),
        isSaved: p.is_saved || false,
      })));
    }
    setShowSaved(true);
  }

  function handleLoadPlan(plan: MealPlanRow) {
    setMealPlan(plan);
    persistPlan(plan.plan);
    setShowSaved(false);
    showToast("Meal plan loaded");
  }

  async function handleDuplicate() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { start, end } = getWeekDates();
    await supabase
      .from("meal_plans")
      .insert({
        user_id: user.id,
        week_start_date: start,
        week_end_date: end,
        plan_data: mealPlan.plan as any,
        is_saved: true,
      });

    showToast("Meal plan duplicated & saved");
  }

  // ── Summaries ──────────────────────────────────────────────────────────────

  const daySummaries = useMemo(() => {
    const summaries: Record<Day, DaySummary> = {} as Record<Day, DaySummary>;
    for (const day of DAYS) {
      summaries[day] = getDaySummary(mealPlan.plan[day], recipes);
    }
    return summaries;
  }, [mealPlan, recipes]);

  const weeklySummary = useMemo(() => {
    return DAYS.reduce(
      (acc, day) => ({
        calories: acc.calories + daySummaries[day].calories,
        protein: acc.protein + daySummaries[day].protein,
        carbs: acc.carbs + daySummaries[day].carbs,
        fat: acc.fat + daySummaries[day].fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [daySummaries]);

  if (loading) {
    return (
      <PageLoader text="Loading meal planner..." />
    );
  }

  const hasRecipes = recipes.length > 0;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Weekly Meal Planner</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {mealPlan.weekStartDate} — {mealPlan.weekEndDate}
              {saving && <span className="ml-2 text-xs text-zinc-400">(Saving...)</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
              Templates
            </button>
            <button type="button" onClick={handleLoadSaved} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
              Load Plan
            </button>
            <button type="button" onClick={handleDuplicate} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
              Duplicate
            </button>
            <button type="button" onClick={handleSave} className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
              Save Plan
            </button>
          </div>
        </div>

        {!hasRecipes ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Weekly Summary Cards ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xl font-bold text-zinc-900">{weeklySummary.calories}</p>
                <p className="text-xs text-zinc-400">Weekly Calories</p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xl font-bold text-blue-600">{weeklySummary.protein}g</p>
                <p className="text-xs text-zinc-400">Weekly Protein</p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xl font-bold text-amber-500">{weeklySummary.carbs}g</p>
                <p className="text-xs text-zinc-400">Weekly Carbs</p>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-xl font-bold text-emerald-600">{weeklySummary.fat}g</p>
                <p className="text-xs text-zinc-400">Weekly Fat</p>
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={clearWeek} className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Clear Week</button>
              {clipboardDay && <span className="self-center text-xs text-emerald-600 font-medium">Day copied — click Paste on a day</span>}
            </div>

            {/* ── Weekly Grid ── */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header row */}
                <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mb-1">
                  <div /> {/* empty corner */}
                  {DAYS.map((day) => (
                    <div key={day} className="flex flex-col items-center rounded-t-lg bg-zinc-900 px-1 py-2">
                      <span className="text-xs font-semibold text-white">{day.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>

                {/* Meal rows */}
                {MEAL_SLOTS.map((slot) => (
                  <div key={slot} className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mb-1">
                    <div className="flex items-center justify-end pr-2">
                      <span className="text-xs font-medium text-zinc-500">{slot}</span>
                    </div>
                    {DAYS.map((day) => {
                      const recipeId = mealPlan.plan[day][slot];
                      const recipe = recipeId ? recipes.find((r) => r.id === recipeId) : null;
                      return (
                        <div key={`${day}-${slot}`} className="rounded-lg border border-zinc-100 bg-white p-2 min-h-[70px] flex flex-col justify-between shadow-sm">
                          {recipe ? (
                            <>
                              <div>
                                <p className="text-[11px] font-medium text-zinc-900 leading-tight line-clamp-2">{recipe.name}</p>
                                <p className="mt-0.5 text-[9px] text-zinc-400">{recipe.calories}kcal</p>
                              </div>
                              <div className="mt-1 flex gap-1">
                                <button type="button" onClick={() => updateSlot(day, slot, null)} aria-label="Remove" className="text-[9px] text-red-400 hover:text-red-600">Remove</button>
                              </div>
                            </>
                          ) : (
                            <select
                              value=""
                              onChange={(e) => updateSlot(day, slot, e.target.value || null)}
                              aria-label={`Select recipe for ${day} ${slot}`}
                              className="h-full w-full border-0 bg-transparent text-[10px] text-zinc-400 focus:outline-none focus:ring-0"
                            >
                              <option value="">+ Add</option>
                              {recipes.map((r) => (
                                <option key={r.id} value={r.id}>{r.name} ({r.calories}kcal)</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Daily summaries row */}
                <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mt-2">
                  <div className="flex items-center justify-end pr-2">
                    <span className="text-xs font-semibold text-zinc-500">Totals</span>
                  </div>
                  {DAYS.map((day) => {
                    const s = daySummaries[day];
                    return (
                      <div key={day} className="rounded-lg bg-zinc-50 border border-zinc-100 p-2 text-center">
                        <p className="text-xs font-bold text-zinc-900">{s.calories}<span className="font-normal text-zinc-400"> kcal</span></p>
                        <div className="mt-0.5 flex justify-center gap-1 text-[9px]">
                          <span className="text-blue-600">P{s.protein}g</span>
                          <span className="text-amber-500">C{s.carbs}g</span>
                          <span className="text-emerald-600">F{s.fat}g</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day quick action buttons */}
                <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1 mt-1">
                  <div />
                  {DAYS.map((day) => (
                    <div key={day} className="flex justify-center gap-1">
                      <button type="button" onClick={() => copyDay(day)} className="text-[9px] text-zinc-400 hover:text-zinc-700">Copy</button>
                      {clipboardDay && (
                        <button type="button" onClick={() => pasteDay(day)} className="text-[9px] text-emerald-500 hover:text-emerald-700">Paste</button>
                      )}
                      <button type="button" onClick={() => clearDay(day)} className="text-[9px] text-red-400 hover:text-red-600">Clear</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Templates Modal ── */}
      {showTemplates && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowTemplates(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Meal Plan Templates</h2>
              <button type="button" onClick={() => setShowTemplates(false)} aria-label="Close" className="text-zinc-400 hover:text-zinc-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="flex flex-col items-start rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Saved Plans Modal ── */}
      {showSaved && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSaved(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Saved Meal Plans</h2>
              <button type="button" onClick={() => setShowSaved(false)} aria-label="Close" className="text-zinc-400 hover:text-zinc-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
            </div>
            {savedPlans.length === 0 ? (
              <p className="text-sm text-zinc-400">No saved plans yet. Save your current plan to see it here.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {savedPlans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLoadPlan(p)}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{p.weekStartDate} — {p.weekEndDate}</p>
                      <p className="text-xs text-zinc-400">ID: {p.id.slice(0, 8)}…</p>
                    </div>
                    <span className="text-xs font-medium text-zinc-500">Load</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
    </>
  );
}
