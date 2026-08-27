"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string;
  fitnessGoal: string;
}

interface QuickStats {
  lastWeight: number | null;
  caloriesToday: number;
  proteinToday: number;
  workoutsThisWeek: number;
}

interface TodayFocus {
  hasWorkout: boolean;
  workoutName: string | null;
  exerciseCount: number;
  workoutId: string | null;
}

interface WeeklyProgress {
  workoutsCompleted: number;
  workoutsGoal: number;
  avgCalories: number;
  caloriesTarget: number;
  weightChange: number | null;
}

interface ActivityItem {
  id: string;
  type: "workout" | "meal" | "weight";
  title: string;
  timestamp: string;
}

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
  switch (type) {
    case "workout": return "💪";
    case "meal": return "🥗";
    case "weight": return "⚖️";
    default: return "📋";
  }
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

      // ── Profile ───────────────────────────────────────────────────────
      const { data: profileData } = await supabase
        .from("users")
        .select("name, fitness_goal")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({ name: profileData.name || "User", fitnessGoal: profileData.fitness_goal || "" });
      }

      // ── Quick Stats ───────────────────────────────────────────────────

      // Last weight
      const { data: weightData } = await supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Today's nutrition
      const { data: mealsToday } = await supabase
        .from("meal_logs")
        .select("calories, protein")
        .eq("date", today);

      // Workouts this week
      const { data: weekSessions } = await supabase
        .from("training_sessions")
        .select("id, date, status")
        .eq("user_id", user.id)
        .eq("status", "Completed")
        .gte("date", weekAgo);

      setStats({
        lastWeight: weightData?.weight_kg ?? null,
        caloriesToday: mealsToday?.reduce((s, m) => s + m.calories, 0) ?? 0,
        proteinToday: mealsToday?.reduce((s, m) => s + m.protein, 0) ?? 0,
        workoutsThisWeek: weekSessions?.length ?? 0,
      });

      // ── Today's Focus ─────────────────────────────────────────────────

      // Check for most recent workout (could be today's planned one)
      const { data: nextWorkout } = await supabase
        .from("workouts")
        .select("id, name, workout_days(workout_exercises(id))")
        .eq("user_id", user.id)
        .eq("is_template", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nextWorkout) {
        const exerciseCount = (nextWorkout.workout_days || []).reduce(
          (sum: number, day: any) => sum + (day.workout_exercises?.length || 0), 0
        );
        setFocus({ hasWorkout: true, workoutName: nextWorkout.name, exerciseCount, workoutId: nextWorkout.id });
      } else {
        setFocus({ hasWorkout: false, workoutName: null, exerciseCount: 0, workoutId: null });
      }

      // ── Weekly Progress ───────────────────────────────────────────────

      // Average calories this week
      const { data: weekMeals } = await supabase
        .from("meal_logs")
        .select("calories, date")
        .gte("date", weekAgo);

      const daysWithMeals = new Set(weekMeals?.map((m) => m.date) || []).size || 1;
      const totalWeekCals = weekMeals?.reduce((s, m) => s + m.calories, 0) ?? 0;

      // Weight change (last 2 entries)
      const { data: recentWeights } = await supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(2);

      let weightChange: number | null = null;
      if (recentWeights && recentWeights.length >= 2) {
        weightChange = Math.round((recentWeights[0].weight_kg - recentWeights[1].weight_kg) * 10) / 10;
      }

      setWeekly({
        workoutsCompleted: weekSessions?.length ?? 0,
        workoutsGoal: 4,
        avgCalories: Math.round(totalWeekCals / daysWithMeals),
        caloriesTarget: 2200,
        weightChange,
      });

      // ── Recent Activity ───────────────────────────────────────────────

      const activities: ActivityItem[] = [];

      // Recent sessions
      const { data: recentSessions } = await supabase
        .from("training_sessions")
        .select("id, workout_name, start_time, status")
        .eq("user_id", user.id)
        .eq("status", "Completed")
        .order("start_time", { ascending: false })
        .limit(4);

      if (recentSessions) {
        for (const s of recentSessions) {
          activities.push({ id: `s-${s.id}`, type: "workout", title: `Completed ${s.workout_name || "Workout"}`, timestamp: s.start_time });
        }
      }

      // Recent meals
      const { data: recentMeals } = await supabase
        .from("meal_logs")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(4);

      if (recentMeals) {
        for (const m of recentMeals) {
          activities.push({ id: `m-${m.id}`, type: "meal", title: `Logged ${m.name}`, timestamp: m.created_at });
        }
      }

      // Recent weight entries
      const { data: recentWeightEntries } = await supabase
        .from("weight_entries")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2);

      if (recentWeightEntries) {
        for (const w of recentWeightEntries) {
          activities.push({ id: `w-${w.id}`, type: "weight", title: "Added Weight Entry", timestamp: w.created_at });
        }
      }

      // Sort by timestamp, take first 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivity(activities.slice(0, 10));

      setLoading(false);
    }

    loadDashboard();
  }, []);

  // ── Loading State ───────────────────────────────────────────────────────────

  if (loading) return <SkeletonDashboard />;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — Welcome Header
      ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {getGreeting()}, {profile?.name || "User"}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          {profile?.fitnessGoal && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              🎯 {profile.fitnessGoal}
            </span>
          )}
          <span>{formatDate()}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Quick Stats
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Weight" value={stats?.lastWeight ? `${stats.lastWeight} kg` : "Not recorded"} icon="⚖️" />
        <StatCard label="Calories Today" value={stats?.caloriesToday ? `${stats.caloriesToday} kcal` : "Not recorded"} icon="🔥" />
        <StatCard label="Protein Today" value={stats?.proteinToday ? `${stats.proteinToday}g` : "Not recorded"} icon="🥩" />
        <StatCard label="Workouts This Week" value={`${stats?.workoutsThisWeek ?? 0}`} icon="💪" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — Today's Focus + SECTION 4 — Weekly Progress (grid)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Today's Focus */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Today&apos;s Focus</p>
          {focus?.hasWorkout ? (
            <div>
              <p className="text-lg font-bold text-zinc-900">{focus.workoutName}</p>
              <p className="mt-1 text-sm text-zinc-500">{focus.exerciseCount} exercise{focus.exerciseCount !== 1 ? "s" : ""}</p>
              <Link href="/training/start" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700">
                Start Workout
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <span className="mb-2 text-2xl">🏋️</span>
              <p className="mb-1 text-sm font-medium text-zinc-700">No workout scheduled today</p>
              <p className="mb-4 text-xs text-zinc-400">Create a workout to get started</p>
              <Link href="/workouts/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
                Create Workout
              </Link>
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Weekly Progress</p>
          <div className="flex flex-col gap-4">
            {/* Workouts progress bar */}
            <ProgressBar
              label="Workouts"
              current={weekly?.workoutsCompleted ?? 0}
              target={weekly?.workoutsGoal ?? 4}
              unit=""
              color="bg-blue-500"
            />
            {/* Avg Calories progress bar */}
            <ProgressBar
              label="Avg Calories"
              current={weekly?.avgCalories ?? 0}
              target={weekly?.caloriesTarget ?? 2200}
              unit="kcal"
              color="bg-amber-500"
            />
            {/* Weight change */}
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3">
              <span className="text-sm font-medium text-zinc-600">Weight Change</span>
              {weekly?.weightChange !== null && weekly?.weightChange !== undefined ? (
                <span className={`text-sm font-bold ${weekly.weightChange < 0 ? "text-emerald-600" : weekly.weightChange > 0 ? "text-red-500" : "text-zinc-700"}`}>
                  {weekly.weightChange > 0 ? "+" : ""}{weekly.weightChange} kg
                </span>
              ) : (
                <span className="text-sm text-zinc-400">No data</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5 — Recent Activity
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-900">Recent Activity</p>
        </div>
        {activity.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="📊"
              title="No activity yet"
              description="Start training, logging meals, or tracking weight to see your activity here."
              actionLabel="Start Workout"
              actionHref="/training/start"
              secondaryLabel="Log Meal"
              secondaryHref="/nutrition"
            />
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {activity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm">
                  {activityIcon(item.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-800">{item.title}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">{timeAgo(item.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6 — Quick Actions
      ═══════════════════════════════════════════════════════════════════════ */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction icon="⚖️" label="Log Weight" href="/progress/new" />
          <QuickAction icon="🥗" label="Log Meal" href="/nutrition" />
          <QuickAction icon="💪" label="Start Workout" href="/training/start" />
          <QuickAction icon="📸" label="Upload Photo" href="/progress/photos/upload" />
        </div>
      </div>
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-base">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="mt-0.5 truncate text-base font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-600">{label}</span>
        <span className="text-xs font-semibold text-zinc-700">{current}{unit ? ` ${unit}` : ""} / {target}{unit ? ` ${unit}` : ""}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuickAction({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-semibold text-zinc-700">{label}</span>
    </Link>
  );
}
