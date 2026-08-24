"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTrainingStats, computePersonalRecords, loadSessions, getActiveSession } from "@/lib/training-store";
import type { WorkoutSession, PersonalRecord } from "@/data/training-sessions";

export default function TrainingPage() {
  const [stats, setStats] = useState({ workoutsThisWeek: 0, currentStreak: 0, lastWorkout: null as WorkoutSession | null, totalTrainingTime: 0, totalSessions: 0 });
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStats(getTrainingStats());
    setRecords(computePersonalRecords().slice(0, 5));
    setRecentSessions(loadSessions().filter((s) => s.status === "Completed").slice(0, 5));
    setActiveSession(getActiveSession());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Training</h1>
          <p className="mt-1 text-sm text-zinc-500">Track workouts, view history, and beat your records.</p>
        </div>
        <Link href="/training/start" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
          Start Workout
        </Link>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <Link href="/training/start" className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">Workout In Progress</p>
            <p className="text-xs text-amber-700">{activeSession.workoutName}</p>
          </div>
          <span className="rounded-lg bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">Resume</span>
        </Link>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{stats.workoutsThisWeek}</p>
          <p className="text-xs text-zinc-400">This Week</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{stats.currentStreak}</p>
          <p className="text-xs text-zinc-400">Day Streak</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{stats.totalSessions}</p>
          <p className="text-xs text-zinc-400">Total Workouts</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{Math.round(stats.totalTrainingTime / 60)}h</p>
          <p className="text-xs text-zinc-400">Training Time</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/training/start" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-zinc-900">Start Workout</p>
          <p className="text-xs text-zinc-400">Begin a training session</p>
        </Link>
        <Link href="/training/history" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-zinc-900">Training History</p>
          <p className="text-xs text-zinc-400">View past sessions</p>
        </Link>
        <Link href="/workouts" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-zinc-900">My Workouts</p>
          <p className="text-xs text-zinc-400">Manage routines</p>
        </Link>
      </div>

      {/* Personal Records */}
      {records.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">Personal Records</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((pr) => (
              <div key={pr.exerciseId} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-sm font-bold">PR</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate">{pr.exerciseName}</p>
                  <p className="text-[10px] text-zinc-400">
                    {pr.highestWeight > 0 ? `${pr.highestWeight} kg` : ""}{pr.highestWeight > 0 && pr.mostReps > 0 ? " · " : ""}{pr.mostReps > 0 ? `${pr.mostReps} reps` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">Recent Sessions</p>
          <Link href="/training/history" className="text-xs font-medium text-zinc-500 hover:text-zinc-900">View all</Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">No sessions completed yet. Start your first workout!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {recentSessions.map((s) => (
              <Link key={s.id} href={`/training/session/${s.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{s.workoutName}</p>
                  <p className="text-xs text-zinc-400">{s.date} · {s.durationMinutes} min</p>
                </div>
                <span className="text-xs text-zinc-400">{s.exerciseLogs.length} exercises</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
