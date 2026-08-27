"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SkeletonDashboard } from "@/components/ui/Skeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile { name: string; fitnessGoal: string; }
interface QuickStats { lastWeight: number | null; caloriesToday: number; proteinToday: number; workoutsThisWeek: number; }
interface TodayFocus { hasWorkout: boolean; workoutName: string | null; exerciseCount: number; workoutId: string | null; }
interface WeeklyProgress { workoutsCompleted: number; workoutsGoal: number; avgCalories: number; caloriesTarget: number; weightChange: number | null; }
interface ActivityItem { id: string; type: "workout" | "meal" | "weight"; title: string; timestamp: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function activityIcon(type: string): string {
  switch (type) { case "workout": return "💪"; case "meal": return "🥗"; case "weight": return "⚖️"; default: return "📋"; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [focus, setFocus] = useState<TodayFocus | null>(null);
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const { data: profileData } = await supabase.from("users").select("name, fitness_goal").eq("id", user.id).single();
      if (profileData) setProfile({ name: profileData.name || "User", fitnessGoal: profileData.fitness_goal || "" });

      const { data: weightData } = await supabase.from("weight_entries").select("weight_kg").eq("user_id", user.id).order("date", { ascending: false }).limit(1).maybeSingle();
      const { data: mealsToday } = await supabase.from("meal_logs").select("calories, protein").eq("date", today);
      const { data: weekSessions } = await supabase.from("training_sessions").select("id, date, status").eq("user_id", user.id).eq("status", "Completed").gte("date", weekAgo);

      setStats({
        lastWeight: weightData?.weight_kg ?? null,
        caloriesToday: mealsToday?.reduce((s, m) => s + m.calories, 0) ?? 0,
        proteinToday: mealsToday?.reduce((s, m) => s + m.protein, 0) ?? 0,
        workoutsThisWeek: weekSessions?.length ?? 0,
      });

      const { data: nextWorkout } = await supabase.from("workouts").select("id, name, workout_days(workout_exercises(id))").eq("user_id", user.id).eq("is_template", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (nextWorkout) {
        const exerciseCount = (nextWorkout.workout_days || []).reduce((sum: number, day: any) => sum + (day.workout_exercises?.length || 0), 0);
        setFocus({ hasWorkout: true, workoutName: nextWorkout.name, exerciseCount, workoutId: nextWorkout.id });
      } else {
        setFocus({ hasWorkout: false, workoutName: null, exerciseCount: 0, workoutId: null });
      }

      const { data: weekMeals } = await supabase.from("meal_logs").select("calories, date").gte("date", weekAgo);
      const daysWithMeals = new Set(weekMeals?.map((m) => m.date) || []).size || 1;
      const totalWeekCals = weekMeals?.reduce((s, m) => s + m.calories, 0) ?? 0;
      const { data: recentWeights } = await supabase.from("weight_entries").select("weight_kg").eq("user_id", user.id).order("date", { ascending: false }).limit(2);
      let weightChange: number | null = null;
      if (recentWeights && recentWeights.length >= 2) weightChange = Math.round((recentWeights[0].weight_kg - recentWeights[1].weight_kg) * 10) / 10;
      setWeekly({ workoutsCompleted: weekSessions?.length ?? 0, workoutsGoal: 4, avgCalories: Math.round(totalWeekCals / daysWithMeals), caloriesTarget: 2200, weightChange });

      const activities: ActivityItem[] = [];
      const { data: recentSessions } = await supabase.from("training_sessions").select("id, workout_name, start_time, status").eq("user_id", user.id).eq("status", "Completed").order("start_time", { ascending: false }).limit(4);
      if (recentSessions) for (const s of recentSessions) activities.push({ id: `s-${s.id}`, type: "workout", title: `Completed ${s.workout_name || "Workout"}`, timestamp: s.start_time });
      const { data: recentMeals } = await supabase.from("meal_logs").select("id, name, created_at").order("created_at", { ascending: false }).limit(4);
      if (recentMeals) for (const m of recentMeals) activities.push({ id: `m-${m.id}`, type: "meal", title: `Logged ${m.name}`, timestamp: m.created_at });
      const { data: recentWeightEntries } = await supabase.from("weight_entries").select("id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(2);
      if (recentWeightEntries) for (const w of recentWeightEntries) activities.push({ id: `w-${w.id}`, type: "weight", title: "Added Weight Entry", timestamp: w.created_at });
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivity(activities.slice(0, 8));

      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="flex flex-col gap-5">

      {/* ═══════ 1. HEADER — Single primary CTA ═══════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {getGreeting()}, {profile?.name || "User"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            {profile?.fitnessGoal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">🎯 {profile.fitnessGoal}</span>
            )}
            <span>{formatDate()}</span>
          </div>
        </div>
        <Link href="/training/start" className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 sm:self-start">
          💪 Start Workout
        </Link>
      </div>

      {/* ═══════ 2. QUICK ACTIONS BAR — secondary, below header ═══════ */}
      <div className="flex items-center gap-2">
        <Link href="/nutrition" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
          🥗 Log Meal
        </Link>
        <Link href="/progress/new" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
          ⚖️ Log Weight
        </Link>
        <Link href="/progress/photos/upload" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
          📸 Upload Photo
        </Link>
      </div>

      {/* ═══════ 3. QUICK STATS — contextual links when empty ═══════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Weight" value={stats?.lastWeight ? `${stats.lastWeight} kg` : null} emptyAction="Add weight" emptyHref="/progress/new" icon="⚖️" />
        <StatCard label="Calories" value={stats?.caloriesToday ? `${stats.caloriesToday} kcal` : null} emptyAction="Log calories" emptyHref="/nutrition" icon="🔥" />
        <StatCard label="Protein" value={stats?.proteinToday ? `${stats.proteinToday}g` : null} emptyAction="Log meal" emptyHref="/nutrition" icon="🥩" />
        <StatCard label="Workouts" value={`${stats?.workoutsThisWeek ?? 0} this week`} icon="💪" />
      </div>

      {/* ═══════ 4. TODAY'S FOCUS + WEEKLY PROGRESS ═══════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Focus */}
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Today&apos;s Focus</p>
          {focus?.hasWorkout ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-zinc-900">{focus.workoutName}</p>
                <p className="text-xs text-zinc-500">{focus.exerciseCount} exercise{focus.exerciseCount !== 1 ? "s" : ""}</p>
              </div>
              <Link href="/training/start" className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
                Start {focus.workoutName && focus.workoutName.length <= 20 ? focus.workoutName : "Workout"}
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-500">No workout scheduled</p>
              <Link href="/workouts/new" className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                Create Workout
              </Link>
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">This Week</p>
          <div className="flex flex-col gap-2.5">
            <ProgressBar label="Workouts" current={weekly?.workoutsCompleted ?? 0} target={weekly?.workoutsGoal ?? 4} unit="" color="bg-blue-500" />
            <ProgressBar label="Avg Calories" current={weekly?.avgCalories ?? 0} target={weekly?.caloriesTarget ?? 2200} unit="kcal" color="bg-amber-500" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Weight Δ</span>
              {weekly?.weightChange !== null && weekly?.weightChange !== undefined ? (
                <span className={`text-xs font-bold ${weekly.weightChange < 0 ? "text-emerald-600" : weekly.weightChange > 0 ? "text-red-500" : "text-zinc-600"}`}>
                  {weekly.weightChange > 0 ? "+" : ""}{weekly.weightChange} kg
                </span>
              ) : (
                <Link href="/progress/new" className="text-xs text-zinc-400 transition-colors hover:text-zinc-700">Add weight →</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ 5. RECENT ACTIVITY (no duplication with actions above) ═══════ */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-3">
          <p className="text-sm font-semibold text-zinc-900">Recent Activity</p>
        </div>
        {activity.length === 0 ? (
          <div className="px-5 py-4">
            <p className="text-sm text-zinc-400">No activity yet — complete a workout or log a meal to see it here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs">{activityIcon(item.type)}</span>
                <p className="flex-1 min-w-0 truncate text-sm text-zinc-700">{item.title}</p>
                <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(item.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, emptyAction, emptyHref }: { label: string; value: string | null; icon: string; emptyAction?: string; emptyHref?: string }) {
  const isEmpty = !value && emptyAction && emptyHref;

  const content = (
    <div className={["flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-sm transition-colors", isEmpty ? "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer" : "border-zinc-200"].join(" ")}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
        {value ? (
          <p className="mt-0.5 truncate text-sm font-bold text-zinc-900">{value}</p>
        ) : emptyAction ? (
          <p className="mt-0.5 text-xs font-medium text-blue-600">{emptyAction} →</p>
        ) : (
          <p className="mt-0.5 text-xs text-zinc-400">—</p>
        )}
      </div>
    </div>
  );

  if (isEmpty) {
    return <Link href={emptyHref!}>{content}</Link>;
  }

  return content;
}

function ProgressBar({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-xs text-zinc-600">{label}</span>
        <span className="text-[11px] font-semibold text-zinc-700">{current}{unit ? ` ${unit}` : ""} / {target}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
