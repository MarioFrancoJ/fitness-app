"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  addRecipeToMealPlan,
  addRecipeIngredientsToShoppingList,
  defaultSlotForRecipe,
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
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const RECIPE_GOALS: RecipeGoal[] = ["Fat Loss", "Muscle Gain", "Maintenance"];
const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function goalColor(goal: RecipeGoal): string {
  switch (goal) {
    case "Fat Loss":    return "bg-emerald-50 text-emerald-700";
    case "Muscle Gain": return "bg-blue-50 text-blue-700";
    case "Maintenance": return "bg-amber-50 text-amber-700";
  }
}

// ── Recipe Card ───────────────────────────────────────────────────────────────

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState<null | "plan" | "shop">(null);

  async function handleAddToPlan(e: React.MouseEvent) {
    e.preventDefault(); // don't navigate — the card is wrapped in a Link
    e.stopPropagation();
    if (busy) return;
    setBusy("plan");
    const slot = defaultSlotForRecipe(recipe.mealType);
    const res = await addRecipeToMealPlan(recipe.id, { slot });
    setBusy(null);
    if (res.ok) success(`Added "${recipe.name}" to ${res.day} · ${res.slot}. See it in the Meal Planner & Calendar.`);
    else toastError(res.error || "Could not add to meal plan.");
  }

  async function handleQuickShop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy("shop");
    const res = await addRecipeIngredientsToShoppingList(recipe.ingredients);
    setBusy(null);
    if (res.ok) success(`Added ${res.addedCount} ingredient${res.addedCount === 1 ? "" : "s"} to your shopping list.`);
    else toastError(res.error || "Could not add ingredients.");
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <Link href={`/nutrition/recipes/${recipe.id}`} className="block">
        <div className="relative h-32 w-full overflow-hidden rounded-t-xl bg-zinc-100">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-8 w-8" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {recipe.mealType && (
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-golden-xs font-medium text-zinc-700 shadow-sm">
              {recipe.mealType}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-golden-3">
        {/* Top */}
        <Link href={`/nutrition/recipes/${recipe.id}`} className="block">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-golden-lg font-semibold leading-snug text-zinc-900">{recipe.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-golden-xs font-medium ${goalColor(recipe.goal)}`}>
              {recipe.goal}
            </span>
          </div>
          {recipe.description && (
            <p className="mb-3 text-golden-xs text-zinc-400 line-clamp-2">{recipe.description}</p>
          )}
          {/* Calories: key metric, but secondary to the recipe name */}
          <p className="text-golden-lg font-bold text-zinc-900">
            {recipe.calories} <span className="text-golden-sm font-normal text-zinc-400">kcal</span>
          </p>

          {/* Meta */}
          <div className="mt-3 flex gap-3 text-golden-xs text-zinc-400">
            {recipe.prepTime > 0 && <span>{recipe.prepTime} min</span>}
            <span>{recipe.servings} serving{recipe.servings > 1 ? "s" : ""}</span>
            <span>{recipe.ingredients.length} ingredients</span>
          </div>

          {/* Macros */}
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3">
            <div className="text-center">
              <p className="text-golden-sm font-bold text-blue-600">{recipe.protein}g</p>
              <p className="text-golden-xs text-zinc-400">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-golden-sm font-bold text-amber-600">{recipe.carbs}g</p>
              <p className="text-golden-xs text-zinc-400">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-golden-sm font-bold text-emerald-600">{recipe.fat}g</p>
              <p className="text-golden-xs text-zinc-400">Fat</p>
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="mt-golden-3 flex items-center gap-2">
          <Link
            href={`/nutrition/recipes/${recipe.id}`}
            className="flex-1 rounded-golden-md border border-zinc-200 bg-white px-golden-2 py-golden-1 text-center text-golden-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            View
          </Link>
          <button
            type="button"
            onClick={handleAddToPlan}
            disabled={busy !== null}
            className="flex-1 rounded-golden-md bg-zinc-900 px-golden-2 py-golden-1 text-golden-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {busy === "plan" ? "Adding…" : "+ Meal Plan"}
          </button>
          <button
            type="button"
            onClick={handleQuickShop}
            disabled={busy !== null || recipe.ingredients.length === 0}
            title="Add ingredients to shopping list"
            aria-label={`Add ${recipe.name} ingredients to shopping list`}
            className="shrink-0 rounded-golden-md border border-zinc-200 bg-white p-golden-1 text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40"
          >
            {busy === "shop" ? (
              <span className="text-golden-sm">…</span>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3a65.25 65.25 0 0 1 13.36 1.412.75.75 0 0 1 .58.875 48.6 48.6 0 0 1-1.618 6.2.75.75 0 0 1-.712.513H6.75a.75.75 0 0 0 0 1.5h9.5a.75.75 0 0 1 0 1.5H6.75a2.25 2.25 0 0 1-2.15-2.906l.44-1.435-1.35-8.11a.25.25 0 0 0-.247-.21H1.75A.75.75 0 0 1 1 1.75ZM6 17.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm9 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function RecipeSection({ title, recipes }: { title: string; recipes: Recipe[] }) {
  if (recipes.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-golden-sm font-semibold text-zinc-900">
        {title} <span className="font-normal text-zinc-400">({recipes.length})</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<"All" | RecipeGoal>("All");
  const [mealTypeFilter, setMealTypeFilter] = useState<"All" | MealType>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      const supabase = createClient();

      const { data: recipesData } = await supabase
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
          )
        `)
        .order("name");

      if (recipesData) {
        setAllRecipes(recipesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || "",
          goal: (r.goal || "Maintenance") as RecipeGoal,
          mealType: (r.meal_type || null) as MealType | null,
          imageUrl: r.image_url || null,
          servings: r.servings || 1,
          prepTime: r.prep_time || 0,
          calories: r.calories || 0,
          protein: r.protein || 0,
          carbs: r.carbs || 0,
          fat: r.fat || 0,
          ingredients: (r.recipe_ingredients || []).map((ing: any) => ({
            id: ing.id,
            name: ing.name,
            quantity: ing.quantity || 0,
            unit: ing.unit || "",
          })),
        })));
      }

      setLoading(false);
    }
    loadRecipes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRecipes.filter((r) => {
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchesGoal = goalFilter === "All" || r.goal === goalFilter;
      const matchesMealType = mealTypeFilter === "All" || r.mealType === mealTypeFilter;
      return matchesSearch && matchesGoal && matchesMealType;
    });
  }, [allRecipes, search, goalFilter, mealTypeFilter]);

  // Grouped view: group by GOAL. Each recipe appears in exactly one section
  // (no "Featured" duplicate). Only shown when no filters/search are active.
  const showGrouped = goalFilter === "All" && mealTypeFilter === "All" && !search.trim();
  const byGoal = useMemo(() => {
    const groups: Record<RecipeGoal, Recipe[]> = {
      "Muscle Gain": [],
      "Fat Loss": [],
      "Maintenance": [],
    };
    for (const r of filtered) groups[r.goal].push(r);
    return groups;
  }, [filtered]);

  if (loading) {
    return <PageLoader text="Loading recipes..." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recipes</h1>
        <p className="mt-1 text-golden-sm text-zinc-500">
          {allRecipes.length} recipe{allRecipes.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input
              type="search"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search recipes"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-golden-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
          <div className="flex gap-2">
            {(["All", ...RECIPE_GOALS] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoalFilter(g)}
                aria-pressed={goalFilter === g}
                className={[
                  "rounded-lg border px-3 py-1.5 text-golden-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                  goalFilter === g
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
                ].join(" ")}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Meal-type filter (Breakfast / Lunch / Dinner / Snack) */}
        <div className="flex flex-wrap gap-2">
          {(["All", ...MEAL_TYPES] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMealTypeFilter(m)}
              aria-pressed={mealTypeFilter === m}
              className={[
                "rounded-full border px-3 py-1 text-golden-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                mealTypeFilter === m
                  ? "border-zinc-700 bg-zinc-100 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400",
              ].join(" ")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {allRecipes.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No recipes yet"
          description="Recipes will appear here once created by an admin."
        />
      ) : showGrouped ? (
        <div className="flex flex-col gap-8">
          <RecipeSection title="Muscle Gain" recipes={byGoal["Muscle Gain"]} />
          <RecipeSection title="Fat Loss" recipes={byGoal["Fat Loss"]} />
          <RecipeSection title="Maintenance" recipes={byGoal["Maintenance"]} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="text-golden-sm text-zinc-400">No recipes match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}
