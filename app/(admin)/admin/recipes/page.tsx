"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loadRecipes, addRecipe, updateRecipe, deleteRecipe } from "@/lib/recipes-store";
import { loadIngredients } from "@/lib/ingredients-store";
import { RECIPE_GOALS, type Recipe, type RecipeGoal, type RecipeIngredient } from "@/data/recipes";
import type { Ingredient } from "@/data/ingredients-seed";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<"All" | RecipeGoal>("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState<RecipeGoal>("Maintenance");
  const [servings, setServings] = useState("1");
  const [prepTime, setPrepTime] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [formError, setFormError] = useState("");

  // Ingredient add fields
  const [addIngId, setAddIngId] = useState("");
  const [addIngQty, setAddIngQty] = useState("");

  useEffect(() => {
    setRecipes(loadRecipes());
    setIngredients(loadIngredients());
  }, []);

  function refresh() {
    setRecipes(loadRecipes());
  }

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesGoal = goalFilter === "All" || r.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  // ── Form helpers ───────────────────────────────────────────────────────────

  function resetForm() {
    setName(""); setDescription(""); setGoal("Maintenance"); setServings("1");
    setPrepTime(""); setInstructionsText(""); setRecipeIngredients([]);
    setFormError(""); setEditId(null); setShowForm(false);
    setAddIngId(""); setAddIngQty("");
  }

  function handleEdit(recipe: Recipe) {
    setName(recipe.name);
    setDescription(recipe.description);
    setGoal(recipe.goal);
    setServings(recipe.servings.toString());
    setPrepTime(recipe.prepTime.toString());
    setInstructionsText(recipe.instructions.join("\n"));
    setRecipeIngredients([...recipe.ingredients]);
    setEditId(recipe.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    deleteRecipe(id);
    refresh();
  }

  function handleAddIngredient() {
    if (!addIngId || !addIngQty) return;
    const ing = ingredients.find((i) => i.id === addIngId);
    if (!ing) return;
    // Prevent duplicates
    if (recipeIngredients.some((ri) => ri.ingredientId === addIngId)) return;
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredientId: ing.id, name: ing.name, quantity: parseFloat(addIngQty) || 0, unit: ing.unit || "g" },
    ]);
    setAddIngId("");
    setAddIngQty("");
  }

  function handleRemoveIngredient(ingredientId: string) {
    setRecipeIngredients(recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId));
  }

  // ── Nutrition calculation ──────────────────────────────────────────────────

  function calculateNutrition(ings: RecipeIngredient[]): { calories: number; protein: number; carbs: number; fat: number } {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const ri of ings) {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      if (!ing) continue;
      const factor = ri.quantity / 100;
      calories += Math.round(ing.caloriesPer100g * factor);
      protein += Math.round(ing.proteinPer100g * factor * 10) / 10;
      carbs += Math.round(ing.carbsPer100g * factor * 10) / 10;
      fat += Math.round(ing.fatPer100g * factor * 10) / 10;
    }
    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Name is required."); return; }
    if (recipeIngredients.length === 0) { setFormError("Add at least one ingredient."); return; }

    const nutrition = calculateNutrition(recipeIngredients);
    const instructions = instructionsText.split("\n").filter((l) => l.trim());

    const data: Omit<Recipe, "id"> = {
      name: name.trim(),
      description: description.trim(),
      goal,
      ingredients: recipeIngredients,
      servings: parseInt(servings) || 1,
      instructions,
      prepTime: parseInt(prepTime) || 0,
      image: null,
      ...nutrition,
    };

    if (editId) {
      updateRecipe(editId, { ...data, id: editId });
    } else {
      addRecipe(data);
    }

    resetForm();
    refresh();
  }

  // ── Computed nutrition for form preview ────────────────────────────────────

  const previewNutrition = calculateNutrition(recipeIngredients);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recipes</h1>
          <p className="mt-1 text-sm text-zinc-500">{filtered.length} recipe{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button type="button" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Recipe
        </Button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">
            {editId ? "Edit Recipe" : "New Recipe"}
          </p>
          {formError && <p className="mb-3 text-xs text-red-500" role="alert">{formError}</p>}

          {/* Basic fields */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input id="rec-name" type="text" label="Name" value={name} onChange={(e) => { setName(e.target.value); setFormError(""); }} placeholder="e.g. Chicken Rice Bowl" />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rec-goal" className="text-sm font-medium text-zinc-700">Goal</label>
              <select id="rec-goal" value={goal} onChange={(e) => setGoal(e.target.value as RecipeGoal)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {RECIPE_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Input id="rec-servings" type="number" label="Servings" value={servings} onChange={(e) => setServings(e.target.value)} placeholder="1" min={1} />
            <Input id="rec-prep" type="number" label="Prep Time (min)" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="20" min={0} />
            <div className="sm:col-span-2">
              <Input id="rec-desc" type="text" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the recipe" />
            </div>
          </div>

          {/* Ingredients section */}
          <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Ingredients</p>

            {/* Add ingredient row */}
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label htmlFor="add-ing" className="text-xs text-zinc-500">Ingredient</label>
                <select id="add-ing" value={addIngId} onChange={(e) => setAddIngId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  <option value="">Select ingredient…</option>
                  {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-24">
                <label htmlFor="add-qty" className="text-xs text-zinc-500">Quantity</label>
                <input id="add-qty" type="number" value={addIngQty} onChange={(e) => setAddIngQty(e.target.value)} placeholder="100" min={0} step={1}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
              </div>
              <button type="button" onClick={handleAddIngredient}
                className="h-9 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
                Add
              </button>
            </div>

            {/* Listed ingredients */}
            {recipeIngredients.length === 0 ? (
              <p className="text-xs text-zinc-400">No ingredients added yet.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {recipeIngredients.map((ri) => (
                  <div key={ri.ingredientId} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                    <span className="text-zinc-700">{ri.name} — <strong>{ri.quantity}</strong> {ri.unit}</span>
                    <button type="button" onClick={() => handleRemoveIngredient(ri.ingredientId)}
                      className="text-xs text-zinc-400 hover:text-red-600 focus-visible:outline-none">Remove</button>
                  </div>
                ))}
              </div>
            )}

            {/* Auto-calculated nutrition */}
            {recipeIngredients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-4 border-t border-zinc-200 pt-3 text-xs">
                <span className="text-zinc-600"><strong className="text-zinc-900">{previewNutrition.calories}</strong> kcal</span>
                <span className="text-zinc-600"><strong className="text-blue-600">{previewNutrition.protein}g</strong> protein</span>
                <span className="text-zinc-600"><strong className="text-amber-600">{previewNutrition.carbs}g</strong> carbs</span>
                <span className="text-zinc-600"><strong className="text-emerald-600">{previewNutrition.fat}g</strong> fat</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="rec-instructions" className="text-sm font-medium text-zinc-700">Instructions (one per line)</label>
            <textarea id="rec-instructions" value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)}
              rows={4} placeholder={"Season chicken with salt and pepper.\nGrill for 6 minutes per side.\nServe over rice."}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
          </div>

          <div className="mt-5 flex gap-3">
            <Button type="submit">{editId ? "Save Changes" : "Create Recipe"}</Button>
            <button type="button" onClick={resetForm} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input type="search" placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search recipes"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
        <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value as "All" | RecipeGoal)} aria-label="Filter by goal"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
          <option value="All">All Goals</option>
          {RECIPE_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-zinc-400">No recipes found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Name</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Goal</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Cal</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Protein</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Carbs</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Fat</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Servings</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Prep</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{r.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.goal === "Fat Loss" ? "bg-emerald-50 text-emerald-700" :
                        r.goal === "Muscle Gain" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>{r.goal}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{r.calories}</td>
                    <td className="px-5 py-3 text-zinc-600">{r.protein}g</td>
                    <td className="px-5 py-3 text-zinc-600">{r.carbs}g</td>
                    <td className="px-5 py-3 text-zinc-600">{r.fat}g</td>
                    <td className="px-5 py-3 text-zinc-600">{r.servings}</td>
                    <td className="px-5 py-3 text-zinc-600">{r.prepTime}m</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(r)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Edit</button>
                        <button type="button" onClick={() => handleDelete(r.id)} className="text-xs font-medium text-zinc-500 hover:text-red-600">Delete</button>
                      </div>
                    </td>
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
