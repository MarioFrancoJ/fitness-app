"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadWorkouts } from "@/lib/workouts-store";
import { addSession, getActiveSession, saveActiveSession } from "@/lib/training-store";
import type { Workout } from "@/data/workouts";
import type { WorkoutSession, ExerciseLog, SetLog } from "@/data/training-sessions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function createSession(workout: Workout): WorkoutSession {
  const exerciseLogs: ExerciseLog[] = [];
  for (const day of workout.workoutDays) {
    for (const ex of day.exercises) {
      exerciseLogs.push({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNumber: i + 1,
          targetReps: ex.reps,
          completedReps: 0,
          targetWeight: 0,
          completedWeight: 0,
          completed: false,
          notes: ex.notes || "",
        })),
      });
    }
  }

  return {
    id: crypto.randomUUID(),
    workoutId: workout.id,
    workoutName: workout.name,
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toISOString(),
    endTime: null,
    durationMinutes: 0,
    status: "In Progress",
    exerciseLogs,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrainingStartPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);

  // Rest timer
  const [restTime, setRestTime] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restTarget, setRestTarget] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Session timer
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const active = getActiveSession();
    if (active) {
      setSession(active);
      const start = new Date(active.startTime).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }
    setWorkouts(loadWorkouts());
    setHydrated(true);
  }, []);

  // Session elapsed timer
  useEffect(() => {
    if (session && session.status === "In Progress") {
      elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
    }
  }, [session]);

  // Rest timer
  useEffect(() => {
    if (restRunning && restTime > 0) {
      timerRef.current = setTimeout(() => setRestTime((t) => t - 1), 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    } else if (restRunning && restTime <= 0) {
      setRestRunning(false);
    }
  }, [restRunning, restTime]);

  // ── Actions ────────────────────────────────────────────────────────────────

  function handleSelectWorkout(workout: Workout) {
    const newSession = createSession(workout);
    setSession(newSession);
    saveActiveSession(newSession);
    setCurrentExIdx(0);
    setElapsed(0);
  }

  const persistSession = useCallback((s: WorkoutSession) => {
    setSession(s);
    saveActiveSession(s);
  }, []);

  function handleSetComplete(exIdx: number, setIdx: number, reps: number, weight: number) {
    if (!session) return;
    const updated = { ...session, exerciseLogs: session.exerciseLogs.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return { ...ex, sets: ex.sets.map((set, si) => {
        if (si !== setIdx) return set;
        return { ...set, completedReps: reps, completedWeight: weight, completed: true };
      })};
    })};
    persistSession(updated);

    // Start rest timer
    setRestTarget(60);
    setRestTime(60);
    setRestRunning(true);
  }

  function handleSetUndo(exIdx: number, setIdx: number) {
    if (!session) return;
    const updated = { ...session, exerciseLogs: session.exerciseLogs.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return { ...ex, sets: ex.sets.map((set, si) => {
        if (si !== setIdx) return set;
        return { ...set, completed: false };
      })};
    })};
    persistSession(updated);
  }

  function handleFinish() {
    if (!session) return;
    const endTime = new Date().toISOString();
    const durationMinutes = Math.round(elapsed / 60);
    const completed: WorkoutSession = { ...session, endTime, durationMinutes, status: "Completed" };
    addSession(completed);
    saveActiveSession(null);
    router.push(`/training/session/${completed.id}`);
  }

  function handleCancel() {
    if (!session) return;
    const cancelled: WorkoutSession = { ...session, endTime: new Date().toISOString(), durationMinutes: Math.round(elapsed / 60), status: "Cancelled" };
    addSession(cancelled);
    saveActiveSession(null);
    router.push("/training");
  }

  if (!hydrated) return null;

  // ── Workout selection screen ───────────────────────────────────────────────
  if (!session) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Start Workout</h1>
          <p className="mt-1 text-sm text-zinc-500">Select a workout to begin your training session.</p>
        </div>

        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
            <p className="mb-1 text-base font-semibold text-zinc-900">No workouts created</p>
            <p className="mb-6 text-sm text-zinc-500">Create a workout first to start training.</p>
            <Link href="/workouts/new" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
              Create Workout
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workouts.map((w) => {
              const totalEx = w.workoutDays.reduce((s, d) => s + d.exercises.length, 0);
              return (
                <button key={w.id} type="button" onClick={() => handleSelectWorkout(w)}
                  className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md">
                  <p className="text-sm font-semibold text-zinc-900">{w.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">{w.goal} · {totalEx} exercises · {w.duration} min</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Execution screen ───────────────────────────────────────────────────────
  const currentEx = session.exerciseLogs[currentExIdx];
  const totalSets = session.exerciseLogs.reduce((s, e) => s + e.sets.length, 0);
  const completedSets = session.exerciseLogs.reduce((s, e) => s + e.sets.filter((set) => set.completed).length, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">{session.workoutName}</h1>
          <p className="text-xs text-zinc-400">Session: {formatTime(elapsed)}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleCancel} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Cancel</button>
          <button type="button" onClick={handleFinish} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Finish</button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
          <span>{completedSets} / {totalSets} sets</span>
          <span>{Math.round((completedSets / totalSets) * 100) || 0}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${(completedSets / totalSets) * 100}%` }} />
        </div>
      </div>

      {/* Rest timer */}
      {restRunning && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div>
            <p className="text-sm font-semibold text-blue-900">Rest Timer</p>
            <p className="text-2xl font-bold text-blue-700">{formatTime(restTime)}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRestRunning(false)} className="rounded-md bg-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">Pause</button>
            <button type="button" onClick={() => { setRestRunning(false); setRestTime(0); }} className="rounded-md bg-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">Skip</button>
          </div>
        </div>
      )}

      {/* Exercise tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-1">
        {session.exerciseLogs.map((ex, i) => {
          const done = ex.sets.every((s) => s.completed);
          return (
            <button key={i} type="button" onClick={() => setCurrentExIdx(i)}
              className={[
                "shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                currentExIdx === i ? "bg-zinc-900 text-white" : done ? "bg-emerald-100 text-emerald-700" : "text-zinc-500 hover:text-zinc-900",
              ].join(" ")}>
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Current exercise */}
      {currentEx && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">{currentEx.exerciseName}</p>
              <p className="text-xs text-zinc-400">Exercise {currentExIdx + 1} of {session.exerciseLogs.length}</p>
            </div>
            <div className="flex gap-2">
              {currentExIdx > 0 && (
                <button type="button" onClick={() => setCurrentExIdx((i) => i - 1)} className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50">Prev</button>
              )}
              {currentExIdx < session.exerciseLogs.length - 1 && (
                <button type="button" onClick={() => setCurrentExIdx((i) => i + 1)} className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50">Next</button>
              )}
            </div>
          </div>

          {/* Sets table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="pb-2 text-xs font-semibold text-zinc-400">Set</th>
                  <th className="pb-2 text-xs font-semibold text-zinc-400">Target</th>
                  <th className="pb-2 text-xs font-semibold text-zinc-400">Reps</th>
                  <th className="pb-2 text-xs font-semibold text-zinc-400">Weight (kg)</th>
                  <th className="pb-2 text-xs font-semibold text-zinc-400">Done</th>
                </tr>
              </thead>
              <tbody>
                {currentEx.sets.map((set, si) => (
                  <SetRow key={si} set={set} exIdx={currentExIdx} setIdx={si} onComplete={handleSetComplete} onUndo={handleSetUndo} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Set Row Component ─────────────────────────────────────────────────────────

function SetRow({ set, exIdx, setIdx, onComplete, onUndo }: {
  set: SetLog; exIdx: number; setIdx: number;
  onComplete: (exIdx: number, setIdx: number, reps: number, weight: number) => void;
  onUndo: (exIdx: number, setIdx: number) => void;
}) {
  const [reps, setReps] = useState(set.completedReps || set.targetReps);
  const [weight, setWeight] = useState(set.completedWeight || set.targetWeight);

  return (
    <tr className={`border-b border-zinc-50 ${set.completed ? "bg-emerald-50/50" : ""}`}>
      <td className="py-2 text-zinc-600">{set.setNumber}</td>
      <td className="py-2 text-zinc-400">{set.targetReps} reps</td>
      <td className="py-2">
        <input type="number" value={reps} onChange={(e) => setReps(parseInt(e.target.value) || 0)} min={0}
          disabled={set.completed}
          className="h-7 w-14 rounded border border-zinc-200 px-2 text-xs text-zinc-900 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-zinc-300" />
      </td>
      <td className="py-2">
        <input type="number" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} min={0} step={0.5}
          disabled={set.completed}
          className="h-7 w-16 rounded border border-zinc-200 px-2 text-xs text-zinc-900 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-zinc-300" />
      </td>
      <td className="py-2">
        {set.completed ? (
          <button type="button" onClick={() => onUndo(exIdx, setIdx)} className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
            ✓ Done
          </button>
        ) : (
          <button type="button" onClick={() => onComplete(exIdx, setIdx, reps, weight)} className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-200">
            Complete
          </button>
        )}
      </td>
    </tr>
  );
}
