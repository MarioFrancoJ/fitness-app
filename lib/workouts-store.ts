import { workoutTemplates, type Workout } from "@/data/workouts";

const WORKOUTS_KEY = "fitnessapp_workouts";
const TEMPLATES_KEY = "fitnessapp_workout_templates";

// ── User Workouts ─────────────────────────────────────────────────────────────

export function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: Workout[]) {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function addWorkout(workout: Omit<Workout, "id" | "createdAt">): Workout {
  const all = loadWorkouts();
  const newItem: Workout = { ...workout, id: crypto.randomUUID(), createdAt: new Date().toISOString().slice(0, 10) };
  saveWorkouts([newItem, ...all]);
  return newItem;
}

export function updateWorkout(id: string, data: Partial<Workout>) {
  const all = loadWorkouts();
  saveWorkouts(all.map((w) => (w.id === id ? { ...w, ...data } : w)));
}

export function deleteWorkout(id: string) {
  const all = loadWorkouts();
  saveWorkouts(all.filter((w) => w.id !== id));
}

export function getWorkoutById(id: string): Workout | undefined {
  return loadWorkouts().find((w) => w.id === id);
}

export function duplicateWorkout(id: string): Workout | undefined {
  const source = getWorkoutById(id);
  if (!source) return undefined;
  const dup: Workout = { ...source, id: crypto.randomUUID(), name: `${source.name} (Copy)`, createdAt: new Date().toISOString().slice(0, 10) };
  const all = loadWorkouts();
  saveWorkouts([dup, ...all]);
  return dup;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function loadTemplates(): Workout[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) return JSON.parse(raw);
    // Seed
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(workoutTemplates));
    return workoutTemplates;
  } catch {
    return workoutTemplates;
  }
}

export function saveTemplates(templates: Workout[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function addTemplate(template: Omit<Workout, "id" | "createdAt">): Workout {
  const all = loadTemplates();
  const newItem: Workout = { ...template, id: `tpl-${Date.now()}`, isTemplate: true, createdAt: new Date().toISOString().slice(0, 10) };
  saveTemplates([newItem, ...all]);
  return newItem;
}

export function deleteTemplate(id: string) {
  saveTemplates(loadTemplates().filter((t) => t.id !== id));
}

export function loadTemplateAsWorkout(templateId: string): Workout | undefined {
  const tpl = loadTemplates().find((t) => t.id === templateId);
  if (!tpl) return undefined;
  const workout: Workout = { ...tpl, id: crypto.randomUUID(), isTemplate: false, createdAt: new Date().toISOString().slice(0, 10) };
  const all = loadWorkouts();
  saveWorkouts([workout, ...all]);
  return workout;
}
