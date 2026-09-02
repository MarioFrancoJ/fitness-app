"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";
import {
  addRecipeToMealPlan,
  addRecipeIngredientsToShoppingList,
  logMealFromRecipe,
  defaultSlotForRecipe,
  MEAL_SLOTS,
  type MealSlot,
} from "@/lib/nutrition";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecipeGoal = "Fat Loss" | "Muscle Gain" | "Maintenance";
type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  goal: RecipeGoal;
  mealType: MealType | null;
  imageUrl: string | null;
  ingredients: RecipeIngredient[];
  servings: number;
  instructions: string[];
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function goalColor(goal: string) {
  switch (goal) {
    case "Fat Loss":    return "bg-emerald-50 text-emerald-700";
    case "Muscle Gain": return "bg-blue-50 text-blue-700";
    case "Maintenance": return "bg-amber-50 text-amber-700";
    default:            return "bg-zinc-100 text-zinc-700";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { success, error: toastError } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Action controls
  const [slot, setSlot] = useState<MealSlot>("Snack");
  const [servings, setServings] = useState(1);
  const [busy, setBusy] = useState<null | "plan" | "shop" | "log">(null);

  useEffect(() => {
    async function loadRecipe() {
      if (!id) { setLoading(false); setNotFound(true); return; }

      const supabase = createClient();

      const { data, error } = await supabase
        .from("recipes")
        .select(`
          id,
          name,
          description,
          goal,
          meal_type,
          image_url,
          servings,
          prep_time,
          calories,
          protein,
          carbs,
          fat,
          recipe_ingredients (
            id,
            name,
            quantity,
            unit
          ),
          recipe_instructions (
            id,
            step_number,
            instruction
          )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const loaded: Recipe = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        goal: (data.goal || "Maintenance") as RecipeGoal,
        mealType: (data.meal_type || null) as MealType | null,
        imageUrl: data.image_url || null,
        servings: data.servings || 1,
        prepTime: data.prep_time || 0,
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        ingredients: (data.recipe_ingredients || []).map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          quantity: ing.quantity || 0,
          unit: ing.unit || "",
        })),
        instructions: (data.recipe_instructions || [])
          .sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0))
          .map((inst: any) => inst.instruction),
      };

      setRecipe(loaded);
      setSlot(defaultSlotForRecipe(loaded.mealType));
      setLoading(false);
    }
    loadRecipe();
  }, [id]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleAddToPlan() {
    if (!recipe || busy) return;
    setBusy("plan");
    const res = await addRecipeToMealPlan(recipe.id, { slot });
    setBusy(null);
    if (res.ok) success(`Added "${recipe.name}" to this week's ${slot} slot.`);
    else toastError(res.error || "Could not add to meal plan.");
  }

  async function handleAddToShopping() {
    if (!recipe || busy) return;
    setBusy("shop");
    const res = await addRecipeIngredientsToShoppingList(recipe.ingredients, { multiplier: servings });
    setBusy(null);
    if (res.ok) success(`Added ${res.addedCount} ingredient${res.addedCount === 1 ? "" : "s"} to your shopping list.`);
    else toastError(res.error || "Could not add ingredients.");
  }

  async function handleLogMeal() {
    if (!recipe || busy) return;
    setBusy("log");
    const res = await logMealFromRecipe(recipe, { servings, slot });
    setBusy(null);
    if (res.ok) {
      success(`Logged ${servings} serving${servings === 1 ? "" : "s"} of "${recipe.name}" (${Math.round(recipe.calories * servings)} kcal).`);
    } else {
      toastError(res.error || "Could not log meal.");
    }
  }

  if (loading) {
    return <PageLoader text="Loading recipe..." />;
  }

  if (notFound || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="mb-2 text-lg font-semibold text-zinc-900">Recipe Not Found</p>
        <p className="mb-6 text-golden-sm text-zinc-500">This recipe doesn&apos;t exist or has been removed.</p>
        <Link
          href="/nutrition/recipes"
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-golden-sm font-semibold text-white hover:bg-zinc-700"
        >
          &larr; Back to Recipes
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/nutrition/recipes"
        className="inline-flex items-center gap-1 text-golden-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        &larr; Back to Recipes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{recipe.name}</h1>
          {recipe.description && (
            <p className="mt-1 text-golden-sm text-zinc-500">{recipe.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className={`inline-block rounded-full px-3 py-1 text-golden-xs font-semibold ${goalColor(recipe.goal)}`}>
              {recipe.goal}
            </span>
            {recipe.mealType && (
              <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-golden-xs font-medium text-zinc-700">
                {recipe.mealType}
              </span>
            )}
            {recipe.prepTime > 0 && (
              <span className="text-golden-xs text-zinc-400">{recipe.prepTime} min prep</span>
            )}
            <span className="text-golden-xs text-zinc-400">{recipe.servings} serving{recipe.servings > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="h-56 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-zinc-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-10 w-10" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-golden-xs font-medium">Recipe photo</span>
            </div>
          </div>
        )}
      </div>

      {/* Nutrition Facts */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{recipe.calories}</p>
          <p className="text-golden-xs text-zinc-400">Calories</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{recipe.protein}g</p>
          <p className="text-golden-xs text-zinc-400">Protein</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{recipe.carbs}g</p>
          <p className="text-golden-xs text-zinc-400">Carbs</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{recipe.fat}g</p>
          <p className="text-golden-xs text-zinc-400">Fat</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ingredients */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-golden-sm font-semibold uppercase tracking-widest text-zinc-400">
            Ingredients
          </h2>
          {recipe.ingredients.length === 0 ? (
            <p className="text-golden-sm text-zinc-400">No ingredients listed.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recipe.ingredients.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-golden-sm text-zinc-700">
                  <span className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                    {item.name}
                  </span>
                  <span className="shrink-0 text-golden-xs text-zinc-400">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-golden-sm font-semibold uppercase tracking-widest text-zinc-400">
            Instructions
          </h2>
          {recipe.instructions.length === 0 ? (
            <p className="text-golden-sm text-zinc-400">No instructions listed.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-golden-sm text-zinc-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-golden-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Actions panel — Recipe is the source of truth for meals */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-golden-sm font-semibold uppercase tracking-widest text-zinc-400">
          Use this recipe
        </h2>

        {/* Slot + servings controls */}
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="meal-slot" className="mb-1 block text-golden-xs font-medium text-zinc-600">Meal</label>
            <select
              id="meal-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value as MealSlot)}
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-golden-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            >
              {MEAL_SLOTS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="servings" className="mb-1 block text-golden-xs font-medium text-zinc-600">Servings</label>
            <input
              id="servings"
              type="number"
              min={1}
              step={1}
              value={servings}
              onChange={(e) => setServings(Math.max(1, Math.round(Number(e.target.value) || 1)))}
              className="h-9 w-24 rounded-lg border border-zinc-200 bg-white px-3 text-golden-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
          <p className="pb-1.5 text-golden-xs text-zinc-400">
            {Math.round(recipe.calories * servings)} kcal · P {Math.round(recipe.protein * servings)}g · C {Math.round(recipe.carbs * servings)}g · F {Math.round(recipe.fat * servings)}g
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleAddToPlan}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-golden-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            {busy === "plan" ? "Adding…" : "+ Add to Meal Plan"}
          </button>

          {/* Log meal — populates macros automatically */}
          <button
            type="button"
            onClick={handleLogMeal}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-golden-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy === "log" ? "Logging…" : "Log as Meal Today"}
          </button>

          {/* Secondary CTA */}
          <button
            type="button"
            onClick={handleAddToShopping}
            disabled={busy !== null || recipe.ingredients.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-golden-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40"
          >
            {busy === "shop" ? "Adding…" : "Add Ingredients to Shopping List"}
          </button>
        </div>
      </div>
    </div>
  );
}
