"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { exercises } from "@/data/exercises";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitnessapp_workouts";

function loadWorkouts(): Workout[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWorkouts(workouts: Workout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkoutBuilderPage() {
  const [workoutName, setWorkoutName] = useState("My Workout");
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);

  useEffect(() => {
    setHistory(loadWorkouts());
  }, []);

  function handleAddExercise(exerciseId: string) {
    const ex = exercises.find((e) => e.id === exerciseId);
    if (!ex) return;

    const newExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: ex.id,
      name: ex.name,
      sets: [{ id: `${Date.now()}-1`, reps: 10, weight: 0 }],
    };

    setSelectedExercises((prev) => [...prev, newExercise]);
  }

  function handleRemoveExercise(id: string) {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAddSet(exerciseId: string) {
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: [...ex.sets, { id: `${Date.now()}`, reps: 10, weight: 0 }],
        };
      })
    );
  }

  function handleRemoveSet(exerciseId: string, setId: string) {
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
      })
    );
  }

  function handleSetChange(exerciseId: string, setId: string, field: "reps" | "weight", value: number) {
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        };
      })
    );
  }

  function handleSave() {
    if (selectedExercises.length === 0) return;

    const workout: Workout = {
      id: Date.now().toString(),
      name: workoutName.trim() || "My Workout",
      exercises: selectedExercises,
      createdAt: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    const updated = [workout, ...history];
    setHistory(updated);
    saveWorkouts(updated);
    setSelectedExercises([]);
    setWorkoutName("My Workout");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Workout Builder</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Build a workout by selecting exercises and configuring sets and reps.
        </p>
      </div>

      {/* Workout name */}
      <div className="flex items-end gap-4">
        <div className="w-64">
          <label htmlFor="workout-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Workout Name
          </label>
          <input
            id="workout-name"
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        {/* Add exercise dropdown */}
        <div className="w-64">
          <label htmlFor="add-exercise" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Add Exercise
          </label>
          <select
            id="add-exercise"
            value=""
            onChange={(e) => {
              handleAddExercise(e.target.value);
              e.target.value = "";
            }}
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          >
            <option value="" disabled>Select an exercise...</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscleGroup})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected exercises */}
      {selectedExercises.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="text-sm text-zinc-400">No exercises added yet. Select one above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {selectedExercises.map((ex, exIndex) => (
            <div key={ex.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                    {exIndex + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-900">{ex.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(ex.id)}
                  className="text-xs font-medium text-zinc-400 transition-colors hover:text-red-600"
                >
                  Remove
                </button>
              </div>

              {/* Sets table */}
              <div className="overflow-hidden rounded-lg border border-zinc-100">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Set</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Reps</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Weight (kg)</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {ex.sets.map((set, setIndex) => (
                      <tr key={set.id}>
                        <td className="px-4 py-2 font-medium text-zinc-700">{setIndex + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={set.reps}
                            onChange={(e) => handleSetChange(ex.id, set.id, "reps", parseInt(e.target.value) || 0)}
                            className="h-8 w-16 rounded border border-zinc-200 px-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-200"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            max={500}
                            step={2.5}
                            value={set.weight}
                            onChange={(e) => handleSetChange(ex.id, set.id, "weight", parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 rounded border border-zinc-200 px-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-200"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(ex.id, set.id)}
                              className="text-xs text-zinc-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => handleAddSet(ex.id)}
                className="mt-3 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                + Add Set
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      {selectedExercises.length > 0 && (
        <div className="flex items-center gap-4">
          <Button type="button" onClick={handleSave}>
            Save Workout
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600">✓ Workout saved</span>
          )}
        </div>
      )}

      {/* Saved workouts history */}
      {history.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-4">
            <p className="text-sm font-semibold text-zinc-700">
              Saved Workouts ({history.length})
            </p>
          </div>
          <ul className="divide-y divide-zinc-100">
            {history.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{w.name}</p>
                  <p className="text-xs text-zinc-400">
                    {w.exercises.length} exercise{w.exercises.length !== 1 ? "s" : ""} · {w.createdAt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
