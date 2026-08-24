"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { generateRecommendations, saveCheckIn, getTodayCheckIn, type Recommendation, type DailyCheckIn, type RecommendationCategory } from "@/lib/ai-coach";
import { getTrainingStats } from "@/lib/training-store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryColor(c: RecommendationCategory): string {
  switch (c) {
    case "Nutrition":   return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Training":    return "bg-blue-50 text-blue-700 border-blue-200";
    case "Recovery":    return "bg-purple-50 text-purple-700 border-purple-200";
    case "Motivation":  return "bg-amber-50 text-amber-700 border-amber-200";
    case "Consistency": return "bg-teal-50 text-teal-700 border-teal-200";
  }
}

function categoryIcon(c: RecommendationCategory): string {
  switch (c) {
    case "Nutrition":   return "🥗";
    case "Training":    return "💪";
    case "Recovery":    return "😴";
    case "Motivation":  return "🔥";
    case "Consistency": return "📈";
  }
}

function priorityBorder(p: "high" | "medium" | "low"): string {
  switch (p) {
    case "high":   return "border-l-4 border-l-red-400";
    case "medium": return "border-l-4 border-l-amber-400";
    case "low":    return "border-l-4 border-l-emerald-400";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiCoachPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [checkIn, setCheckIn] = useState<DailyCheckIn | null>(null);
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [stress, setStress] = useState(4);
  const [motivation, setMotivation] = useState(7);
  const [checkInSaved, setCheckInSaved] = useState(false);
  const [stats, setStats] = useState({ workoutsThisWeek: 0, currentStreak: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const recs = generateRecommendations();
    setRecommendations(recs);

    const existing = getTodayCheckIn();
    if (existing) {
      setCheckIn(existing);
      setEnergy(existing.energyLevel);
      setSleep(existing.sleepQuality);
      setStress(existing.stressLevel);
      setMotivation(existing.motivationLevel);
      setCheckInSaved(true);
    }

    try {
      setStats(getTrainingStats());
    } catch {}

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(dismissToast, 3000);
      return () => clearTimeout(t);
    }
  }, [toast, dismissToast]);

  function handleCheckInSave() {
    const today = new Date().toISOString().slice(0, 10);
    const data: DailyCheckIn = { date: today, energyLevel: energy, sleepQuality: sleep, stressLevel: stress, motivationLevel: motivation };
    saveCheckIn(data);
    setCheckIn(data);
    setCheckInSaved(true);
    setToast("Check-in saved! Recommendations updated.");
    setRecommendations(generateRecommendations());
  }

  if (!hydrated) return null;

  // Today's focus: highest priority recommendation
  const todaysFocus = recommendations.find((r) => r.priority === "high") || recommendations[0];
  const weeklyGoal = stats.workoutsThisWeek < 3
    ? `Complete ${3 - stats.workoutsThisWeek} more workout${3 - stats.workoutsThisWeek > 1 ? "s" : ""} this week`
    : "Maintain your training consistency";

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI Coach</h1>
            <p className="mt-1 text-sm text-zinc-500">Personalized guidance based on your data.</p>
          </div>
          <Link href="/ai-coach/chat" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
            Chat with Coach
          </Link>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Today&apos;s Focus</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">{todaysFocus?.title || "Keep Going"}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Weekly Goal</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">{weeklyGoal}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Current Streak</p>
            <p className="mt-1 text-xl font-bold text-blue-600">{stats.currentStreak} <span className="text-xs font-normal text-zinc-400">days</span></p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">This Week</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{stats.workoutsThisWeek} <span className="text-xs font-normal text-zinc-400">workouts</span></p>
          </div>
        </div>

        {/* Daily Check-In */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">Daily Check-In</p>
            {checkInSaved && <span className="text-xs font-medium text-emerald-600">Saved today</span>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SliderField label="Energy Level" value={energy} onChange={setEnergy} disabled={checkInSaved} />
            <SliderField label="Sleep Quality" value={sleep} onChange={setSleep} disabled={checkInSaved} />
            <SliderField label="Stress Level" value={stress} onChange={setStress} disabled={checkInSaved} />
            <SliderField label="Motivation" value={motivation} onChange={setMotivation} disabled={checkInSaved} />
          </div>

          {!checkInSaved && (
            <button type="button" onClick={handleCheckInSave}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
              Save Check-In
            </button>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <p className="mb-3 text-sm font-semibold text-zinc-900">Recommendations</p>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${priorityBorder(rec.priority)}`}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-base">{categoryIcon(rec.category)}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryColor(rec.category)}`}>{rec.category}</span>
                </div>
                <p className="text-sm font-semibold text-zinc-900">{rec.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}

// ── Slider Field ──────────────────────────────────────────────────────────────

function SliderField({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-600">{label}</label>
        <span className="text-xs font-bold text-zinc-900">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
