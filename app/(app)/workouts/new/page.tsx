"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkoutsDict = ReturnType<typeof useDictionary>["dict"]["workouts"];

type WorkoutGoal = "Fat Loss" | "Muscle Gain" | "Strength" | "Endurance" | "Mobility" | "General Fitness";
type WorkoutDifficulty = "Beginner" | "Intermediate" | "Advanced";
type DayName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

// Localized display label for a goal value (value stays the logic/DB key).
function goalLabel(g: WorkoutGoal, w: WorkoutsDict): string {
  switch (g) {
    case "Fat Loss":        return w.goalFatLoss;
    case "Muscle Gain":     return w.goalMuscleGain;
    case "Strength":        return w.goalStrength;
    case "Endurance":       return w.goalEndurance;
    case "Mobility":        return w.goalMobility;
    case "General Fitness": return w.goalGeneralFitness;
  }
}

// Localized display label for a difficulty value (value stays the logic/DB key).
function difficultyLabel(d: WorkoutDifficulty, w: WorkoutsDict): string {
  switch (d) {
    case "Beginner":     return w.difficultyBeginner;
    case "Intermediate": return w.difficultyIntermediate;
    case "Advanced":     return w.difficultyAdvanced;
  }
}

interface ExerciseOption {
  id: string;
  name: string;
}

interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string;
}

interface WorkoutDay {
  dayName: DayName;
  exercises: WorkoutExercise[];
}

