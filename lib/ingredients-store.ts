import { seedIngredients, type Ingredient } from "@/data/ingredients-seed";

const STORAGE_KEY = "fitnessapp_ingredients";

export function loadIngredients(): Ingredient[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    // Seed on first load
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedIngredients));
    return seedIngredients;
  } catch {
    return seedIngredients;
  }
}

export function saveIngredients(ingredients: Ingredient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
}

export function addIngredient(ingredient: Omit<Ingredient, "id">): Ingredient {
  const all = loadIngredients();
  const newItem: Ingredient = { ...ingredient, id: Date.now().toString() };
  saveIngredients([newItem, ...all]);
  return newItem;
}

export function updateIngredient(id: string, data: Partial<Ingredient>) {
  const all = loadIngredients();
  const updated = all.map((i) => (i.id === id ? { ...i, ...data } : i));
  saveIngredients(updated);
}

export function deleteIngredient(id: string) {
  const all = loadIngredients();
  saveIngredients(all.filter((i) => i.id !== id));
}
