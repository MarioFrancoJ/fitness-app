import { recipes as seedRecipes, type Recipe } from "@/data/recipes";

const STORAGE_KEY = "fitnessapp_recipes";

export function loadRecipes(): Recipe[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    // Seed on first load
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecipes));
    return seedRecipes;
  } catch {
    return seedRecipes;
  }
}

export function saveRecipes(recipes: Recipe[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function addRecipe(recipe: Omit<Recipe, "id">): Recipe {
  const all = loadRecipes();
  const newItem: Recipe = { ...recipe, id: Date.now().toString() };
  saveRecipes([newItem, ...all]);
  return newItem;
}

export function updateRecipe(id: string, data: Partial<Recipe>) {
  const all = loadRecipes();
  const updated = all.map((r) => (r.id === id ? { ...r, ...data } : r));
  saveRecipes(updated);
}

export function deleteRecipe(id: string) {
  const all = loadRecipes();
  saveRecipes(all.filter((r) => r.id !== id));
}

export function getRecipeById(id: string): Recipe | undefined {
  const all = loadRecipes();
  return all.find((r) => r.id === id);
}