const WORKOUT_GOALS: WorkoutGoal[] = ["Fat Loss", "Muscle Gain", "Strength", "Endurance", "Mobility", "General Fitness"];
const WORKOUT_DIFFICULTIES: WorkoutDifficulty[] = ["Beginner", "Intermediate", "Advanced"];
const DAY_NAMES: DayName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewWorkoutPage() {
  const router = useRouter();
  const { dict } = useDictionary();
  const nt = dict.workouts.new;
  const w = dict.workouts;
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState<WorkoutGoal>("General Fitness");
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>("Beginner");
  const [duration, setDuration] = useState("45");
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [error, setError] = useState("");

  // Add day state
  const [selectedDay, setSelectedDay] = useState<DayName>("Monday");

  // Add exercise state
  const [addingDayIdx, setAddingDayIdx] = useState<number | null>(null);
  const [addExId, setAddExId] = useState("");
  const [addSets, setAddSets] = useState("3");
  const [addReps, setAddReps] = useState("10");
  const [addRest, setAddRest] = useState("60");
  const [addNotes, setAddNotes] = useState("");

  // ── Load exercises from Supabase ──────────────────────────────────────────

  useEffect(() => {
    async function loadExercises() {
      const supabase = createClient();
      const { data } = await supabase
        .from("exercises")
        .select("id, name")
        .order("name");

      if (data) {
        setExercises(data);
      }
      setLoading(false);
    }
    loadExercises();
  }, []);

  // ── Day Management ────────────────────────────────────────────────────────

  function handleAddDay() {
    if (workoutDays.some((d) => d.dayName === selectedDay)) return;
    setWorkoutDays([...workoutDays, { dayName: selectedDay, exercises: [] }]);
  }

  function handleRemoveDay(idx: number) {
    setWorkoutDays(workoutDays.filter((_, i) => i !== idx));
  }

  // ── Exercise Management ───────────────────────────────────────────────────

  function handleAddExercise(dayIdx: number) {
    if (!addExId) return;
    const ex = exercises.find((e) => e.id === addExId);
    if (!ex) return;

    const newEx: WorkoutExercise = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: parseInt(addSets) || 3,
      reps: parseInt(addReps) || 10,
      restSeconds: parseInt(addRest) || 60,
      notes: addNotes.trim(),
    };

    setWorkoutDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, exercises: [...d.exercises, newEx] } : d))
    );
    setAddExId("");
    setAddSets("3");
    setAddReps("10");
    setAddRest("60");
    setAddNotes("");
    setAddingDayIdx(null);
  }

  function handleRemoveExercise(dayIdx: number, exIdx: number) {
    setWorkoutDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d))
    );
  }

  // ── Save to Supabase ──────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError(nt.errorNameRequired); return; }
    if (workoutDays.length === 0) { setError(nt.errorAddDay); return; }

    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(dict.common.errorNotAuthenticated);
      setSaving(false);
      return;
    }

    // 1. Create workout
    const { data: workout, error: workoutErr } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        goal,
        difficulty,
        duration: parseInt(duration) || 45,
        is_template: false,
      })
      .select("id")
      .single();

    if (workoutErr || !workout) {
      setError(nt.errorCreating.replace("{msg}", workoutErr?.message || "unknown"));
      setSaving(false);
      return;
    }

    // 2. Create workout_days + workout_exercises
    for (let dayIdx = 0; dayIdx < workoutDays.length; dayIdx++) {
      const day = workoutDays[dayIdx];

      const { data: newDay, error: dayErr } = await supabase
        .from("workout_days")
        .insert({
          workout_id: workout.id,
          user_id: user.id,
          day_name: day.dayName,
          sort_order: dayIdx,
        })
        .select("id")
        .single();

      if (dayErr || !newDay) {
        setError(nt.errorCreatingDay.replace("{msg}", dayErr?.message || "unknown"));
        setSaving(false);
        return;
      }

      // Insert exercises for this day
      if (day.exercises.length > 0) {
        const exerciseInserts = day.exercises.map((ex, exIdx) => ({
          workout_day_id: newDay.id,
          user_id: user.id,
          exercise_id: ex.exerciseId,
          exercise_name: ex.exerciseName,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.restSeconds,
          notes: ex.notes || null,
          sort_order: exIdx,
        }));

        const { error: exErr } = await supabase
          .from("workout_exercises")
          .insert(exerciseInserts);

        if (exErr) {
          setError(nt.errorSavingExercises.replace("{msg}", exErr.message));
          setSaving(false);
          return;
        }
      }
    }

    // Success — redirect to workouts list
    router.push("/workouts");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageLoader text={nt.loading} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{nt.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{nt.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-xs font-medium text-red-700" role="alert">{error}</p>}

        {/* Basic info */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{nt.details}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="w-name" className="text-sm font-medium text-zinc-700">{nt.name}</label>
              <input id="w-name" type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder={nt.namePlaceholder}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="w-goal" className="text-sm font-medium text-zinc-700">{nt.goal}</label>
              <select id="w-goal" value={goal} onChange={(e) => setGoal(e.target.value as WorkoutGoal)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {WORKOUT_GOALS.map((g) => <option key={g} value={g}>{goalLabel(g, w)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="w-diff" className="text-sm font-medium text-zinc-700">{nt.difficulty}</label>
              <select id="w-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as WorkoutDifficulty)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {WORKOUT_DIFFICULTIES.map((d) => <option key={d} value={d}>{difficultyLabel(d, w)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="w-dur" className="text-sm font-medium text-zinc-700">{nt.durationMin}</label>
              <input id="w-dur" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={5} max={180}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="w-desc" className="text-sm font-medium text-zinc-700">{nt.description}</label>
              <input id="w-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={nt.descriptionPlaceholder}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
          </div>
        </div>

        {/* Workout Days */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">{nt.workoutDays}</p>
            <div className="flex gap-2">
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayName)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {DAY_NAMES.filter((d) => !workoutDays.some((wd) => wd.dayName === d)).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button type="button" onClick={handleAddDay}
                className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover">
                {nt.addDay}
              </button>
            </div>
          </div>

          {workoutDays.length === 0 ? (
            <p className="text-xs text-zinc-400">{nt.noDays}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {workoutDays.map((day, dayIdx) => (
                <div key={day.dayName} className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-700">{day.dayName}</p>
                    <button type="button" onClick={() => handleRemoveDay(dayIdx)} className="text-xs text-red-400 hover:text-red-600">{nt.removeDay}</button>
                  </div>

                  {/* Exercises list */}
                  {day.exercises.length > 0 && (
                    <div className="mb-3 flex flex-col gap-1">
                      {day.exercises.map((ex, exIdx) => (
                        <div key={exIdx} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-xs">
                          <span className="font-medium text-zinc-800">{ex.exerciseName}</span>
                          <span className="text-zinc-400">{ex.sets}×{ex.reps} · {ex.restSeconds}s rest</span>
                          <button type="button" onClick={() => handleRemoveExercise(dayIdx, exIdx)} className="text-red-400 hover:text-red-600">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add exercise */}
                  {addingDayIdx === dayIdx ? (
                    <div className="flex flex-wrap items-end gap-2 rounded-md bg-white p-3">
                      <div className="flex flex-col gap-1 min-w-[160px] flex-1">
                        <label className="text-xs text-zinc-400">{nt.exercise}</label>
                        <select value={addExId} onChange={(e) => setAddExId(e.target.value)}
                          className="h-8 w-full rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200">
                          <option value="">{nt.selectPlaceholder}</option>
                          {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 w-14">
                        <label className="text-xs text-zinc-400">{nt.sets}</label>
                        <input type="number" value={addSets} onChange={(e) => setAddSets(e.target.value)} min={1}
                          className="h-8 w-full rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                      </div>
                      <div className="flex flex-col gap-1 w-14">
                        <label className="text-xs text-zinc-400">{nt.reps}</label>
                        <input type="number" value={addReps} onChange={(e) => setAddReps(e.target.value)} min={1}
                          className="h-8 w-full rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                      </div>
                      <div className="flex flex-col gap-1 w-16">
                        <label className="text-xs text-zinc-400">{nt.restS}</label>
                        <input type="number" value={addRest} onChange={(e) => setAddRest(e.target.value)} min={0}
                          className="h-8 w-full rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                        <label className="text-xs text-zinc-400">{nt.notes}</label>
                        <input type="text" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder={dict.common.optional}
                          className="h-8 w-full rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                      </div>
                      <button type="button" onClick={() => handleAddExercise(dayIdx)} className="h-8 rounded bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-hover">{dict.common.add}</button>
                      <button type="button" onClick={() => setAddingDayIdx(null)} className="h-8 text-xs text-zinc-400 hover:text-zinc-700">{dict.common.cancel}</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAddingDayIdx(dayIdx)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">
                      {nt.addExercise}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">
            {saving ? nt.creating : nt.createWorkout}
          </button>
          <button type="button" onClick={() => router.push("/workouts")} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            {dict.common.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}
