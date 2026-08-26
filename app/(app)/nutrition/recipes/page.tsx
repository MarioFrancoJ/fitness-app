"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecipeGoal = "Fat Loss" | "Muscle Gain" | "Maintenance";

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
  ingredients: RecipeIngredient[];
  servings: number;
  instructions: string[];
  prepTime: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const RECIPE_GOALS: RecipeGoal[] = ["Fat Loss", "Muscle Gain", "Maintenance"];

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
  return (
    <Link
      href={`/nutrition/recipes/${recipe.id}`}
      className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Top */}
      <div className="mb-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">{recipe.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${goalColor(recipe.goal)}`}>
            {recipe.goal}
          </span>
        </div>
        {recipe.description && (
          <p className="mb-3 text-xs text-zinc-400 line-clamp-2">{recipe.description}</p>
        )}
        <p className="text-2xl font-bold text-zinc-900">
          {recipe.calories} <span className="text-sm font-normal text-zinc-400">kcal</span>
        </p>
      </div>

      {/* Meta */}
      <div className="mb-3 flex gap-3 text-xs text-zinc-400">
        {recipe.prepTime > 0 && <span>{recipe.prepTime} min</span>}
        <span>{recipe.servings} serving{recipe.servings > 1 ? "s" : ""}</span>
        <span>{recipe.ingredients.length} ingredients</span>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3">
        <div className="text-center">
          <p className="text-sm font-bold text-blue-600">{recipe.protein}g</p>
          <p className="text-xs text-zinc-400">Protein</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-amber-600">{recipe.carbs}g</p>
          <p className="text-xs text-zinc-400">Carbs</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-600">{recipe.fat}g</p>
          <p className="text-xs text-zinc-400">Fat</p>
        </div>
      </div>
    </Link>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function RecipeSection({ title, recipes }: { title: string; recipes: Recipe[] }) {
  if (recipes.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h2>
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
        .order("name");

      if (recipesData) {
        setAllRecipes(recipesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || "",
          goal: (r.goal || "Maintenance") as RecipeGoal,
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
          instructions: (r.recipe_instructions || [])
            .sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0))
            .map((inst: any) => inst.instruction),
        })));
      }

      setLoading(false);
    }
    loadRecipes();
  }, []);

  const filtered = useMemo(() => {
    return allRecipes.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase());
      const matchesGoal = goalFilter === "All" || r.goal === goalFilter;
      return matchesSearch && matchesGoal;
    });
  }, [allRecipes, search, goalFilter]);

  // Group by goal for the browse view
  const featured = useMemo(() => allRecipes.slice(0, 3), [allRecipes]);
  const muscleGain = useMemo(() => filtered.filter((r) => r.goal === "Muscle Gain"), [filtered]);
  const fatLoss = useMemo(() => filtered.filter((r) => r.goal === "Fat Loss"), [filtered]);
  const maintenance = useMemo(() => filtered.filter((r) => r.goal === "Maintenance"), [filtered]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-400">Loading recipes...</p>
        </div>
      </div>
    );
  }

  const showGrouped = goalFilter === "All" && !search;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recipes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {allRecipes.length} recipe{allRecipes.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filters */}
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
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
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
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
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

      {/* Content */}
      {allRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
          <p className="mb-1 text-base font-semibold text-zinc-900">No recipes yet</p>
          <p className="mb-6 text-sm text-zinc-500">Recipes will appear here once created.</p>
        </div>
      ) : showGrouped ? (
        <div className="flex flex-col gap-8">
          {/* Featured */}
          <RecipeSection title="Featured Recipes" recipes={featured} />
          <RecipeSection title="Muscle Gain" recipes={muscleGain} />
          <RecipeSection title="Fat Loss" recipes={fatLoss} />
          <RecipeSection title="Maintenance" recipes={maintenance} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="text-sm text-zinc-400">No recipes match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}
