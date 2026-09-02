/**
 * Nutrition flow helpers — the connective tissue that turns a Recipe into a
 * Meal, a Meal Plan entry, and Shopping List items.
 *
 * Recipe = source of truth. These helpers read a recipe's stored macros /
 * ingredients and write into the user-owned tables (meal_plans, meal_logs,
 * shopping_lists), so pages never re-implement this logic.
 *
 * All writes set user_id (RLS-required). Every function returns a small result
 * object { ok, error?, ... } so callers can surface success/failure in the UI.
 */

import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const PLAN_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type PlanDay = (typeof PLAN_DAYS)[number];

type PlanData = Record<string, Record<string, string | null>>;

export interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

export interface MutationResult {
  ok: boolean;
  error?: string;
}

// ── Date helpers ────────────────────────────────────────────────────────────

/** Monday-based ISO week bounds for the week containing `ref` (default: today). */
export function getWeekBounds(ref: Date = new Date()): { start: string; end: string } {
  const dayOfWeek = ref.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

/** The PlanDay name (Monday…Sunday) for a given date (default: today). */
export function getPlanDayForDate(ref: Date = new Date()): PlanDay {
  const dayOfWeek = ref.getDay(); // 0=Sun … 6=Sat
  const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday-first
  return PLAN_DAYS[index];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyPlan(): PlanData {
  const plan: PlanData = {};
  for (const day of PLAN_DAYS) {
    plan[day] = { Breakfast: null, Lunch: null, Dinner: null, Snack: null };
  }
  return plan;
}

/**
 * Pick a sensible default meal slot for a recipe. Uses the recipe's own
 * meal_type when present; otherwise falls back to "Snack" (the neutral slot).
 */
export function defaultSlotForRecipe(mealType?: string | null): MealSlot {
  if (mealType && (MEAL_SLOTS as readonly string[]).includes(mealType)) {
    return mealType as MealSlot;
  }
  return "Snack";
}

// ── 1. Recipe → Meal Plan ─────────────────────────────────────────────────────

/**
 * Assign a recipe to a slot in the current week's meal plan.
 * Loads (or creates) the week's meal_plans row and sets plan_data[day][slot].
 */
export async function addRecipeToMealPlan(
  recipeId: string,
  opts: { day?: PlanDay; slot: MealSlot }
): Promise<MutationResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const day = opts.day ?? getPlanDayForDate();
  const { start, end } = getWeekBounds();

  const { data: existing, error: loadErr } = await supabase
    .from("meal_plans")
    .select("id, plan_data")
    .eq("user_id", user.id)
    .eq("week_start_date", start)
    .eq("week_end_date", end)
    .maybeSingle();

  if (loadErr) return { ok: false, error: loadErr.message };

  const plan: PlanData = (existing?.plan_data as PlanData) ?? emptyPlan();
  if (!plan[day]) plan[day] = { Breakfast: null, Lunch: null, Dinner: null, Snack: null };
  plan[day][opts.slot] = recipeId;

  if (existing?.id) {
    const { error } = await supabase
      .from("meal_plans")
      .update({ plan_data: plan as never })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: user.id,
        week_start_date: start,
        week_end_date: end,
        plan_data: plan as never,
        is_saved: true,
      });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

// ── 2. Recipe → Meal log ──────────────────────────────────────────────────────

/**
 * Log a meal directly from a recipe. Macros are taken from the recipe and
 * multiplied by `servings`, so the user never types nutrition manually.
 * Stores recipe_id for provenance.
 */
export async function logMealFromRecipe(
  recipe: { id: string; name: string; meal_type?: string | null } & RecipeMacros,
  opts: { servings?: number; slot?: MealSlot; date?: string } = {}
): Promise<MutationResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const servings = opts.servings && opts.servings > 0 ? opts.servings : 1;
  const slot = opts.slot ?? defaultSlotForRecipe(recipe.meal_type);

  const { error } = await supabase.from("meal_logs").insert({
    user_id: user.id,
    recipe_id: recipe.id,
    meal_type: slot,
    name: recipe.name,
    calories: Math.round((recipe.calories || 0) * servings),
    protein: Math.round((recipe.protein || 0) * servings),
    carbs: Math.round((recipe.carbs || 0) * servings),
    fat: Math.round((recipe.fat || 0) * servings),
    servings,
    date: opts.date ?? todayKey(),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── 3. Recipe → Shopping List ─────────────────────────────────────────────────

/**
 * Normalize an ingredient name for de-duplication (case/space-insensitive).
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Parse a stringified quantity like "500 g" or "2" into { qty, unit }. */
function parseQuantity(raw: string): { qty: number; unit: string } {
  const match = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return { qty: NaN, unit: raw.trim() };
  return { qty: parseFloat(match[1]), unit: match[2].trim() };
}

function formatQuantity(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100;
  return `${rounded}${unit ? ` ${unit}` : ""}`.trim();
}

/**
 * Merge a set of recipe ingredients into an existing shopping-list item array,
 * combining duplicates by name and summing quantities when units match.
 * Pure function — exported for reuse/testing.
 */
export function mergeIngredientsIntoItems(
  existing: ShoppingItem[],
  ingredients: RecipeIngredientInput[],
  multiplier = 1
): ShoppingItem[] {
  const items = existing.map((i) => ({ ...i }));
  const indexByName = new Map<string, number>();
  items.forEach((item, i) => indexByName.set(normalizeName(item.name), i));

  for (const ing of ingredients) {
    if (!ing.name?.trim()) continue;
    const key = normalizeName(ing.name);
    const addQty = (ing.quantity || 0) * multiplier;
    const idx = indexByName.get(key);

    if (idx === undefined) {
      items.push({
        id: crypto.randomUUID(),
        name: ing.name.trim(),
        quantity: formatQuantity(addQty, ing.unit || ""),
        checked: false,
      });
      indexByName.set(key, items.length - 1);
      continue;
    }

    // Combine with an existing item when the units are compatible.
    const current = items[idx];
    const parsed = parseQuantity(current.quantity);
    const sameUnit = (parsed.unit || "") === (ing.unit || "");
    if (!Number.isNaN(parsed.qty) && sameUnit) {
      items[idx] = {
        ...current,
        quantity: formatQuantity(parsed.qty + addQty, ing.unit || ""),
      };
    } else {
      // Units differ or unparseable — append as a separate qualified line.
      items.push({
        id: crypto.randomUUID(),
        name: ing.name.trim(),
        quantity: formatQuantity(addQty, ing.unit || ""),
        checked: false,
      });
    }
  }

  return items;
}

/**
 * Add a recipe's ingredients to the user's shopping list. Loads (or creates)
 * the most recent shopping list, merges ingredients (combining duplicates),
 * and persists.
 */
export async function addRecipeIngredientsToShoppingList(
  ingredients: RecipeIngredientInput[],
  opts: { multiplier?: number } = {}
): Promise<MutationResult & { addedCount?: number }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  if (!ingredients || ingredients.length === 0) {
    return { ok: false, error: "This recipe has no ingredients to add." };
  }

  const { data: list, error: loadErr } = await supabase
    .from("shopping_lists")
    .select("id, items")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (loadErr) return { ok: false, error: loadErr.message };

  const existingItems: ShoppingItem[] = (((list?.items as unknown) as ShoppingItem[]) ?? []).map((i) => ({
    id: i.id || crypto.randomUUID(),
    name: i.name || "",
    quantity: i.quantity || "—",
    checked: i.checked || false,
  }));

  const merged = mergeIngredientsIntoItems(existingItems, ingredients, opts.multiplier ?? 1);

  if (list?.id) {
    const { error } = await supabase
      .from("shopping_lists")
      .update({ items: merged as never })
      .eq("id", list.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id, items: merged as never });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, addedCount: ingredients.length };
}
