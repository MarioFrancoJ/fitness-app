export interface Food {
  id: string;
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const foods: Food[] = [
  { id: "1",  name: "Chicken Breast",  serving: "100g",   calories: 165, protein: 31,  carbs: 0,   fat: 3.6 },
  { id: "2",  name: "Egg",             serving: "1 large", calories: 72,  protein: 6.3, carbs: 0.4, fat: 4.8 },
  { id: "3",  name: "White Rice",      serving: "100g cooked", calories: 130, protein: 2.7, carbs: 28,  fat: 0.3 },
  { id: "4",  name: "Oats",            serving: "40g dry",    calories: 152, protein: 5.3, carbs: 27,  fat: 2.7 },
  { id: "5",  name: "Banana",          serving: "1 medium",   calories: 105, protein: 1.3, carbs: 27,  fat: 0.4 },
  { id: "6",  name: "Avocado",         serving: "1/2 fruit",  calories: 160, protein: 2,   carbs: 8.5, fat: 14.7 },
  { id: "7",  name: "Salmon",          serving: "100g",       calories: 208, protein: 20,  carbs: 0,   fat: 13 },
  { id: "8",  name: "Greek Yogurt",    serving: "170g",       calories: 100, protein: 17,  carbs: 6,   fat: 0.7 },
  { id: "9",  name: "Potato",          serving: "1 medium",   calories: 161, protein: 4.3, carbs: 37,  fat: 0.2 },
  { id: "10", name: "Peanut Butter",   serving: "2 tbsp",     calories: 190, protein: 7,   carbs: 7,   fat: 16 },
];
