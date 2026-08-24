export type IngredientCategory = "Protein" | "Carbohydrate" | "Fat" | "Vegetable" | "Fruit" | "Dairy" | "Beverage" | "Other";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "Protein", "Carbohydrate", "Fat", "Vegetable", "Fruit", "Dairy", "Beverage", "Other",
];

export const seedIngredients: Ingredient[] = [
  { id: "1",  name: "Chicken Breast",    category: "Protein",      caloriesPer100g: 165, proteinPer100g: 31,   carbsPer100g: 0,    fatPer100g: 3.6 },
  { id: "2",  name: "Egg",               category: "Protein",      caloriesPer100g: 155, proteinPer100g: 13,   carbsPer100g: 1.1,  fatPer100g: 11 },
  { id: "3",  name: "Salmon",            category: "Protein",      caloriesPer100g: 208, proteinPer100g: 20,   carbsPer100g: 0,    fatPer100g: 13 },
  { id: "4",  name: "Ground Beef (lean)",category: "Protein",      caloriesPer100g: 250, proteinPer100g: 26,   carbsPer100g: 0,    fatPer100g: 15 },
  { id: "5",  name: "Tuna (canned)",     category: "Protein",      caloriesPer100g: 116, proteinPer100g: 26,   carbsPer100g: 0,    fatPer100g: 1 },
  { id: "6",  name: "Shrimp",            category: "Protein",      caloriesPer100g: 99,  proteinPer100g: 24,   carbsPer100g: 0.2,  fatPer100g: 0.3 },
  { id: "7",  name: "White Rice",        category: "Carbohydrate", caloriesPer100g: 130, proteinPer100g: 2.7,  carbsPer100g: 28,   fatPer100g: 0.3 },
  { id: "8",  name: "Oats",              category: "Carbohydrate", caloriesPer100g: 389, proteinPer100g: 17,   carbsPer100g: 66,   fatPer100g: 7 },
  { id: "9",  name: "Potato",            category: "Carbohydrate", caloriesPer100g: 77,  proteinPer100g: 2,    carbsPer100g: 17,   fatPer100g: 0.1 },
  { id: "10", name: "Sweet Potato",      category: "Carbohydrate", caloriesPer100g: 86,  proteinPer100g: 1.6,  carbsPer100g: 20,   fatPer100g: 0.1 },
  { id: "11", name: "Whole Wheat Bread", category: "Carbohydrate", caloriesPer100g: 247, proteinPer100g: 13,   carbsPer100g: 41,   fatPer100g: 3.4 },
  { id: "12", name: "Quinoa",            category: "Carbohydrate", caloriesPer100g: 120, proteinPer100g: 4.4,  carbsPer100g: 21,   fatPer100g: 1.9 },
  { id: "13", name: "Olive Oil",         category: "Fat",          caloriesPer100g: 884, proteinPer100g: 0,    carbsPer100g: 0,    fatPer100g: 100 },
  { id: "14", name: "Avocado",           category: "Fat",          caloriesPer100g: 160, proteinPer100g: 2,    carbsPer100g: 8.5,  fatPer100g: 14.7 },
  { id: "15", name: "Almonds",           category: "Fat",          caloriesPer100g: 579, proteinPer100g: 21,   carbsPer100g: 22,   fatPer100g: 50 },
  { id: "16", name: "Peanut Butter",     category: "Fat",          caloriesPer100g: 588, proteinPer100g: 25,   carbsPer100g: 20,   fatPer100g: 50 },
  { id: "17", name: "Broccoli",          category: "Vegetable",    caloriesPer100g: 34,  proteinPer100g: 2.8,  carbsPer100g: 7,    fatPer100g: 0.4 },
  { id: "18", name: "Spinach",           category: "Vegetable",    caloriesPer100g: 23,  proteinPer100g: 2.9,  carbsPer100g: 3.6,  fatPer100g: 0.4 },
  { id: "19", name: "Bell Pepper",       category: "Vegetable",    caloriesPer100g: 31,  proteinPer100g: 1,    carbsPer100g: 6,    fatPer100g: 0.3 },
  { id: "20", name: "Tomato",            category: "Vegetable",    caloriesPer100g: 18,  proteinPer100g: 0.9,  carbsPer100g: 3.9,  fatPer100g: 0.2 },
  { id: "21", name: "Banana",            category: "Fruit",        caloriesPer100g: 89,  proteinPer100g: 1.1,  carbsPer100g: 23,   fatPer100g: 0.3 },
  { id: "22", name: "Apple",             category: "Fruit",        caloriesPer100g: 52,  proteinPer100g: 0.3,  carbsPer100g: 14,   fatPer100g: 0.2 },
  { id: "23", name: "Blueberries",       category: "Fruit",        caloriesPer100g: 57,  proteinPer100g: 0.7,  carbsPer100g: 14,   fatPer100g: 0.3 },
  { id: "24", name: "Orange",            category: "Fruit",        caloriesPer100g: 47,  proteinPer100g: 0.9,  carbsPer100g: 12,   fatPer100g: 0.1 },
  { id: "25", name: "Greek Yogurt",      category: "Dairy",        caloriesPer100g: 59,  proteinPer100g: 10,   carbsPer100g: 3.6,  fatPer100g: 0.7 },
  { id: "26", name: "Milk (whole)",      category: "Dairy",        caloriesPer100g: 61,  proteinPer100g: 3.2,  carbsPer100g: 4.8,  fatPer100g: 3.3 },
  { id: "27", name: "Cottage Cheese",    category: "Dairy",        caloriesPer100g: 98,  proteinPer100g: 11,   carbsPer100g: 3.4,  fatPer100g: 4.3 },
  { id: "28", name: "Whey Protein",      category: "Other",        caloriesPer100g: 400, proteinPer100g: 80,   carbsPer100g: 10,   fatPer100g: 5 },
  { id: "29", name: "Honey",             category: "Other",        caloriesPer100g: 304, proteinPer100g: 0.3,  carbsPer100g: 82,   fatPer100g: 0 },
  { id: "30", name: "Green Tea",         category: "Beverage",     caloriesPer100g: 1,   proteinPer100g: 0,    carbsPer100g: 0.2,  fatPer100g: 0 },
];
