"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SkeletonDashboard } from "@/components/ui/Skeleton";

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
  exerciseNames: string[];
}
interface WeeklyProgress {
  workoutsCompleted: number;
  workoutsGoal: number;
  avgCalories: number;
  caloriesTarget: number;
  weightChange: number | null;
  dailyWorkouts: boolean[]; // 7 days, true = completed
}
interface ActivityItem {
  id: string;
  type: "workout" | "meal" | "weight";
  title: string;
  timestamp: string;
}
interface NextMeal {
  name: string;
  calories: number | null;
  time: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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

function getDayLabels(): string[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [focus, setFocus] = useState<TodayFocus | null>(null);
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [nextMeal, setNextMeal] = useState<NextMeal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      // Get Monday of the current week
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const weekStart = monday.toISOString().slice(0, 10);

      const { data: profileData } = await supabase
        .from("users")
        .select("name, fitness_goal")
        .eq("id", user.id)
        .single();
      if (profileData)
        setProfile({
          name: profileData.name || "User",
          fitnessGoal: profileData.fitness_goal || "",
        });

      const { data: weightData } = await supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", user.id)
        .eq("is_sandbox", false)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: mealsToday } = await supabase
        .from("meal_logs")
        .select("calories, protein")
        .eq("date", today)
        .eq("is_sandbox", false);
      const { data: weekSessions } = await supabase
        .from("training_sessions")
        .select("id, date, status")
        .eq("user_id", user.id)
        .eq("status", "Completed")
        .eq("is_sandbox", false)
        .gte("date", weekStart);

      setStats({
        lastWeight: weightData?.weight_kg ?? null,
        caloriesToday:
          mealsToday?.reduce((s, m) => s + m.calories, 0) ?? 0,
        proteinToday:
          mealsToday?.reduce((s, m) => s + m.protein, 0) ?? 0,
        workoutsThisWeek: weekSessions?.length ?? 0,
      });

