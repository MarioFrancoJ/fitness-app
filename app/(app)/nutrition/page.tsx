"use client";

import { useState, useEffect } from "react";
import { loadIngredients } from "@/lib/ingredients-store";
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from "@/data/ingredients-seed";

export default function NutritionPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | IngredientCategory>("All");

  useEffect(() => {
    setIngredients(loadIngredients());
  }, []);

  const filtered = ingredients.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Category summary
  const categorySummary = INGREDIENT_CATEGORIES.map((cat) => ({
    category: cat,
    count: ingredients.filter((i) => i.category === cat).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Nutrition Database</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {ingredients.length} ingredients available
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Total Ingredients</p>
          <p className="text-2xl font-bold text-zinc-900">{ingredients.length}</p>
        </div>
        {categorySummary.slice(0, 3).map((c) => (
          <div key={c.category} className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-zinc-400">{c.category}</p>
            <p className="text-2xl font-bold text-zinc-900">{c.count}</p>
          </div>
        ))}
      </div>

      {/* Category summary pills */}
      <div className="flex flex-wrap gap-2">
        {categorySummary.map((c) => (
          <button
            key={c.category}
            type="button"
            onClick={() => setCategoryFilter(c.category)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === c.category
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {c.category} ({c.count})
          </button>
        ))}
        {categoryFilter !== "All" && (
          <button
            type="button"
            onClick={() => setCategoryFilter("All")}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500 hover:border-zinc-400"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-64">
        <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          type="search"
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search ingredients"
          className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-zinc-400">No ingredients found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Name</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Category</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Calories</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Protein</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Carbs</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Fat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{i.name}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{i.category}</span></td>
                    <td className="px-5 py-3 text-zinc-600">{i.caloriesPer100g}</td>
                    <td className="px-5 py-3 text-zinc-600">{i.proteinPer100g}g</td>
                    <td className="px-5 py-3 text-zinc-600">{i.carbsPer100g}g</td>
                    <td className="px-5 py-3 text-zinc-600">{i.fatPer100g}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
