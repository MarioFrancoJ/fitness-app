"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { recipes } from "@/data/recipes";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitnessapp_shopping_list";
const MEAL_PLAN_KEY = "fitnessapp_meal_plan";

function loadList(): ShoppingItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveList(items: ShoppingItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── Meal Plan ingredient aggregation ──────────────────────────────────────────

function generateFromMealPlan(): ShoppingItem[] {
  try {
    const stored = localStorage.getItem(MEAL_PLAN_KEY);
    if (!stored) return [];

    const plan: Record<string, Record<string, string | null>> = JSON.parse(stored);

    // Collect all recipe IDs assigned in the meal plan
    const recipeIds = new Set<string>();
    for (const day of Object.values(plan)) {
      for (const id of Object.values(day)) {
        if (id) recipeIds.add(id);
      }
    }

    // Count how many times each recipe appears (for quantity)
    const recipeCounts: Record<string, number> = {};
    for (const day of Object.values(plan)) {
      for (const id of Object.values(day)) {
        if (id) recipeCounts[id] = (recipeCounts[id] || 0) + 1;
      }
    }

    // Aggregate ingredients across all recipes
    const ingredientMap: Record<string, number> = {};

    for (const id of recipeIds) {
      const recipe = recipes.find((r) => r.id === id);
      if (!recipe) continue;

      const count = recipeCounts[id] || 1;

      for (const ingredient of recipe.ingredients) {
        if (ingredientMap[ingredient]) {
          ingredientMap[ingredient] += count;
        } else {
          ingredientMap[ingredient] = count;
        }
      }
    }

    // Convert to ShoppingItem format
    return Object.entries(ingredientMap).map(([name, count]) => ({
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      quantity: count > 1 ? `×${count}` : "×1",
    }));
  } catch {
    return [];
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    setItems(loadList());
  }, []);

  function handleAdd(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Ingredient name is required.");
      return;
    }

    setError("");

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: name.trim(),
      quantity: quantity.trim() || "—",
    };

    const updated = [...items, newItem];
    setItems(updated);
    saveList(updated);
    setName("");
    setQuantity("");
  }

  function handleRemove(id: string) {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveList(updated);
  }

  function handleClearAll() {
    setItems([]);
    saveList([]);
  }

  function handleGenerate() {
    const generated = generateFromMealPlan();
    if (generated.length === 0) return;

    const updated = [...items, ...generated];
    setItems(updated);
    saveList(updated);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Shopping List
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {items.length} item{items.length !== 1 ? "s" : ""} on your list
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleGenerate}>
            Generate from Meal Plan
          </Button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {generated && (
        <p className="text-sm font-medium text-emerald-600">
          ✓ Ingredients added from your meal plan.
        </p>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-700">Add Ingredient</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Input
              id="ingredient-name"
              type="text"
              label="Ingredient"
              placeholder="e.g. Chicken breast"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              error={error}
            />
          </div>
          <div className="w-36">
            <Input
              id="ingredient-qty"
              type="text"
              label="Quantity"
              placeholder="e.g. 500g"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <Button type="submit">Add</Button>
        </div>
      </form>

      {/* List */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-700">Items</p>
        </div>

        {items.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">
              Your shopping list is empty. Add items manually or generate from your meal plan.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-300" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-400">{item.quantity}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
