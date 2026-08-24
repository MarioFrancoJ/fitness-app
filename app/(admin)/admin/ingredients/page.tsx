"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loadIngredients, addIngredient, updateIngredient, deleteIngredient } from "@/lib/ingredients-store";
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from "@/data/ingredients-seed";

export default function AdminIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | IngredientCategory>("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState<IngredientCategory>("Protein");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setIngredients(loadIngredients());
  }, []);

  function refresh() {
    setIngredients(loadIngredients());
  }

  const filtered = ingredients.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function resetForm() {
    setName(""); setCategory("Protein"); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setFormError(""); setEditId(null); setShowForm(false);
  }

  function handleEdit(ingredient: Ingredient) {
    setName(ingredient.name);
    setCategory(ingredient.category);
    setCalories(ingredient.caloriesPer100g.toString());
    setProtein(ingredient.proteinPer100g.toString());
    setCarbs(ingredient.carbsPer100g.toString());
    setFat(ingredient.fatPer100g.toString());
    setEditId(ingredient.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    deleteIngredient(id);
    refresh();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Name is required."); return; }
    if (!calories.trim()) { setFormError("Calories is required."); return; }

    const data = {
      name: name.trim(),
      category,
      caloriesPer100g: parseFloat(calories) || 0,
      proteinPer100g: parseFloat(protein) || 0,
      carbsPer100g: parseFloat(carbs) || 0,
      fatPer100g: parseFloat(fat) || 0,
    };

    if (editId) {
      updateIngredient(editId, data);
    } else {
      addIngredient(data);
    }

    resetForm();
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Ingredients</h1>
          <p className="mt-1 text-sm text-zinc-500">{filtered.length} ingredient{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button type="button" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Ingredient
        </Button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">
            {editId ? "Edit Ingredient" : "New Ingredient"}
          </p>
          {formError && <p className="mb-3 text-xs text-red-500" role="alert">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input id="ing-name" type="text" label="Name" value={name} onChange={(e) => { setName(e.target.value); setFormError(""); }} placeholder="e.g. Chicken Breast" />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ing-cat" className="text-sm font-medium text-zinc-700">Category</label>
              <select id="ing-cat" value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input id="ing-cal" type="number" label="Calories /100g" value={calories} onChange={(e) => { setCalories(e.target.value); setFormError(""); }} placeholder="165" min={0} />
            <Input id="ing-pro" type="number" label="Protein /100g" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="31" min={0} step={0.1} />
            <Input id="ing-carb" type="number" label="Carbs /100g" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" min={0} step={0.1} />
            <Input id="ing-fat" type="number" label="Fat /100g" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="3.6" min={0} step={0.1} />
          </div>
          <div className="mt-5 flex gap-3">
            <Button type="submit">{editId ? "Save Changes" : "Create"}</Button>
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
          <input type="search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search ingredients"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as "All" | IngredientCategory)} aria-label="Filter by category"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
          <option value="All">All Categories</option>
          {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
                  <th className="px-5 py-3 font-semibold text-zinc-700">Cal</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Protein</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Carbs</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Fat</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Actions</th>
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
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(i)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Edit</button>
                        <button type="button" onClick={() => handleDelete(i.id)} className="text-xs font-medium text-zinc-500 hover:text-red-600">Delete</button>
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