      // Build daily workout completion map for the week (Mon–Sun)
      const dailyWorkouts: boolean[] = Array(7).fill(false);
      if (weekSessions) {
        for (const s of weekSessions) {
          const sessionDate = new Date(s.date);
          const diff = Math.floor(
            (sessionDate.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (diff >= 0 && diff < 7) dailyWorkouts[diff] = true;
        }
      }

      const { data: nextWorkout } = await supabase
        .from("workouts")
        .select("id, name, workout_days(workout_exercises(id, exercise_name, sort_order))")
        .eq("user_id", user.id)
        .eq("is_template", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (nextWorkout) {
        const allExercises: { exercise_name: string; sort_order: number }[] = [];
        for (const day of (nextWorkout.workout_days || [])) {
          for (const ex of (day.workout_exercises || [])) {
            allExercises.push(ex);
          }
        }
        allExercises.sort((a, b) => a.sort_order - b.sort_order);
        setFocus({
          hasWorkout: true,
          workoutName: nextWorkout.name,
          exerciseCount: allExercises.length,
          workoutId: nextWorkout.id,
          exerciseNames: allExercises.slice(0, 3).map((e) => e.exercise_name),
        });
      } else {
        setFocus({
          hasWorkout: false,
          workoutName: null,
          exerciseCount: 0,
          workoutId: null,
          exerciseNames: [],
        });
      }

      const { data: weekMeals } = await supabase
        .from("meal_logs")
        .select("calories, date")
        .eq("is_sandbox", false)
        .gte("date", weekStart);
      const daysWithMeals =
        new Set(weekMeals?.map((m) => m.date) || []).size || 1;
      const totalWeekCals =
        weekMeals?.reduce((s, m) => s + m.calories, 0) ?? 0;
      const { data: recentWeights } = await supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", user.id)
        .eq("is_sandbox", false)
        .order("date", { ascending: false })
        .limit(2);
      let weightChange: number | null = null;
      if (recentWeights && recentWeights.length >= 2)
        weightChange =
          Math.round(
            (recentWeights[0].weight_kg - recentWeights[1].weight_kg) * 10
          ) / 10;
      setWeekly({
        workoutsCompleted: weekSessions?.length ?? 0,
        workoutsGoal: 4,
        avgCalories: Math.round(totalWeekCals / daysWithMeals),
        caloriesTarget: 2200,
        weightChange,
        dailyWorkouts,
      });

      // Load next meal from meal plans
      const { data: planData } = await supabase
        .from("meal_plans")
        .select("plan_data")
        .eq("user_id", user.id)
        .gte("week_end_date", today)
        .lte("week_start_date", today)
        .limit(1)
        .maybeSingle();

      if (planData?.plan_data) {
        const plan = planData.plan_data as any;
        const todayName = now
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        const todayPlan = plan[todayName] || plan.monday || null;
        if (todayPlan) {
          // Find next meal based on current hour
          const hour = now.getHours();
          let meal: any = null;
          if (hour < 10 && todayPlan.breakfast) meal = { ...todayPlan.breakfast, time: "Breakfast" };
          else if (hour < 14 && todayPlan.lunch) meal = { ...todayPlan.lunch, time: "Lunch" };
          else if (todayPlan.dinner) meal = { ...todayPlan.dinner, time: "Dinner" };
          else if (todayPlan.snack) meal = { ...todayPlan.snack, time: "Snack" };

          if (meal) {
            setNextMeal({
              name: meal.name || meal.recipe || "Planned meal",
              calories: meal.calories || null,
              time: meal.time || null,
            });
          }
        }
      }

      // Recent activity
      const activities: ActivityItem[] = [];
      const { data: recentSessions } = await supabase
        .from("training_sessions")
        .select("id, workout_name, start_time, status")
        .eq("user_id", user.id)
        .eq("status", "Completed")
        .eq("is_sandbox", false)
        .order("start_time", { ascending: false })
        .limit(3);
      if (recentSessions)
        for (const s of recentSessions)
          activities.push({
            id: `s-${s.id}`,
            type: "workout",
            title: `Completed ${s.workout_name || "Workout"}`,
            timestamp: s.start_time,
          });
      const { data: recentMeals } = await supabase
        .from("meal_logs")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      if (recentMeals)
        for (const m of recentMeals)
          activities.push({
            id: `m-${m.id}`,
            type: "meal",
            title: `Logged ${m.name}`,
            timestamp: m.created_at,
          });
      const { data: recentWeightEntries } = await supabase
        .from("weight_entries")
        .select("id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2);
      if (recentWeightEntries)
        for (const w of recentWeightEntries)
          activities.push({
            id: `w-${w.id}`,
            type: "weight",
            title: "Added Weight Entry",
            timestamp: w.created_at,
          });
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setActivity(activities.slice(0, 6));

      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="flex flex-col gap-golden-5">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col gap-golden-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-golden-lg font-bold tracking-tight text-zinc-900">
            {getGreeting()}, {(profile?.name || "User").split(" ")[0]}
          </h1>
          <div className="mt-golden-1 flex flex-wrap items-center gap-golden-2 text-golden-sm text-zinc-500">
            {profile?.fitnessGoal && (
              <span className="inline-flex items-center gap-golden-1 rounded-golden-md bg-zinc-100 px-golden-2 py-golden-1 text-golden-sm font-medium text-zinc-700">
                🎯 {profile.fitnessGoal}
              </span>
            )}
            <span>{formatDate()}</span>
          </div>
        </div>
        <div className="flex items-center gap-golden-2 sm:self-start">
          <QuickActionsMenu />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — DAILY SUMMARY (compact metric strip)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-golden-3 sm:grid-cols-4">
        <KpiCard
          icon="⚖️"
          label="Weight"
          value={stats?.lastWeight ? `${stats.lastWeight} kg` : "—"}
          sub={stats?.lastWeight ? "Latest entry" : "No entries yet"}
          href="/progress/weight"
        />
        <KpiCard
          icon="🔥"
          label="Calories Today"
          value={stats?.caloriesToday ? `${stats.caloriesToday.toLocaleString()} kcal` : "0 kcal"}
          sub="Logged today"
          href="/nutrition"
        />
        <KpiCard
          icon="🥩"
          label="Protein Today"
          value={stats?.proteinToday ? `${stats.proteinToday}g` : "0g"}
          sub="Logged today"
          href="/nutrition"
        />
        <KpiCard
          icon="💪"
          label="Workouts This Week"
          value={`${stats?.workoutsThisWeek ?? 0}`}
          sub="Completed sessions"
          href="/training/history"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — MAIN AREA (two equal columns)
          Left: Today's Workout
          Right: This Week
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-golden-4 lg:grid-cols-2">
        {/* Today's Workout — light card */}
        <div className="rounded-golden-xl border border-zinc-200 bg-white p-golden-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-golden-xs font-bold uppercase tracking-widest text-zinc-400">
              Today&apos;s Workout
            </p>
            {focus?.hasWorkout && (
              <Link
                href="/training/start"
                className="inline-flex items-center gap-golden-1 rounded-golden-md bg-zinc-900 px-golden-3 py-golden-1 text-golden-sm font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                Start Workout
              </Link>
            )}
          </div>

          {focus?.hasWorkout ? (
            <div className="mt-golden-3">
              <h3 className="text-golden-lg font-bold text-zinc-900">{focus.workoutName}</h3>

              {/* Compact indicators */}
              <div className="mt-golden-3 flex flex-wrap items-center gap-golden-3 text-golden-sm text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <span className="text-golden-base">💪</span>
                  {focus.exerciseCount} exercise{focus.exerciseCount !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-golden-base">⏱️</span>
                  ~{Math.max(focus.exerciseCount * 4, 15)} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="text-golden-base">📊</span>
                  {weekly?.workoutsCompleted ?? 0}/{weekly?.workoutsGoal ?? 4} this week
                </span>
              </div>

              {/* Next up — exercise preview */}
              {focus.exerciseNames.length > 0 && (
                <div className="mt-golden-4">
                  <p className="mb-golden-2 text-golden-sm font-bold uppercase tracking-widest text-zinc-500">Next up</p>
                  <div className="flex flex-col gap-golden-1">
                    {focus.exerciseNames.map((name, i) => (
                      <div key={i} className="flex items-center gap-golden-2 rounded-golden-md bg-zinc-50 px-golden-3 py-golden-2">
                        <span className="text-golden-sm font-semibold text-zinc-500">{i + 1}</span>
                        <span className="text-golden-sm font-medium text-zinc-700">{name}</span>
                      </div>
                    ))}
                    {focus.exerciseCount > 3 && (
                      <Link
                        href="/training/start"
                        className="mt-golden-1 inline-flex items-center gap-1 pl-golden-3 text-golden-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                      >
                        View {focus.exerciseCount - 3} more exercise{focus.exerciseCount - 3 !== 1 ? "s" : ""} →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Weekly goal bar */}
              <div className="mt-golden-4">
                <div className="mb-golden-1 flex items-center justify-between text-golden-sm text-zinc-600">
                  <span className="font-medium">Weekly goal</span>
                  <span className="font-semibold text-zinc-900">{weekly?.workoutsCompleted ?? 0} of {weekly?.workoutsGoal ?? 4} workouts</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-all duration-500"
                    style={{ width: `${Math.min(((weekly?.workoutsCompleted ?? 0) / (weekly?.workoutsGoal ?? 4)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-golden-4 flex flex-col items-center justify-center py-golden-5">
              <p className="text-golden-base font-medium text-zinc-500">No workout planned</p>
              <p className="mt-golden-1 text-golden-sm text-zinc-400">Create a routine to get started</p>
              <Link
                href="/workouts/new"
                className="mt-golden-4 inline-flex items-center gap-golden-1 rounded-golden-md border border-zinc-200 px-golden-3 py-golden-2 text-golden-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Create Workout
              </Link>
            </div>
          )}
        </div>

        {/* This Week — light card */}
        <div className="rounded-golden-xl border border-zinc-200 bg-white p-golden-4 shadow-sm">
          <div className="mb-golden-3 flex items-center justify-between">
            <h2 className="text-golden-xs font-bold uppercase tracking-widest text-zinc-400">This Week</h2>
          </div>

          {/* Workouts headline — prominent on light background */}
          <div className="mb-golden-4">
            <p className="text-golden-xl font-bold text-zinc-900">
              {weekly?.workoutsCompleted ?? 0}<span className="text-golden-lg font-medium text-zinc-400">/{weekly?.workoutsGoal ?? 4}</span>
            </p>
            <p className="text-golden-sm text-zinc-500">workouts completed</p>
          </div>

          {/* Day dots visualization */}
          <div className="mb-golden-4 grid grid-cols-7 gap-golden-1">
            {getDayLabels().map((day, idx) => {
              const completed = weekly?.dailyWorkouts[idx] ?? false;
              const isToday = idx === ((new Date().getDay() + 6) % 7);
              return (
                <div key={day} className="flex flex-col items-center gap-golden-1">
                  <span
                    className={[
                      "text-golden-xs font-medium",
                      isToday ? "text-zinc-900" : "text-zinc-500",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-golden-xs font-bold transition-all",
                      completed
                        ? "bg-zinc-900 text-white"
                        : isToday
                        ? "ring-2 ring-zinc-900 text-zinc-900"
                        : "bg-zinc-100 text-zinc-400",
                    ].join(" ")}
                  >
                    {completed ? "✓" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bars — secondary info */}
          <div className="space-y-golden-3">
            <ProgressRow
              label="Workouts"
              current={weekly?.workoutsCompleted ?? 0}
              target={weekly?.workoutsGoal ?? 4}
              suffix="sessions"
              color="bg-zinc-900"
            />
            <ProgressRow
              label="Calories"
              current={weekly?.avgCalories ?? 0}
              target={weekly?.caloriesTarget ?? 2200}
              suffix="kcal avg"
              color="bg-zinc-300"
            />
            <div className="flex items-center justify-between rounded-golden-md bg-zinc-50 px-golden-3 py-golden-2">
              <span className="text-golden-sm font-medium text-zinc-600">Weight Δ</span>
              {weekly?.weightChange !== null &&
              weekly?.weightChange !== undefined ? (
                <span
                  className={[
                    "text-golden-base font-bold",
                    weekly.weightChange < 0
                      ? "text-emerald-600"
                      : weekly.weightChange > 0
                      ? "text-red-500"
                      : "text-zinc-700",
                  ].join(" ")}
                >
                  {weekly.weightChange > 0 ? "+" : ""}
                  {weekly.weightChange} kg
                </span>
              ) : (
                <span className="text-golden-sm font-medium text-zinc-400">No data yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 — BOTTOM AREA (Next Meal + Recent Activity)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-golden-4 lg:grid-cols-2">
        {/* Next Meal */}
        <div className="rounded-golden-xl border border-zinc-200 bg-white p-golden-4 shadow-sm">
          <div className="mb-golden-3 flex items-center justify-between">
            <h2 className="text-golden-base font-bold text-zinc-900">Next Meal</h2>
            <Link
              href="/nutrition/meal-planner"
              className="text-golden-sm font-medium text-zinc-400 transition-colors hover:text-zinc-700"
            >
              Meal Plan →
            </Link>
          </div>
          {nextMeal ? (
            <div className="flex items-center gap-golden-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-golden-lg bg-amber-50 text-lg">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-golden-base font-semibold text-zinc-900">
                  {nextMeal.name}
                </p>
                <div className="flex items-center gap-golden-2 text-golden-sm text-zinc-500">
                  {nextMeal.time && <span>{nextMeal.time}</span>}
                  {nextMeal.calories && (
                    <span className="text-zinc-400">
                      • {nextMeal.calories} kcal
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/nutrition"
                className="shrink-0 rounded-golden-md border border-zinc-200 px-golden-3 py-golden-1 text-golden-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Log
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-golden-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-golden-lg bg-zinc-100 text-lg">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-golden-base text-zinc-500">No meal planned</p>
                <p className="text-golden-sm text-zinc-400">
                  Set up your meal plan for the week
                </p>
              </div>
              <Link
                href="/nutrition/meal-planner"
                className="shrink-0 rounded-golden-md border border-zinc-200 px-golden-3 py-golden-1 text-golden-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Plan
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-golden-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-golden-4 py-golden-3">
            <h2 className="text-golden-base font-bold text-zinc-900">Recent Activity</h2>
            {activity.length > 0 && (
              <span className="text-golden-xs font-medium text-zinc-400">
                {activity.length} entries
              </span>
            )}
          </div>
          {activity.length === 0 ? (
            <div className="px-golden-4 py-golden-4 text-center">
              <p className="text-golden-base text-zinc-400">
                No activity yet
              </p>
              <p className="mt-golden-1 text-golden-sm text-zinc-300">
                Complete a workout or log a meal to see it here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {activity.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-golden-3 px-golden-4 py-golden-2"
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-golden-sm",
                      item.type === "workout"
                        ? "bg-blue-50 text-blue-600"
                        : item.type === "meal"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600",
                    ].join(" ")}
                  >
                    {item.type === "workout"
                      ? "💪"
                      : item.type === "meal"
                      ? "🥗"
                      : "⚖️"}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-golden-base text-zinc-700">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-golden-xs text-zinc-400">
                    {timeAgo(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Quick Actions Dropdown / Bottom Sheet ─────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Log Meal", icon: "🥗", href: "/nutrition" },
  { label: "Log Weight", icon: "⚖️", href: "/progress/new" },
  { label: "Add Measurement", icon: "📏", href: "/progress/new" },
  { label: "Upload Progress Photo", icon: "📸", href: "/progress/photos/upload" },
  { label: "Start Workout", icon: "💪", href: "/training/start" },
  { label: "Create Recipe", icon: "🍳", href: "/nutrition/recipes" },
];

function QuickActionsMenu() {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const router = useRouter();

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
    buttonRef.current?.focus();
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, closeDropdown]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeDropdown]);

  useEffect(() => {
    if (!sheetOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sheetOpen, closeSheet]);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [sheetOpen]);

  function handleButtonClick() {
    if (isMobile) {
      setSheetOpen(true);
    } else {
      setOpen((prev) => !prev);
      setFocusIndex(-1);
    }
  }

  function handleDropdownKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(focusIndex + 1, QUICK_ACTIONS.length - 1);
      setFocusIndex(next);
      itemsRef.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(focusIndex - 1, 0);
      setFocusIndex(prev);
      itemsRef.current[prev]?.focus();
    } else if (e.key === "Enter" && focusIndex >= 0) {
      e.preventDefault();
      router.push(QUICK_ACTIONS[focusIndex].href);
      closeDropdown();
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative"
        onKeyDown={handleDropdownKeyDown}
      >
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Quick Actions"
          className="inline-flex items-center gap-golden-1 rounded-golden-lg border border-zinc-200 bg-white px-golden-3 py-golden-2 text-golden-base font-semibold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        >
          <span>⚡</span>
          <span className="hidden sm:inline">Quick Actions</span>
          <svg
            className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-golden-2 w-56 rounded-golden-lg border border-zinc-200 bg-white py-golden-1 shadow-lg animate-in fade-in-0 zoom-in-95"
          >
            {QUICK_ACTIONS.map((action, idx) => (
              <a
                key={action.href}
                ref={(el) => {
                  itemsRef.current[idx] = el;
                }}
                href={action.href}
                role="menuitem"
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(action.href);
                  closeDropdown();
                }}
                className={[
                  "flex items-center gap-golden-3 px-golden-3 py-golden-3 text-golden-base text-zinc-700 transition-colors hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none",
                  focusIndex === idx ? "bg-zinc-50" : "",
                ].join(" ")}
                style={{ minHeight: "44px" }}
              >
                <span className="text-golden-md">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-[100] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Actions"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0"
            onClick={closeSheet}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-golden-xl bg-white pb-golden-6 pt-golden-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mb-golden-4 h-1 w-10 rounded-full bg-zinc-300" />
            <p className="mb-golden-2 px-golden-4 text-golden-sm font-bold uppercase tracking-widest text-zinc-400">
              Quick Actions
            </p>
            <div className="flex flex-col">
              {QUICK_ACTIONS.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(action.href);
                    closeSheet();
                  }}
                  className="flex items-center gap-golden-4 px-golden-4 py-golden-3 text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                  style={{ minHeight: "52px" }}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-golden-md font-medium">{action.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
// Information-first card that navigates to its related module. No create CTA —
// data creation lives in Quick Actions. Hover + arrow signal it's clickable.

function KpiCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-golden-3 rounded-golden-lg border border-zinc-200 bg-white px-golden-3 py-golden-3 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-300"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-golden-md bg-zinc-100 text-golden-md">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-golden-xs font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </p>
        <p className="mt-golden-1 truncate text-golden-base font-bold text-zinc-900">
          {value}
        </p>
        <p className="truncate text-golden-xs text-zinc-400">{sub}</p>
      </div>
      <svg
        className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

// ── Progress Row ──────────────────────────────────────────────────────────────

function ProgressRow({
  label,
  current,
  target,
  suffix,
  color,
}: {
  label: string;
  current: number;
  target: number;
  suffix: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div>
      <div className="mb-golden-1 flex items-center justify-between gap-golden-2">
        <span className="text-golden-sm font-medium text-zinc-600">{label}</span>
        <span className="text-golden-sm font-semibold text-zinc-900">
          {current.toLocaleString()} / {target.toLocaleString()} {suffix}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
