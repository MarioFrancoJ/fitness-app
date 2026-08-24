"use client";

import { useState } from "react";
import { foods, type Food } from "@/data/foods";

// ── Storage helpers (same format as /nutrition/log) ────────────────────────────

const LOG_KEY = "fitnessapp_food_log";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function addToLog(food: Food) {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    const all: Record<string, unknown[]> = stored ? JSON.parse(stored) : {};
    const today = (all[todayKey()] as unknown[]) || [];

    const entry = {
      id: Date.now().toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    all[todayKey()] = [...today, entry];
    localStorage.setItem(LOG_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FoodsPage() {
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<string | null>(null);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(food: Food) {
    addToLog(food);
    setAddedId(food.id);
    setTimeout(() => setAddedId(null), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Foods</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {filtered.length} food{filtered.length !== 1 ? "s" : ""} in database
        </p>
      </div>

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
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search foods"
          className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* Food cards */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="text-sm text-zinc-400">No foods match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((food) => (
            <div
              key={food.id}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">{food.name}</h3>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                  {food.serving}
                </span>
              </div>

              <p className="mb-4 text-2xl font-bold text-zinc-900">
                {food.calories}{" "}
                <span className="text-sm font-normal text-zinc-400">kcal</span>
              </p>

              <div className="mb-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600">{food.protein}g</p>
                  <p className="text-xs text-zinc-400">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-amber-600">{food.carbs}g</p>
                  <p className="text-xs text-zinc-400">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-600">{food.fat}g</p>
                  <p className="text-xs text-zinc-400">Fat</p>
                </div>
              </div>

              {/* Add to log button */}
              <button
                type="button"
                onClick={() => handleAdd(food)}
                className={[
                  "mt-auto w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                  addedId === food.id
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50",
                ].join(" ")}
              >
                {addedId === food.id ? "✓ Added to Daily Log" : "+ Add to Daily Log"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
