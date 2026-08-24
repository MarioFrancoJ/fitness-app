import { exercises as seedExercises, type Exercise } from "@/data/exercises";

const STORAGE_KEY = "fitnessapp_exercises";

export function loadExercises(): Exercise[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    // Seed on first load
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedExercises));
    return seedExercises;
  } catch {
    return seedExercises;
  }
}

export function saveExercises(exercises: Exercise[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
}

export function addExercise(exercise: Omit<Exercise, "id">): Exercise {
  const all = loadExercises();
  const newItem: Exercise = { ...exercise, id: Date.now().toString() };
  saveExercises([newItem, ...all]);
  return newItem;
}

export function updateExercise(id: string, data: Partial<Exercise>) {
  const all = loadExercises();
  const updated = all.map((e) => (e.id === id ? { ...e, ...data } : e));
  saveExercises(updated);
}

export function deleteExercise(id: string) {
  const all = loadExercises();
  saveExercises(all.filter((e) => e.id !== id));
}

export function getExerciseById(id: string): Exercise | undefined {
  const all = loadExercises();
  return all.find((e) => e.id === id);
}
