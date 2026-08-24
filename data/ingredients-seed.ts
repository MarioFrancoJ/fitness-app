export type IngredientCategory = "Protein" | "Carbohydrate" | "Fat" | "Vegetable" | "Fruit" | "Dairy" | "Beverage" | "Other";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  unit: string;
}

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "Protein", "Carbohydrate", "Fat", "Vegetable", "Fruit", "Dairy", "Beverage", "Other",
];

export const seedIngredients: Ingredient[] = [
  // Protein (10)
  { id: "1",  name: "Chicken Breast",     category: "Protein",      caloriesPer100g: 165, proteinPer100g: 31,   carbsPer100g: 0,    fatPer100g: 3.6,  unit: "g" },
  { id: "2",  name: "Egg",                category: "Protein",      caloriesPer100g: 155, proteinPer100g: 13,   carbsPer100g: 1.1,  fatPer100g: 11,   unit: "unit" },
  { id: "3",  name: "Salmon",             category: "Protein",      caloriesPer100g: 208, proteinPer100g: 20,   carbsPer100g: 0,    fatPer100g: 13,   unit: "g" },
  { id: "4",  name: "Ground Beef (lean)", category: "Protein",      caloriesPer100g: 250, proteinPer100g: 26,   carbsPer100g: 0,    fatPer100g: 15,   unit: "g" },
  { id: "5",  name: "Tuna (canned)",      category: "Protein",      caloriesPer100g: 116, proteinPer100g: 26,   carbsPer100g: 0,    fatPer100g: 1,    unit: "g" },
  { id: "6",  name: "Shrimp",             category: "Protein",      caloriesPer100g: 99,  proteinPer100g: 24,   carbsPer100g: 0.2,  fatPer100g: 0.3,  unit: "g" },
  { id: "7",  name: "Turkey Breast",      category: "Protein",      caloriesPer100g: 135, proteinPer100g: 30,   carbsPer100g: 0,    fatPer100g: 1,    unit: "g" },
  { id: "8",  name: "Tofu",               category: "Protein",      caloriesPer100g: 76,  proteinPer100g: 8,    carbsPer100g: 1.9,  fatPer100g: 4.8,  unit: "g" },
  { id: "9",  name: "Cod",                category: "Protein",      caloriesPer100g: 82,  proteinPer100g: 18,   carbsPer100g: 0,    fatPer100g: 0.7,  unit: "g" },
  { id: "10", name: "Chicken Thigh",      category: "Protein",      caloriesPer100g: 209, proteinPer100g: 26,   carbsPer100g: 0,    fatPer100g: 11,   unit: "g" },

  // Carbohydrate (10)
  { id: "11", name: "White Rice",          category: "Carbohydrate", caloriesPer100g: 130, proteinPer100g: 2.7,  carbsPer100g: 28,   fatPer100g: 0.3,  unit: "g" },
  { id: "12", name: "Brown Rice",          category: "Carbohydrate", caloriesPer100g: 123, proteinPer100g: 2.6,  carbsPer100g: 26,   fatPer100g: 1,    unit: "g" },
  { id: "13", name: "Oats",               category: "Carbohydrate", caloriesPer100g: 389, proteinPer100g: 17,   carbsPer100g: 66,   fatPer100g: 7,    unit: "g" },
  { id: "14", name: "Potato",             category: "Carbohydrate", caloriesPer100g: 77,  proteinPer100g: 2,    carbsPer100g: 17,   fatPer100g: 0.1,  unit: "g" },
  { id: "15", name: "Sweet Potato",       category: "Carbohydrate", caloriesPer100g: 86,  proteinPer100g: 1.6,  carbsPer100g: 20,   fatPer100g: 0.1,  unit: "g" },
  { id: "16", name: "Whole Wheat Bread",  category: "Carbohydrate", caloriesPer100g: 247, proteinPer100g: 13,   carbsPer100g: 41,   fatPer100g: 3.4,  unit: "slice" },
  { id: "17", name: "Quinoa",             category: "Carbohydrate", caloriesPer100g: 120, proteinPer100g: 4.4,  carbsPer100g: 21,   fatPer100g: 1.9,  unit: "g" },
  { id: "18", name: "Pasta",              category: "Carbohydrate", caloriesPer100g: 131, proteinPer100g: 5,    carbsPer100g: 25,   fatPer100g: 1.1,  unit: "g" },
  { id: "19", name: "Black Beans",        category: "Carbohydrate", caloriesPer100g: 132, proteinPer100g: 8.9,  carbsPer100g: 23.7, fatPer100g: 0.5,  unit: "g" },
  { id: "20", name: "Lentils",            category: "Carbohydrate", caloriesPer100g: 116, proteinPer100g: 9,    carbsPer100g: 20,   fatPer100g: 0.4,  unit: "g" },

  // Fat (8)
  { id: "21", name: "Olive Oil",           category: "Fat",          caloriesPer100g: 884, proteinPer100g: 0,    carbsPer100g: 0,    fatPer100g: 100,  unit: "ml" },
  { id: "22", name: "Avocado",             category: "Fat",          caloriesPer100g: 160, proteinPer100g: 2,    carbsPer100g: 8.5,  fatPer100g: 14.7, unit: "unit" },
  { id: "23", name: "Almonds",             category: "Fat",          caloriesPer100g: 579, proteinPer100g: 21,   carbsPer100g: 22,   fatPer100g: 50,   unit: "g" },
  { id: "24", name: "Peanut Butter",       category: "Fat",          caloriesPer100g: 588, proteinPer100g: 25,   carbsPer100g: 20,   fatPer100g: 50,   unit: "g" },
  { id: "25", name: "Coconut Oil",         category: "Fat",          caloriesPer100g: 862, proteinPer100g: 0,    carbsPer100g: 0,    fatPer100g: 100,  unit: "ml" },
  { id: "26", name: "Walnuts",             category: "Fat",          caloriesPer100g: 654, proteinPer100g: 15,   carbsPer100g: 14,   fatPer100g: 65,   unit: "g" },
  { id: "27", name: "Chia Seeds",          category: "Fat",          caloriesPer100g: 486, proteinPer100g: 17,   carbsPer100g: 42,   fatPer100g: 31,   unit: "g" },
  { id: "28", name: "Flaxseed",            category: "Fat",          caloriesPer100g: 534, proteinPer100g: 18,   carbsPer100g: 29,   fatPer100g: 42,   unit: "g" },

  // Vegetable (8)
  { id: "29", name: "Broccoli",            category: "Vegetable",    caloriesPer100g: 34,  proteinPer100g: 2.8,  carbsPer100g: 7,    fatPer100g: 0.4,  unit: "g" },
  { id: "30", name: "Spinach",             category: "Vegetable",    caloriesPer100g: 23,  proteinPer100g: 2.9,  carbsPer100g: 3.6,  fatPer100g: 0.4,  unit: "g" },
  { id: "31", name: "Bell Pepper",         category: "Vegetable",    caloriesPer100g: 31,  proteinPer100g: 1,    carbsPer100g: 6,    fatPer100g: 0.3,  unit: "g" },
  { id: "32", name: "Tomato",              category: "Vegetable",    caloriesPer100g: 18,  proteinPer100g: 0.9,  carbsPer100g: 3.9,  fatPer100g: 0.2,  unit: "g" },
  { id: "33", name: "Cucumber",            category: "Vegetable",    caloriesPer100g: 16,  proteinPer100g: 0.7,  carbsPer100g: 3.6,  fatPer100g: 0.1,  unit: "g" },
  { id: "34", name: "Zucchini",            category: "Vegetable",    caloriesPer100g: 17,  proteinPer100g: 1.2,  carbsPer100g: 3.1,  fatPer100g: 0.3,  unit: "g" },
  { id: "35", name: "Kale",                category: "Vegetable",    caloriesPer100g: 49,  proteinPer100g: 4.3,  carbsPer100g: 9,    fatPer100g: 0.9,  unit: "g" },
  { id: "36", name: "Asparagus",           category: "Vegetable",    caloriesPer100g: 20,  proteinPer100g: 2.2,  carbsPer100g: 3.9,  fatPer100g: 0.1,  unit: "g" },

  // Fruit (6)
  { id: "37", name: "Banana",              category: "Fruit",        caloriesPer100g: 89,  proteinPer100g: 1.1,  carbsPer100g: 23,   fatPer100g: 0.3,  unit: "unit" },
  { id: "38", name: "Apple",               category: "Fruit",        caloriesPer100g: 52,  proteinPer100g: 0.3,  carbsPer100g: 14,   fatPer100g: 0.2,  unit: "unit" },
  { id: "39", name: "Blueberries",         category: "Fruit",        caloriesPer100g: 57,  proteinPer100g: 0.7,  carbsPer100g: 14,   fatPer100g: 0.3,  unit: "g" },
  { id: "40", name: "Orange",              category: "Fruit",        caloriesPer100g: 47,  proteinPer100g: 0.9,  carbsPer100g: 12,   fatPer100g: 0.1,  unit: "unit" },
  { id: "41", name: "Strawberries",        category: "Fruit",        caloriesPer100g: 32,  proteinPer100g: 0.7,  carbsPer100g: 7.7,  fatPer100g: 0.3,  unit: "g" },
  { id: "42", name: "Mango",               category: "Fruit",        caloriesPer100g: 60,  proteinPer100g: 0.8,  carbsPer100g: 15,   fatPer100g: 0.4,  unit: "g" },

  // Dairy (4)
  { id: "43", name: "Greek Yogurt",        category: "Dairy",        caloriesPer100g: 59,  proteinPer100g: 10,   carbsPer100g: 3.6,  fatPer100g: 0.7,  unit: "g" },
  { id: "44", name: "Milk (whole)",        category: "Dairy",        caloriesPer100g: 61,  proteinPer100g: 3.2,  carbsPer100g: 4.8,  fatPer100g: 3.3,  unit: "ml" },
  { id: "45", name: "Cottage Cheese",      category: "Dairy",        caloriesPer100g: 98,  proteinPer100g: 11,   carbsPer100g: 3.4,  fatPer100g: 4.3,  unit: "g" },
  { id: "46", name: "Cheddar Cheese",      category: "Dairy",        caloriesPer100g: 403, proteinPer100g: 25,   carbsPer100g: 1.3,  fatPer100g: 33,   unit: "g" },

  // Beverage (2)
  { id: "47", name: "Green Tea",           category: "Beverage",     caloriesPer100g: 1,   proteinPer100g: 0,    carbsPer100g: 0.2,  fatPer100g: 0,    unit: "ml" },
  { id: "48", name: "Black Coffee",        category: "Beverage",     caloriesPer100g: 2,   proteinPer100g: 0.1,  carbsPer100g: 0,    fatPer100g: 0,    unit: "ml" },

  // Other (2)
  { id: "49", name: "Whey Protein",        category: "Other",        caloriesPer100g: 400, proteinPer100g: 80,   carbsPer100g: 10,   fatPer100g: 5,    unit: "g" },
  { id: "50", name: "Honey",               category: "Other",        caloriesPer100g: 304, proteinPer100g: 0.3,  carbsPer100g: 82,   fatPer100g: 0,    unit: "g" },
];
