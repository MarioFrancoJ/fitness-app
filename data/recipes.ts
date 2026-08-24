export type RecipeGoal = "Fat Loss" | "Muscle Gain" | "Maintenance";

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  goal: RecipeGoal;
  ingredients: RecipeIngredient[];
  servings: number;
  instructions: string[];
  prepTime: number; // minutes
  image: string | null;
  // Computed from ingredients (stored for quick access)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const RECIPE_GOALS: RecipeGoal[] = ["Fat Loss", "Muscle Gain", "Maintenance"];

export const recipes: Recipe[] = [
  // ─── Fat Loss (4) ───────────────────────────────────────────────────────────
  {
    id: "1",
    name: "Grilled Chicken Salad",
    description: "A light and refreshing salad with lean protein and healthy fats.",
    goal: "Fat Loss",
    ingredients: [
      { ingredientId: "1", name: "Chicken Breast", quantity: 150, unit: "g" },
      { ingredientId: "30", name: "Spinach", quantity: 100, unit: "g" },
      { ingredientId: "22", name: "Avocado", quantity: 50, unit: "g" },
      { ingredientId: "32", name: "Tomato", quantity: 80, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 10, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Season chicken breast with salt, pepper, and paprika.",
      "Grill on medium-high heat for 6-7 minutes per side.",
      "Let rest 3 minutes, then slice into strips.",
      "Toss spinach, tomato, and avocado in a bowl.",
      "Drizzle with olive oil and top with chicken.",
    ],
    prepTime: 20,
    image: null,
    calories: 380,
    protein: 42,
    carbs: 12,
    fat: 18,
  },
  {
    id: "2",
    name: "Egg White Veggie Omelette",
    description: "Low-fat, high-protein breakfast packed with vegetables.",
    goal: "Fat Loss",
    ingredients: [
      { ingredientId: "2", name: "Egg", quantity: 6, unit: "unit" },
      { ingredientId: "30", name: "Spinach", quantity: 50, unit: "g" },
      { ingredientId: "31", name: "Bell Pepper", quantity: 50, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 5, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Separate egg whites (use 6 whites).",
      "Heat olive oil in a non-stick pan over medium heat.",
      "Sauté bell pepper for 2 minutes.",
      "Add spinach and cook 30 seconds.",
      "Pour egg whites over vegetables and cook until set.",
      "Fold in half and serve.",
    ],
    prepTime: 10,
    image: null,
    calories: 210,
    protein: 26,
    carbs: 8,
    fat: 8,
  },
  {
    id: "3",
    name: "Tuna Lettuce Wraps",
    description: "Quick no-cook wraps with lean tuna and fresh vegetables.",
    goal: "Fat Loss",
    ingredients: [
      { ingredientId: "5", name: "Tuna (canned)", quantity: 150, unit: "g" },
      { ingredientId: "43", name: "Greek Yogurt", quantity: 30, unit: "g" },
      { ingredientId: "33", name: "Cucumber", quantity: 50, unit: "g" },
      { ingredientId: "30", name: "Spinach", quantity: 40, unit: "g" },
    ],
    servings: 1,
    instructions: [
      "Drain tuna and mix with Greek yogurt.",
      "Dice cucumber and fold into the mixture.",
      "Divide onto spinach leaves as wraps.",
      "Roll and serve chilled.",
    ],
    prepTime: 5,
    image: null,
    calories: 220,
    protein: 38,
    carbs: 6,
    fat: 4,
  },
  {
    id: "4",
    name: "Zucchini Turkey Boats",
    description: "Stuffed zucchini with lean turkey and melted cheese.",
    goal: "Fat Loss",
    ingredients: [
      { ingredientId: "34", name: "Zucchini", quantity: 200, unit: "g" },
      { ingredientId: "7", name: "Turkey Breast", quantity: 200, unit: "g" },
      { ingredientId: "32", name: "Tomato", quantity: 50, unit: "g" },
      { ingredientId: "46", name: "Cheddar Cheese", quantity: 20, unit: "g" },
    ],
    servings: 2,
    instructions: [
      "Preheat oven to 200°C.",
      "Halve zucchinis and scoop out centres.",
      "Cook turkey in a pan with diced tomato.",
      "Fill zucchini halves with turkey mixture.",
      "Top with cheese and bake 15 minutes.",
    ],
    prepTime: 25,
    image: null,
    calories: 290,
    protein: 38,
    carbs: 8,
    fat: 11,
  },

  // ─── Muscle Gain (4) ───────────────────────────────────────────────────────
  {
    id: "5",
    name: "Chicken Rice Power Bowl",
    description: "High-protein bowl with chicken, rice, and black beans.",
    goal: "Muscle Gain",
    ingredients: [
      { ingredientId: "1", name: "Chicken Breast", quantity: 200, unit: "g" },
      { ingredientId: "12", name: "Brown Rice", quantity: 150, unit: "g" },
      { ingredientId: "19", name: "Black Beans", quantity: 80, unit: "g" },
      { ingredientId: "22", name: "Avocado", quantity: 40, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 10, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Cook brown rice according to package directions.",
      "Season and grill chicken breast, then dice.",
      "Warm black beans in a small pot.",
      "Assemble bowl: rice, beans, chicken, avocado.",
      "Drizzle with olive oil.",
    ],
    prepTime: 30,
    image: null,
    calories: 620,
    protein: 52,
    carbs: 60,
    fat: 16,
  },
  {
    id: "6",
    name: "Beef & Sweet Potato Plate",
    description: "Mass-building meal with lean beef, sweet potato, and broccoli.",
    goal: "Muscle Gain",
    ingredients: [
      { ingredientId: "4", name: "Ground Beef (lean)", quantity: 200, unit: "g" },
      { ingredientId: "15", name: "Sweet Potato", quantity: 200, unit: "g" },
      { ingredientId: "29", name: "Broccoli", quantity: 150, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 10, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Preheat oven to 200°C. Cube sweet potato and roast 25 minutes.",
      "Brown ground beef in a skillet.",
      "Steam broccoli until tender-crisp.",
      "Plate together and drizzle with olive oil.",
    ],
    prepTime: 35,
    image: null,
    calories: 680,
    protein: 52,
    carbs: 48,
    fat: 28,
  },
  {
    id: "7",
    name: "Salmon Quinoa Bowl",
    description: "Omega-3 rich salmon over quinoa with edamame.",
    goal: "Muscle Gain",
    ingredients: [
      { ingredientId: "3", name: "Salmon", quantity: 150, unit: "g" },
      { ingredientId: "17", name: "Quinoa", quantity: 120, unit: "g" },
      { ingredientId: "33", name: "Cucumber", quantity: 60, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 10, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Cook quinoa according to package directions.",
      "Pan-sear salmon skin-side down 4 minutes, flip and cook 3 more.",
      "Slice cucumber.",
      "Build bowl: quinoa, flaked salmon, cucumber.",
      "Drizzle with olive oil.",
    ],
    prepTime: 20,
    image: null,
    calories: 590,
    protein: 42,
    carbs: 44,
    fat: 24,
  },
  {
    id: "8",
    name: "Protein Pancakes Stack",
    description: "Fluffy protein-packed pancakes for muscle recovery.",
    goal: "Muscle Gain",
    ingredients: [
      { ingredientId: "49", name: "Whey Protein", quantity: 30, unit: "g" },
      { ingredientId: "13", name: "Oats", quantity: 50, unit: "g" },
      { ingredientId: "37", name: "Banana", quantity: 100, unit: "g" },
      { ingredientId: "2", name: "Egg", quantity: 2, unit: "unit" },
      { ingredientId: "44", name: "Milk (whole)", quantity: 60, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Blend oats, protein powder, banana, eggs, and milk.",
      "Heat a non-stick pan on medium-low.",
      "Pour 1/4 cup batter per pancake.",
      "Cook until bubbles form, then flip.",
      "Stack and serve with honey if desired.",
    ],
    prepTime: 15,
    image: null,
    calories: 520,
    protein: 44,
    carbs: 55,
    fat: 12,
  },

  // ─── Maintenance (4) ───────────────────────────────────────────────────────
  {
    id: "9",
    name: "Mediterranean Chicken Wrap",
    description: "Balanced wrap with grilled chicken, hummus, and fresh veggies.",
    goal: "Maintenance",
    ingredients: [
      { ingredientId: "1", name: "Chicken Breast", quantity: 120, unit: "g" },
      { ingredientId: "16", name: "Whole Wheat Bread", quantity: 60, unit: "g" },
      { ingredientId: "33", name: "Cucumber", quantity: 50, unit: "g" },
      { ingredientId: "46", name: "Cheddar Cheese", quantity: 20, unit: "g" },
      { ingredientId: "30", name: "Spinach", quantity: 30, unit: "g" },
    ],
    servings: 1,
    instructions: [
      "Warm tortilla/bread in a dry pan.",
      "Slice grilled chicken.",
      "Layer spinach, chicken, cucumber, and cheese.",
      "Roll tightly and slice in half.",
    ],
    prepTime: 10,
    image: null,
    calories: 430,
    protein: 40,
    carbs: 32,
    fat: 14,
  },
  {
    id: "10",
    name: "Shrimp Stir-Fry",
    description: "Quick stir-fry with shrimp, rice, and crisp vegetables.",
    goal: "Maintenance",
    ingredients: [
      { ingredientId: "6", name: "Shrimp", quantity: 150, unit: "g" },
      { ingredientId: "11", name: "White Rice", quantity: 120, unit: "g" },
      { ingredientId: "29", name: "Broccoli", quantity: 80, unit: "g" },
      { ingredientId: "31", name: "Bell Pepper", quantity: 60, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 10, unit: "ml" },
    ],
    servings: 1,
    instructions: [
      "Cook rice and set aside.",
      "Heat oil in a wok over high heat.",
      "Add shrimp and cook until pink.",
      "Toss in broccoli and bell pepper, stir-fry 3 minutes.",
      "Serve over rice.",
    ],
    prepTime: 20,
    image: null,
    calories: 420,
    protein: 36,
    carbs: 44,
    fat: 10,
  },
  {
    id: "11",
    name: "Greek Yogurt Parfait",
    description: "Layered yogurt with granola, berries, and honey.",
    goal: "Maintenance",
    ingredients: [
      { ingredientId: "43", name: "Greek Yogurt", quantity: 200, unit: "g" },
      { ingredientId: "13", name: "Oats", quantity: 30, unit: "g" },
      { ingredientId: "39", name: "Blueberries", quantity: 80, unit: "g" },
      { ingredientId: "50", name: "Honey", quantity: 15, unit: "g" },
      { ingredientId: "23", name: "Almonds", quantity: 15, unit: "g" },
    ],
    servings: 1,
    instructions: [
      "Spoon half the yogurt into a glass.",
      "Add a layer of oats and half the berries.",
      "Add remaining yogurt, berries, and almonds.",
      "Drizzle honey on top.",
    ],
    prepTime: 5,
    image: null,
    calories: 380,
    protein: 28,
    carbs: 42,
    fat: 12,
  },
  {
    id: "12",
    name: "Lentil & Vegetable Soup",
    description: "Hearty lentil soup packed with vegetables and warming spices.",
    goal: "Maintenance",
    ingredients: [
      { ingredientId: "20", name: "Lentils", quantity: 100, unit: "g" },
      { ingredientId: "32", name: "Tomato", quantity: 100, unit: "g" },
      { ingredientId: "30", name: "Spinach", quantity: 50, unit: "g" },
      { ingredientId: "21", name: "Olive Oil", quantity: 10, unit: "ml" },
    ],
    servings: 2,
    instructions: [
      "Heat olive oil. Sauté diced tomato for 3 minutes.",
      "Add lentils and 3 cups water, bring to boil.",
      "Simmer 20 minutes until lentils are tender.",
      "Stir in spinach and cook 1 minute.",
      "Season with salt, pepper, and cumin.",
    ],
    prepTime: 30,
    image: null,
    calories: 360,
    protein: 22,
    carbs: 45,
    fat: 8,
  },
];
