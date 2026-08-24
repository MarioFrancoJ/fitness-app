"use client";

import { useState } from "react";
import Link from "next/link";
import { recipes, type RecipeGoal } from "@/data/recipes";

const GOALS: ("All" | RecipeGoal)[] = ["All", "Fat Loss", "Muscle Gain", "Maintenance"];

function goalColor(goal: RecipeGoal) {
  switch (goal) {
    case "Fat Loss":    return "bg-emerald-50 text-emerald-700";
    case "Muscle Gain": return "bg-blue-50 text-blue-700";
    case "Maintenance": return "bg-amber-50 text-amber-700";
  }
}

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<"All" | RecipeGoal>("All");

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesGoal = goalFilter === "All" || r.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recipes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {filtered.length} recipe{filtered.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-64">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
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

        {/* Goal filter pills */}
        <div className="flex gap-2">
          {GOALS.map((g) => (
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

      {/* Recipe cards grid */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="text-sm text-zinc-400">No recipes match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/nutrition/recipes/${recipe.id}`}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Top */}
              <div className="mb-4">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {recipe.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${goalColor(recipe.goal)}`}
                  >
                    {recipe.goal}
                  </span>
                </div>
                <p className="text-2xl font-bold text-zinc-900">
                  {recipe.calories}{" "}
                  <span className="text-sm font-normal text-zinc-400">kcal</span>
                </p>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-4">
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
          ))}
        </div>
      )}
    </div>
  );
}
