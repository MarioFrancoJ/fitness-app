export interface WorkoutTemplate {
  id: string;
  name: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  exercises: string[];
  description: string;
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: "1",
    name: "Push",
    category: "Split",
    difficulty: "Intermediate",
    duration: "45–60 min",
    exercises: ["Barbell Bench Press", "Incline Dumbbell Press", "Cable Fly", "Overhead Press", "Lateral Raise", "Tricep Dip"],
    description: "Chest, shoulders, and triceps focused session. Classic push day for a PPL split.",
  },
  {
    id: "2",
    name: "Pull",
    category: "Split",
    difficulty: "Intermediate",
    duration: "45–60 min",
    exercises: ["Deadlift", "Pull-Up", "Barbell Row", "Lat Pulldown", "Face Pull", "Barbell Curl"],
    description: "Back and biceps focused session. Pairs perfectly with Push and Legs days.",
  },
  {
    id: "3",
    name: "Legs",
    category: "Split",
    difficulty: "Intermediate",
    duration: "50–65 min",
    exercises: ["Barbell Squat", "Leg Press", "Romanian Deadlift", "Walking Lunge", "Calf Raise", "Leg Curl"],
    description: "Complete lower body session hitting quads, hamstrings, glutes, and calves.",
  },
  {
    id: "4",
    name: "Upper",
    category: "Split",
    difficulty: "Intermediate",
    duration: "50–60 min",
    exercises: ["Barbell Bench Press", "Barbell Row", "Overhead Press", "Pull-Up", "Lateral Raise", "Hammer Curl"],
    description: "All upper body muscles in one session. Ideal for an Upper/Lower split.",
  },
  {
    id: "5",
    name: "Lower",
    category: "Split",
    difficulty: "Intermediate",
    duration: "45–55 min",
    exercises: ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Walking Lunge", "Hip Thrust", "Calf Raise"],
    description: "Focused lower body hypertrophy. Pairs with the Upper template.",
  },
  {
    id: "6",
    name: "Full Body",
    category: "Full Body",
    difficulty: "Beginner",
    duration: "40–55 min",
    exercises: ["Barbell Squat", "Barbell Bench Press", "Barbell Row", "Overhead Press", "Plank", "Walking Lunge"],
    description: "Hit every major muscle group in one efficient session. Perfect for beginners or 3x/week schedules.",
  },
  {
    id: "7",
    name: "Calisthenics Beginner",
    category: "Calisthenics",
    difficulty: "Beginner",
    duration: "30–40 min",
    exercises: ["Push-Up", "Plank", "Bodyweight Squat", "Inverted Row", "Glute Bridge", "Dead Hang"],
    description: "Foundation bodyweight movements. No equipment needed. Build strength and body control.",
  },
  {
    id: "8",
    name: "Calisthenics Intermediate",
    category: "Calisthenics",
    difficulty: "Intermediate",
    duration: "40–50 min",
    exercises: ["Pull-Up", "Dip", "Pike Push-Up", "Pistol Squat Progression", "L-Sit Hold", "Hanging Leg Raise"],
    description: "Progress beyond basics with pulling, pushing, and core control. Requires a bar and dip station.",
  },
  {
    id: "9",
    name: "Calisthenics Advanced",
    category: "Calisthenics",
    difficulty: "Advanced",
    duration: "50–65 min",
    exercises: ["Muscle-Up", "Handstand Push-Up", "Front Lever Hold", "Planche Lean", "Hanging Leg Raise", "Pistol Squat"],
    description: "High-skill movements for experienced athletes. Requires significant strength and mobility.",
  },
];
