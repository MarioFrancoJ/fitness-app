export type WorkoutGoal = "Fat Loss" | "Muscle Gain" | "Strength" | "Endurance" | "Mobility" | "General Fitness";
export type WorkoutDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export const WORKOUT_GOALS: WorkoutGoal[] = ["Fat Loss", "Muscle Gain", "Strength", "Endurance", "Mobility", "General Fitness"];
export const WORKOUT_DIFFICULTIES: WorkoutDifficulty[] = ["Beginner", "Intermediate", "Advanced"];
export const DAY_NAMES: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string;
}

export interface WorkoutDay {
  dayName: DayName;
  exercises: WorkoutExercise[];
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  goal: WorkoutGoal;
  difficulty: WorkoutDifficulty;
  duration: number; // estimated minutes
  workoutDays: WorkoutDay[];
  isTemplate: boolean;
  createdAt: string;
}

// ── Seed Templates ────────────────────────────────────────────────────────────

export const workoutTemplates: Workout[] = [
  {
    id: "tpl-1",
    name: "Full Body Beginner",
    description: "3-day full body routine perfect for beginners building foundational strength.",
    goal: "General Fitness",
    difficulty: "Beginner",
    duration: 45,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "4", exerciseName: "Barbell Squat", sets: 3, reps: 10, restSeconds: 90, notes: "" },
          { exerciseId: "1", exerciseName: "Barbell Bench Press", sets: 3, reps: 10, restSeconds: 90, notes: "" },
          { exerciseId: "6", exerciseName: "Barbell Row", sets: 3, reps: 10, restSeconds: 90, notes: "" },
          { exerciseId: "5", exerciseName: "Overhead Press", sets: 3, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "28", exerciseName: "Plank", sets: 3, reps: 30, restSeconds: 30, notes: "30 second hold" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "3", exerciseName: "Deadlift", sets: 3, reps: 8, restSeconds: 120, notes: "" },
          { exerciseId: "2", exerciseName: "Incline Dumbbell Press", sets: 3, reps: 10, restSeconds: 90, notes: "" },
          { exerciseId: "14", exerciseName: "Lat Pulldown", sets: 3, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "12", exerciseName: "Walking Lunge", sets: 3, reps: 12, restSeconds: 60, notes: "each leg" },
          { exerciseId: "10", exerciseName: "Barbell Curl", sets: 3, reps: 12, restSeconds: 45, notes: "" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "8", exerciseName: "Leg Press", sets: 3, reps: 12, restSeconds: 90, notes: "" },
          { exerciseId: "13", exerciseName: "Cable Fly", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "15", exerciseName: "Face Pull", sets: 3, reps: 15, restSeconds: 45, notes: "" },
          { exerciseId: "11", exerciseName: "Skull Crusher", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "19", exerciseName: "Calf Raise", sets: 3, reps: 15, restSeconds: 30, notes: "" },
        ],
      },
    ],
  },
  {
    id: "tpl-2",
    name: "Upper Lower Split",
    description: "4-day upper/lower split for balanced muscle development.",
    goal: "Muscle Gain",
    difficulty: "Intermediate",
    duration: 60,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "1", exerciseName: "Barbell Bench Press", sets: 4, reps: 8, restSeconds: 90, notes: "Upper A" },
          { exerciseId: "6", exerciseName: "Barbell Row", sets: 4, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "5", exerciseName: "Overhead Press", sets: 3, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "22", exerciseName: "Pull-Up", sets: 3, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "9", exerciseName: "Dumbbell Lateral Raise", sets: 3, reps: 15, restSeconds: 45, notes: "" },
          { exerciseId: "10", exerciseName: "Barbell Curl", sets: 3, reps: 12, restSeconds: 45, notes: "" },
        ],
      },
      {
        dayName: "Tuesday",
        exercises: [
          { exerciseId: "4", exerciseName: "Barbell Squat", sets: 4, reps: 8, restSeconds: 120, notes: "Lower A" },
          { exerciseId: "7", exerciseName: "Romanian Deadlift", sets: 4, reps: 10, restSeconds: 90, notes: "" },
          { exerciseId: "8", exerciseName: "Leg Press", sets: 3, reps: 12, restSeconds: 90, notes: "" },
          { exerciseId: "18", exerciseName: "Hip Thrust", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "19", exerciseName: "Calf Raise", sets: 4, reps: 15, restSeconds: 30, notes: "" },
        ],
      },
      {
        dayName: "Thursday",
        exercises: [
          { exerciseId: "2", exerciseName: "Incline Dumbbell Press", sets: 4, reps: 10, restSeconds: 90, notes: "Upper B" },
          { exerciseId: "14", exerciseName: "Lat Pulldown", sets: 4, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "13", exerciseName: "Cable Fly", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "15", exerciseName: "Face Pull", sets: 3, reps: 15, restSeconds: 45, notes: "" },
          { exerciseId: "11", exerciseName: "Skull Crusher", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "16", exerciseName: "Hammer Curl", sets: 3, reps: 12, restSeconds: 45, notes: "" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "3", exerciseName: "Deadlift", sets: 4, reps: 5, restSeconds: 180, notes: "Lower B" },
          { exerciseId: "12", exerciseName: "Walking Lunge", sets: 3, reps: 12, restSeconds: 60, notes: "each leg" },
          { exerciseId: "8", exerciseName: "Leg Press", sets: 3, reps: 15, restSeconds: 90, notes: "high reps" },
          { exerciseId: "18", exerciseName: "Hip Thrust", sets: 3, reps: 15, restSeconds: 60, notes: "" },
          { exerciseId: "19", exerciseName: "Calf Raise", sets: 4, reps: 12, restSeconds: 30, notes: "" },
        ],
      },
    ],
  },
  {
    id: "tpl-3",
    name: "Push Pull Legs",
    description: "Classic 6-day PPL split for maximum muscle growth.",
    goal: "Muscle Gain",
    difficulty: "Intermediate",
    duration: 60,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "1", exerciseName: "Barbell Bench Press", sets: 4, reps: 8, restSeconds: 90, notes: "Push" },
          { exerciseId: "5", exerciseName: "Overhead Press", sets: 4, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "2", exerciseName: "Incline Dumbbell Press", sets: 3, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "9", exerciseName: "Dumbbell Lateral Raise", sets: 3, reps: 15, restSeconds: 45, notes: "" },
          { exerciseId: "11", exerciseName: "Skull Crusher", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "24", exerciseName: "Dip", sets: 3, reps: 10, restSeconds: 60, notes: "" },
        ],
      },
      {
        dayName: "Tuesday",
        exercises: [
          { exerciseId: "3", exerciseName: "Deadlift", sets: 4, reps: 5, restSeconds: 180, notes: "Pull" },
          { exerciseId: "22", exerciseName: "Pull-Up", sets: 4, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "6", exerciseName: "Barbell Row", sets: 4, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "15", exerciseName: "Face Pull", sets: 3, reps: 15, restSeconds: 45, notes: "" },
          { exerciseId: "10", exerciseName: "Barbell Curl", sets: 3, reps: 12, restSeconds: 45, notes: "" },
          { exerciseId: "16", exerciseName: "Hammer Curl", sets: 3, reps: 12, restSeconds: 45, notes: "" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "4", exerciseName: "Barbell Squat", sets: 4, reps: 8, restSeconds: 120, notes: "Legs" },
          { exerciseId: "7", exerciseName: "Romanian Deadlift", sets: 4, reps: 10, restSeconds: 90, notes: "" },
          { exerciseId: "8", exerciseName: "Leg Press", sets: 3, reps: 12, restSeconds: 90, notes: "" },
          { exerciseId: "12", exerciseName: "Walking Lunge", sets: 3, reps: 12, restSeconds: 60, notes: "each leg" },
          { exerciseId: "18", exerciseName: "Hip Thrust", sets: 3, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "19", exerciseName: "Calf Raise", sets: 4, reps: 15, restSeconds: 30, notes: "" },
        ],
      },
    ],
  },
  {
    id: "tpl-4",
    name: "Fat Loss Circuit",
    description: "High-intensity circuit training for maximum calorie burn.",
    goal: "Fat Loss",
    difficulty: "Intermediate",
    duration: 30,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "36", exerciseName: "Burpee", sets: 4, reps: 10, restSeconds: 30, notes: "" },
          { exerciseId: "38", exerciseName: "Jump Squat", sets: 4, reps: 15, restSeconds: 30, notes: "" },
          { exerciseId: "21", exerciseName: "Push-Up", sets: 4, reps: 15, restSeconds: 30, notes: "" },
          { exerciseId: "37", exerciseName: "Mountain Climber", sets: 4, reps: 20, restSeconds: 30, notes: "each side" },
          { exerciseId: "20", exerciseName: "Kettlebell Swing", sets: 4, reps: 15, restSeconds: 30, notes: "" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "39", exerciseName: "Box Jump", sets: 4, reps: 10, restSeconds: 30, notes: "" },
          { exerciseId: "34", exerciseName: "Australian Pull-Up", sets: 4, reps: 12, restSeconds: 30, notes: "" },
          { exerciseId: "12", exerciseName: "Walking Lunge", sets: 4, reps: 12, restSeconds: 30, notes: "each leg" },
          { exerciseId: "24", exerciseName: "Dip", sets: 4, reps: 10, restSeconds: 30, notes: "" },
          { exerciseId: "28", exerciseName: "Plank", sets: 3, reps: 45, restSeconds: 15, notes: "45s hold" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "40", exerciseName: "Jumping Jacks", sets: 4, reps: 30, restSeconds: 20, notes: "" },
          { exerciseId: "36", exerciseName: "Burpee", sets: 3, reps: 12, restSeconds: 30, notes: "" },
          { exerciseId: "21", exerciseName: "Push-Up", sets: 3, reps: 20, restSeconds: 30, notes: "" },
          { exerciseId: "38", exerciseName: "Jump Squat", sets: 3, reps: 20, restSeconds: 30, notes: "" },
          { exerciseId: "37", exerciseName: "Mountain Climber", sets: 3, reps: 30, restSeconds: 20, notes: "" },
        ],
      },
    ],
  },
  {
    id: "tpl-5",
    name: "Calisthenics Beginner",
    description: "Bodyweight fundamentals for those new to calisthenics.",
    goal: "General Fitness",
    difficulty: "Beginner",
    duration: 40,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "21", exerciseName: "Push-Up", sets: 3, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "34", exerciseName: "Australian Pull-Up", sets: 3, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "28", exerciseName: "Plank", sets: 3, reps: 30, restSeconds: 30, notes: "30s hold" },
          { exerciseId: "38", exerciseName: "Jump Squat", sets: 3, reps: 10, restSeconds: 60, notes: "" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "35", exerciseName: "Diamond Push-Up", sets: 3, reps: 8, restSeconds: 60, notes: "" },
          { exerciseId: "34", exerciseName: "Australian Pull-Up", sets: 3, reps: 12, restSeconds: 60, notes: "feet elevated" },
          { exerciseId: "29", exerciseName: "Hollow Hold", sets: 3, reps: 20, restSeconds: 45, notes: "20s hold" },
          { exerciseId: "12", exerciseName: "Walking Lunge", sets: 3, reps: 10, restSeconds: 60, notes: "each leg" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "21", exerciseName: "Push-Up", sets: 4, reps: 12, restSeconds: 45, notes: "" },
          { exerciseId: "24", exerciseName: "Dip", sets: 3, reps: 6, restSeconds: 90, notes: "assisted if needed" },
          { exerciseId: "28", exerciseName: "Plank", sets: 3, reps: 45, restSeconds: 30, notes: "45s hold" },
          { exerciseId: "37", exerciseName: "Mountain Climber", sets: 3, reps: 20, restSeconds: 30, notes: "" },
        ],
      },
    ],
  },
  {
    id: "tpl-6",
    name: "Calisthenics Intermediate",
    description: "Progress to harder bodyweight movements and holds.",
    goal: "Strength",
    difficulty: "Intermediate",
    duration: 50,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "22", exerciseName: "Pull-Up", sets: 4, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "24", exerciseName: "Dip", sets: 4, reps: 10, restSeconds: 60, notes: "" },
          { exerciseId: "27", exerciseName: "Pistol Squat", sets: 3, reps: 5, restSeconds: 90, notes: "each leg" },
          { exerciseId: "32", exerciseName: "L-Sit", sets: 3, reps: 15, restSeconds: 60, notes: "15s hold" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "23", exerciseName: "Chin-Up", sets: 4, reps: 8, restSeconds: 90, notes: "" },
          { exerciseId: "35", exerciseName: "Diamond Push-Up", sets: 4, reps: 12, restSeconds: 60, notes: "" },
          { exerciseId: "29", exerciseName: "Hollow Hold", sets: 3, reps: 30, restSeconds: 45, notes: "30s hold" },
          { exerciseId: "36", exerciseName: "Burpee", sets: 3, reps: 10, restSeconds: 60, notes: "" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "22", exerciseName: "Pull-Up", sets: 4, reps: 10, restSeconds: 90, notes: "weighted if possible" },
          { exerciseId: "26", exerciseName: "Handstand Push-Up", sets: 3, reps: 5, restSeconds: 120, notes: "wall supported" },
          { exerciseId: "27", exerciseName: "Pistol Squat", sets: 3, reps: 6, restSeconds: 90, notes: "each leg" },
          { exerciseId: "32", exerciseName: "L-Sit", sets: 3, reps: 20, restSeconds: 60, notes: "20s hold" },
        ],
      },
    ],
  },
  {
    id: "tpl-7",
    name: "Calisthenics Advanced",
    description: "Advanced skills and strength work for experienced athletes.",
    goal: "Strength",
    difficulty: "Advanced",
    duration: 60,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "25", exerciseName: "Muscle-Up", sets: 4, reps: 5, restSeconds: 120, notes: "" },
          { exerciseId: "26", exerciseName: "Handstand Push-Up", sets: 4, reps: 6, restSeconds: 120, notes: "freestanding" },
          { exerciseId: "30", exerciseName: "Front Lever", sets: 4, reps: 10, restSeconds: 120, notes: "10s hold" },
          { exerciseId: "33", exerciseName: "Handstand", sets: 3, reps: 30, restSeconds: 60, notes: "30s hold" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "31", exerciseName: "Back Lever", sets: 4, reps: 10, restSeconds: 120, notes: "10s hold" },
          { exerciseId: "25", exerciseName: "Muscle-Up", sets: 3, reps: 6, restSeconds: 120, notes: "" },
          { exerciseId: "27", exerciseName: "Pistol Squat", sets: 4, reps: 8, restSeconds: 60, notes: "weighted" },
          { exerciseId: "32", exerciseName: "L-Sit", sets: 3, reps: 30, restSeconds: 60, notes: "30s hold" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "22", exerciseName: "Pull-Up", sets: 5, reps: 5, restSeconds: 90, notes: "weighted heavy" },
          { exerciseId: "24", exerciseName: "Dip", sets: 5, reps: 5, restSeconds: 90, notes: "weighted heavy" },
          { exerciseId: "30", exerciseName: "Front Lever", sets: 3, reps: 15, restSeconds: 120, notes: "15s hold" },
          { exerciseId: "33", exerciseName: "Handstand", sets: 3, reps: 45, restSeconds: 60, notes: "45s freestanding" },
        ],
      },
    ],
  },
  {
    id: "tpl-8",
    name: "Strength 5x5",
    description: "Classic 5x5 linear progression program for raw strength.",
    goal: "Strength",
    difficulty: "Intermediate",
    duration: 50,
    isTemplate: true,
    createdAt: "2024-01-01",
    workoutDays: [
      {
        dayName: "Monday",
        exercises: [
          { exerciseId: "4", exerciseName: "Barbell Squat", sets: 5, reps: 5, restSeconds: 180, notes: "Workout A" },
          { exerciseId: "1", exerciseName: "Barbell Bench Press", sets: 5, reps: 5, restSeconds: 180, notes: "" },
          { exerciseId: "6", exerciseName: "Barbell Row", sets: 5, reps: 5, restSeconds: 180, notes: "" },
        ],
      },
      {
        dayName: "Wednesday",
        exercises: [
          { exerciseId: "4", exerciseName: "Barbell Squat", sets: 5, reps: 5, restSeconds: 180, notes: "Workout B" },
          { exerciseId: "5", exerciseName: "Overhead Press", sets: 5, reps: 5, restSeconds: 180, notes: "" },
          { exerciseId: "3", exerciseName: "Deadlift", sets: 1, reps: 5, restSeconds: 300, notes: "1 heavy set" },
        ],
      },
      {
        dayName: "Friday",
        exercises: [
          { exerciseId: "4", exerciseName: "Barbell Squat", sets: 5, reps: 5, restSeconds: 180, notes: "Workout A" },
          { exerciseId: "1", exerciseName: "Barbell Bench Press", sets: 5, reps: 5, restSeconds: 180, notes: "" },
          { exerciseId: "6", exerciseName: "Barbell Row", sets: 5, reps: 5, restSeconds: 180, notes: "" },
        ],
      },
    ],
  },
];
