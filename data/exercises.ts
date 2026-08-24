export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  difficulty: Difficulty;
}

export const exercises: Exercise[] = [
  // Chest
  { id: "1",  name: "Barbell Bench Press",     muscleGroup: "Chest",     equipment: "Barbell",    difficulty: "Intermediate" },
  { id: "2",  name: "Incline Dumbbell Press",  muscleGroup: "Chest",     equipment: "Dumbbell",   difficulty: "Intermediate" },
  { id: "3",  name: "Push-Up",                 muscleGroup: "Chest",     equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "4",  name: "Cable Fly",               muscleGroup: "Chest",     equipment: "Cable",      difficulty: "Beginner" },
  // Back
  { id: "5",  name: "Deadlift",                muscleGroup: "Back",      equipment: "Barbell",    difficulty: "Advanced" },
  { id: "6",  name: "Pull-Up",                 muscleGroup: "Back",      equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "7",  name: "Barbell Row",             muscleGroup: "Back",      equipment: "Barbell",    difficulty: "Intermediate" },
  { id: "8",  name: "Lat Pulldown",            muscleGroup: "Back",      equipment: "Cable",      difficulty: "Beginner" },
  // Legs
  { id: "9",  name: "Barbell Squat",           muscleGroup: "Legs",      equipment: "Barbell",    difficulty: "Advanced" },
  { id: "10", name: "Leg Press",               muscleGroup: "Legs",      equipment: "Machine",    difficulty: "Beginner" },
  { id: "11", name: "Romanian Deadlift",       muscleGroup: "Legs",      equipment: "Barbell",    difficulty: "Intermediate" },
  { id: "12", name: "Walking Lunge",           muscleGroup: "Legs",      equipment: "Dumbbell",   difficulty: "Beginner" },
  // Shoulders
  { id: "13", name: "Overhead Press",          muscleGroup: "Shoulders", equipment: "Barbell",    difficulty: "Intermediate" },
  { id: "14", name: "Lateral Raise",           muscleGroup: "Shoulders", equipment: "Dumbbell",   difficulty: "Beginner" },
  { id: "15", name: "Face Pull",               muscleGroup: "Shoulders", equipment: "Cable",      difficulty: "Beginner" },
  // Arms
  { id: "16", name: "Barbell Curl",            muscleGroup: "Arms",      equipment: "Barbell",    difficulty: "Beginner" },
  { id: "17", name: "Tricep Dip",              muscleGroup: "Arms",      equipment: "Bodyweight", difficulty: "Intermediate" },
  { id: "18", name: "Hammer Curl",             muscleGroup: "Arms",      equipment: "Dumbbell",   difficulty: "Beginner" },
  // Core
  { id: "19", name: "Plank",                   muscleGroup: "Core",      equipment: "Bodyweight", difficulty: "Beginner" },
  { id: "20", name: "Hanging Leg Raise",       muscleGroup: "Core",      equipment: "Bodyweight", difficulty: "Advanced" },
];
