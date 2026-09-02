"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  goal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Templates (goal-based week fill, adapted to the 4-slot model) ────────────

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
  // Clipboard for Copy Day / Paste Day (holds one day's 4-slot map).
  const [clipboardDay, setClipboardDay] = useState<Record<Meal, PlanSlotValue> | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  // Which (day, meal) slot the recipe picker is choosing for (null = closed).
  const [pickerTarget, setPickerTarget] = useState<{ day: Day; meal: Meal } | null>(null);
  // Whether the currently loaded week's plan is an explicit saved plan.
  const [isSaved, setIsSaved] = useState(false);
  const [savedPlans, setSavedPlans] = useState<{ id: string; weekStart: string; weekEnd: string }[]>([]);
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
        .select("id, plan_data, is_saved")
        .eq("user_id", user.id)
        .eq("week_start_date", start)
        .eq("week_end_date", end)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData && planData.plan_data) {
        setPlanId(planData.id);
        setPlan(planData.plan_data as MealPlan);
        setIsSaved(planData.is_saved ?? false);
      } else {
        setPlanId(null);
        setPlan(emptyPlan());
        setIsSaved(false);
      }
      setWeekLoading(false);
    }
    loadWeek();
  }, [weekStart]);

  // ── Persist to Supabase (always the SELECTED week) ───────────────────────────

  // Persist the selected week. Auto-saves are drafts (is_saved stays false);
  // only an explicit "Save Plan" passes markSaved=true. An already-saved plan
  // is never silently demoted to draft by an auto-save.
  const savePlan = useCallback(async (updatedPlan: MealPlan, markSaved?: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const start = weekStart;
    const end = weekEnd(weekStart);

    if (planId) {
      await supabase
        .from("meal_plans")
        .update({
          plan_data: updatedPlan as any,
          ...(markSaved ? { is_saved: true } : {}),
        })
        .eq("id", planId);
      if (markSaved) setIsSaved(true);
    } else {
      const { data: inserted } = await supabase
        .from("meal_plans")
        .insert({
          user_id: user.id,
          week_start_date: start,
          week_end_date: end,
          plan_data: updatedPlan as any,
          is_saved: markSaved ?? false,
        })
        .select("id")
        .single();

      if (inserted) setPlanId(inserted.id);
      if (markSaved) setIsSaved(true);
    }
    setSaving(false);
  }, [weekStart, planId]);

  // ── Week navigation ──────────────────────────────────────────────────────────
  function goPrevWeek() { setWeekStart((w) => shiftWeek(w, -1)); }
  function goNextWeek() { setWeekStart((w) => shiftWeek(w, 1)); }
  function goCurrentWeek() { setWeekStart(currentWeekStart()); }

  // ── Handlers ────────────────────────────────────────────────────────────────

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

  // ── Day tools (Copy / Paste / Clear the selected day) ────────────────────────

  function copyDay() {
    // Snapshot the selected day's 4 slots into the clipboard.
    setClipboardDay({ ...plan[selectedDay] });
    showToast(`${selectedDay} copied`);
  }

  function pasteDay() {
    if (!clipboardDay) return;
    const updated = { ...plan, [selectedDay]: { ...clipboardDay } };
    setPlan(updated);
    savePlan(updated);
    showToast(`Pasted to ${selectedDay}`);
  }

  function clearDay() {
    const updated = { ...plan, [selectedDay]: { Breakfast: null, Lunch: null, Dinner: null, Snack: null } };
    setPlan(updated);
    savePlan(updated);
    showToast(`${selectedDay} cleared`);
  }

  // Whether the selected day has anything to copy/clear.
  const selectedDayHasMeals = MEALS.some((m) => readSlot(plan[selectedDay][m]) !== null);

  // ── Day-parameterized helpers (used by the desktop 7-day grid) ───────────────
  // Same behavior as the selected-day handlers, but target an explicit day so
  // the grid can edit any cell directly. All persist via the week-scoped savePlan.
  function setSlotFor(day: Day, meal: Meal, recipeId: string) {
    const updated = { ...plan, [day]: { ...plan[day], [meal]: recipeId || null } };
    setPlan(updated);
    savePlan(updated);
  }
  function clearSlotFor(day: Day, meal: Meal) {
    const updated = { ...plan, [day]: { ...plan[day], [meal]: null } };
    setPlan(updated);
    savePlan(updated);
  }
  function copyDayOf(day: Day) {
    setClipboardDay({ ...plan[day] });
    showToast(`${day} copied`);
  }
  function pasteDayInto(day: Day) {
    if (!clipboardDay) return;
    const updated = { ...plan, [day]: { ...clipboardDay } };
    setPlan(updated);
    savePlan(updated);
    showToast(`Pasted to ${day}`);
  }
  function clearDayOf(day: Day) {
    const updated = { ...plan, [day]: { Breakfast: null, Lunch: null, Dinner: null, Snack: null } };
    setPlan(updated);
    savePlan(updated);
    showToast(`${day} cleared`);
  }
  function dayHasMeals(day: Day) {
    return MEALS.some((m) => readSlot(plan[day][m]) !== null);
  }

  // ── Templates (fill the whole week by goal, 4-slot model) ────────────────────

  // Does the CURRENT week have any planned meal on any day/slot?
  const weekHasMeals = DAYS.some((d) => MEALS.some((m) => readSlot(plan[d][m]) !== null));

  function applyTemplate(template: PlanTemplate) {
    const goalRecipes = recipes.filter((r) => r.goal === template.goal);
    if (goalRecipes.length === 0) {
      showToast(`No recipes match the ${template.name} goal`);
      setShowTemplates(false);
      return;
    }

    // Fill every day/slot by cycling through the goal's recipes (same approach
    // as Planner B, mapped to the 4-slot MEALS array). Writes plain recipe-id
    // strings, which readSlot normalizes everywhere (Calendar/Shopping List).
    const newPlan = emptyPlan();
    for (const day of DAYS) {
      for (const meal of MEALS) {
        const idx = (DAYS.indexOf(day) * MEALS.length + MEALS.indexOf(meal)) % goalRecipes.length;
        newPlan[day][meal] = goalRecipes[idx].id;
      }
    }

    setPlan(newPlan);
    savePlan(newPlan);
    setShowTemplates(false);
    showToast(`${template.name} template applied`);
  }

  // ── Save / Load / Duplicate ──────────────────────────────────────────────────

  // Explicitly mark the current week's plan as saved (is_saved = true).
  async function handleSavePlan() {
    await savePlan(plan, true);
    showToast(isSaved ? "Plan updated" : "Plan saved");
  }

  // Open the Load modal, fetching this user's saved plans (is_saved = true).
  async function handleOpenLoad() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("meal_plans")
      .select("id, week_start_date, week_end_date")
      .eq("user_id", user.id)
      .eq("is_saved", true)
      .order("week_start_date", { ascending: false })
      .limit(20);

    setSavedPlans((data ?? []).map((p) => ({
      id: p.id,
      weekStart: p.week_start_date,
      weekEnd: p.week_end_date,
    })));
    setShowLoad(true);
  }

  // Load a saved plan: navigate to its week (which reloads plan + is_saved).
  function handleLoadPlan(weekStartKey: string) {
    setShowLoad(false);
    setWeekStart(weekStartKey);
    setSelectedDay("Monday");
    showToast("Plan loaded");
  }

  // Duplicate the current week's plan into the NEXT EMPTY week (going forward).
  // Uses load-or-create so it never violates the unique (user, week) index.
  async function handleDuplicateWeek() {
    if (!weekHasMeals) { showToast("This week is empty — nothing to duplicate"); return; }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Look ahead up to 52 weeks for the first week with no planned meals.
    let cursor = shiftWeek(weekStart, 1);
    let targetStart: string | null = null;
    for (let i = 0; i < 52; i++) {
      const end = weekEnd(cursor);
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("id, plan_data")
        .eq("user_id", user.id)
        .eq("week_start_date", cursor)
        .eq("week_end_date", end)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const occupied =
        existing?.plan_data &&
        DAYS.some((d) => MEALS.some((m) => readSlot((existing.plan_data as MealPlan)[d]?.[m]) !== null));

      if (!occupied) { targetStart = cursor; break; }
      cursor = shiftWeek(cursor, 1);
    }

    if (!targetStart) { showToast("No empty week found in the next year"); return; }

    const targetEnd = weekEnd(targetStart);
    // Write the copied plan into the target week as a DRAFT (is_saved = false).
    const { data: existingTarget } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start_date", targetStart)
      .eq("week_end_date", targetEnd)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingTarget?.id) {
      await supabase.from("meal_plans").update({ plan_data: plan as any }).eq("id", existingTarget.id);
    } else {
      await supabase.from("meal_plans").insert({
        user_id: user.id,
        week_start_date: targetStart,
        week_end_date: targetEnd,
        plan_data: plan as any,
        is_saved: false,
      });
    }

    showToast(`Duplicated to ${formatWeekRange(targetStart)}`);
    setWeekStart(targetStart); // jump to the new week so the user sees it
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              Templates
            </button>
            <button
              type="button"
              onClick={handleOpenLoad}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              Load Plan
            </button>
            <button
              type="button"
              onClick={handleDuplicateWeek}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              Duplicate Week
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              {isSaved ? "Update Plan" : "Save Plan"}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Clear Week
            </button>
          </div>
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
            {isSaved && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">Saved</span>
            )}
            {isCurrentWeek ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">Current Week</span>
            ) : (
              <button
                type="button"
                onClick={goCurrentWeek}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" /></svg>
                Go to Current Week
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

        {/* Weekly KPIs — shown above the grid for the whole selected week */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-zinc-900">{weekTotals.calories}</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">Weekly Calories</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{weekTotals.protein}g</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">Weekly Protein</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{weekTotals.carbs}g</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">Weekly Carbs</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{weekTotals.fat}g</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-400">Weekly Fat</p>
          </div>
        </div>

        {/* ── MOBILE / TABLET: day-tab experience (unchanged) ── */}
        <div className="flex flex-col gap-6 lg:hidden">
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

        {/* Day tools — Copy / Paste / Clear the selected day */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">{selectedDay}:</span>
          <button
            type="button"
            onClick={copyDay}
            disabled={!selectedDayHasMeals}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40"
          >
            Copy Day
          </button>
          <button
            type="button"
            onClick={pasteDay}
            disabled={!clipboardDay}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-40"
          >
            Paste Day
          </button>
          <button
            type="button"
            onClick={clearDay}
            disabled={!selectedDayHasMeals}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-40"
          >
            Clear Day
          </button>
          {clipboardDay && (
            <span className="text-xs text-zinc-400">Day copied — Paste applies it to the selected day</span>
          )}
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
                      <p className="mt-1 text-xs text-zinc-500">
                        {selected.calories * selectedServings} kcal
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {selected.protein * selectedServings}g Prot. · {selected.carbs * selectedServings}g Carb. · {selected.fat * selectedServings}g Fat
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ day: selectedDay, meal })}
                      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M10 5a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 10 5Z" /></svg>
                      Add recipe
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
        {/* ── /MOBILE ── */}

        {/* ── DESKTOP: full 7-day week grid (all days + 4 slots + day totals) ── */}
        {recipes.length === 0 ? (
          <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16">
            <p className="mb-1 text-base font-semibold text-zinc-900">No recipes available</p>
            <p className="text-sm text-zinc-500">Create recipes first to start building your meal plan.</p>
          </div>
        ) : (
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[880px]">
              {/* Header row: day names + per-day tools */}
              <div className="grid grid-cols-[88px_repeat(7,1fr)] gap-1">
                <div />
                {DAYS.map((day) => (
                  <div key={day} className="flex flex-col items-center gap-1.5 rounded-t-lg bg-zinc-900 px-1 py-2">
                    <span className="text-xs font-semibold text-white">{day.slice(0, 3)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyDayOf(day)}
                        disabled={!dayHasMeals(day)}
                        title={`Copy ${day}`}
                        aria-label={`Copy ${day}`}
                        className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-zinc-200 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-25"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 7 12.5v-9Z" /><path d="M5 6.5A1.5 1.5 0 0 0 3.5 8v8A1.5 1.5 0 0 0 5 17.5h5A1.5 1.5 0 0 0 11.5 16H8.5A2.5 2.5 0 0 1 6 13.5V6.5H5Z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => pasteDayInto(day)}
                        disabled={!clipboardDay}
                        title={`Paste to ${day}`}
                        aria-label={`Paste to ${day}`}
                        className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-200 transition-colors hover:bg-emerald-500/40 hover:text-white disabled:opacity-25"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true"><path d="M8 2a2 2 0 0 0-1.94 1.5H5.5A1.5 1.5 0 0 0 4 5v11a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 16 16V5a1.5 1.5 0 0 0-1.5-1.5h-.56A2 2 0 0 0 12 2H8Zm0 1.5h4a.5.5 0 0 1 .5.5v.5h-5V4a.5.5 0 0 1 .5-.5Z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => clearDayOf(day)}
                        disabled={!dayHasMeals(day)}
                        title={`Clear ${day}`}
                        aria-label={`Clear ${day}`}
                        className="flex h-5 w-5 items-center justify-center rounded bg-red-500/20 text-red-200 transition-colors hover:bg-red-500/40 hover:text-white disabled:opacity-25"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41 41 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5Z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* One row per meal slot */}
              {MEALS.map((meal) => (
                <div key={meal} className="mt-1 grid grid-cols-[88px_repeat(7,1fr)] gap-1">
                  <div className="flex items-center justify-end pr-2">
                    <span className="text-xs font-medium text-zinc-500">{meal}</span>
                  </div>
                  {DAYS.map((day) => {
                    const slotData = getSlot(plan[day][meal], recipes);
                    const selected = slotData?.recipe;
                    const servings = slotData?.servings ?? 1;
                    return (
                      <div key={`${day}-${meal}`} className="flex min-h-[64px] flex-col justify-between rounded-lg border border-zinc-100 bg-white p-1.5 shadow-sm">
                        {selected ? (
                          <>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-xs font-medium leading-tight text-zinc-900">
                                {selected.name}{servings > 1 ? ` ×${servings}` : ""}
                              </p>
                              <p className="mt-0.5 text-[11px] text-zinc-400">{selected.calories * servings} kcal</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => clearSlotFor(day, meal)}
                              className="mt-1 self-start text-[11px] font-medium text-red-400 transition-colors hover:text-red-600"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPickerTarget({ day, meal })}
                            aria-label={`Add recipe for ${day} ${meal}`}
                            className="flex h-full min-h-[52px] w-full items-center justify-center gap-1 rounded-md text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d="M10 5a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5h-3.5a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 10 5Z" /></svg>
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Per-day totals row */}
              <div className="mt-1 grid grid-cols-[88px_repeat(7,1fr)] gap-1">
                <div className="flex items-center justify-end pr-2">
                  <span className="text-xs font-semibold text-zinc-500">Totals</span>
                </div>
                {DAYS.map((day) => {
                  const t = dayTotals(plan, day, recipes);
                  return (
                    <div key={`${day}-totals`} className="rounded-lg border border-zinc-100 bg-zinc-50 p-1.5 text-center">
                      <p className="text-xs font-bold text-zinc-900">{t.calories}<span className="font-normal text-zinc-400"> kcal</span></p>
                      <div className="mt-0.5 flex justify-center gap-1 text-[11px]">
                        <span className="text-blue-600">P{t.protein}</span>
                        <span className="text-amber-600">C{t.carbs}</span>
                        <span className="text-emerald-600">F{t.fat}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Recipe picker (searchable, scales to a large library) */}
      {pickerTarget && (
        <RecipePicker
          recipes={recipes}
          day={pickerTarget.day}
          meal={pickerTarget.meal}
          onSelect={(recipeId) => {
            setSlotFor(pickerTarget.day, pickerTarget.meal, recipeId);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}

      {/* Templates modal */}
      {showTemplates && (
        <TemplatesModal
          weekHasMeals={weekHasMeals}
          onApply={applyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Load saved plans modal */}
      {showLoad && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Load a saved plan"
          onClick={() => setShowLoad(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Saved Plans</h2>
              <button type="button" onClick={() => setShowLoad(false)} aria-label="Close" className="text-zinc-400 hover:text-zinc-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
            </div>
            {savedPlans.length === 0 ? (
              <p className="text-sm text-zinc-400">No saved plans yet. Use “Save Plan” to keep the current week.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {savedPlans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLoadPlan(p.weekStart)}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    <span className="text-sm font-medium text-zinc-900">{formatWeekRange(p.weekStart)}</span>
                    <span className="text-xs font-medium text-zinc-500">Load</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Recipe picker modal (searchable — scales to a large recipe library) ──────

function RecipePicker({
  recipes,
  day,
  meal,
  onSelect,
  onClose,
}: {
  recipes: RecipeSummary[];
  day: Day;
  meal: Meal;
  onSelect: (recipeId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState<"All" | string>("All");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goals = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.goal).filter(Boolean))),
    [recipes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchesQuery = !q || r.name.toLowerCase().includes(q);
      const matchesGoal = goalFilter === "All" || r.goal === goalFilter;
      return matchesQuery && matchesGoal;
    });
  }, [recipes, query, goalFilter]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Choose a recipe for ${day} ${meal}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + search */}
        <div className="border-b border-zinc-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Add a recipe</h2>
              <p className="text-xs text-zinc-400">{day} · {meal}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
            </button>
          </div>
          <div className="relative">
            <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes..."
              aria-label="Search recipes"
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
          {goals.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["All", ...goals] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoalFilter(g)}
                  aria-pressed={goalFilter === g}
                  className={[
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    goalFilter === g ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
                  ].join(" ")}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-400">No recipes match “{query}”.</p>
          ) : (
            <ul className="flex flex-col">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900">{r.name}</span>
                      <span className="block text-xs text-zinc-400">
                        {r.calories} kcal · {r.protein}g Prot. · {r.carbs}g Carb. · {r.fat}g Fat
                      </span>
                    </span>
                    {r.goal && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">{r.goal}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-100 px-4 py-2 text-center text-xs text-zinc-400">
          {filtered.length} of {recipes.length} recipes
        </div>
      </div>
    </div>
  );
}

// ── Templates modal ───────────────────────────────────────────────────────────

function TemplatesModal({
  weekHasMeals,
  onApply,
  onClose,
}: {
  weekHasMeals: boolean;
  onApply: (t: PlanTemplate) => void;
  onClose: () => void;
}) {
  // When the week already has meals, require an explicit confirm before a
  // template overwrites it (rule #5).
  const [pending, setPending] = useState<PlanTemplate | null>(null);

  function handlePick(t: PlanTemplate) {
    if (weekHasMeals) setPending(t);
    else onApply(t);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Meal plan templates"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Meal Plan Templates</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        {pending ? (
          // Confirmation step (week not empty)
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-700">
              This week already has planned meals. Applying the{" "}
              <strong className="font-semibold">{pending.name}</strong> template will{" "}
              <strong className="font-semibold text-red-600">overwrite the entire week</strong>. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onApply(pending)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Overwrite week
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {weekHasMeals && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                This week has planned meals — choosing a template will ask before overwriting.
              </p>
            )}
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => handlePick(t)}
                className="flex flex-col items-start rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50"
              >
                <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{t.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
