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
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: mealsToday } = await supabase
        .from("meal_logs")
        .select("calories, protein")
        .eq("date", today);
      const { data: weekSessions } = await supabase
        .from("training_sessions")
        .select("id, date, status")
        .eq("user_id", user.id)
        .eq("status", "Completed")
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
        .select("id, name, workout_days(workout_exercises(id))")
        .eq("user_id", user.id)
        .eq("is_template", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (nextWorkout) {
        const exerciseCount = (nextWorkout.workout_days || []).reduce(
          (sum: number, day: any) =>
            sum + (day.workout_exercises?.length || 0),
          0
        );
        setFocus({
          hasWorkout: true,
          workoutName: nextWorkout.name,
          exerciseCount,
          workoutId: nextWorkout.id,
        });
      } else {
        setFocus({
          hasWorkout: false,
          workoutName: null,
          exerciseCount: 0,
          workoutId: null,
        });
      }

      const { data: weekMeals } = await supabase
        .from("meal_logs")
        .select("calories, date")
        .gte("date", weekStart);
      const daysWithMeals =
        new Set(weekMeals?.map((m) => m.date) || []).size || 1;
      const totalWeekCals =
        weekMeals?.reduce((s, m) => s + m.calories, 0) ?? 0;
      const { data: recentWeights } = await supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", user.id)
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
    <div className="flex flex-col gap-6">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {getGreeting()}, {profile?.name || "User"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            {profile?.fitnessGoal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                🎯 {profile.fitnessGoal}
              </span>
            )}
            <span>{formatDate()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:self-start">
          <Link
            href="/training/start"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700"
          >
            💪 Start Workout
          </Link>
          <QuickActionsMenu />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — DAILY SUMMARY (compact metric strip)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile
          icon="⚖️"
          label="Weight"
          value={stats?.lastWeight ? `${stats.lastWeight} kg` : null}
          emptyLabel="Add weight"
          href="/progress/new"
        />
        <MetricTile
          icon="🔥"
          label="Calories"
          value={stats?.caloriesToday ? `${stats.caloriesToday} kcal` : null}
          emptyLabel="Log calories"
          href="/nutrition"
        />
        <MetricTile
          icon="🥩"
          label="Protein"
          value={stats?.proteinToday ? `${stats.proteinToday}g` : null}
          emptyLabel="Log meal"
          href="/nutrition"
        />
        <MetricTile
          icon="💪"
          label="Workouts"
          value={`${stats?.workoutsThisWeek ?? 0} this week`}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — MAIN AREA (two columns on desktop)
          Left (wide): Today's Workout Hero — primary visual weight
          Right (secondary): Weekly Progress
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Today's Workout Hero — takes 3/5 columns, visually dominant */}
        <div className="order-first flex flex-col justify-between rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 text-white shadow-lg lg:col-span-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Today&apos;s Workout
            </p>
            {focus?.hasWorkout ? (
              <>
                <h3 className="mt-3 text-xl font-bold leading-tight lg:text-2xl">
                  {focus.workoutName}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                    </svg>
                    {focus.exerciseCount} exercise{focus.exerciseCount !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    ~{Math.max(focus.exerciseCount * 4, 15)} min
                  </span>
                </div>
                {/* Mini progress indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Week progress</span>
                    <span>{weekly?.workoutsCompleted ?? 0}/{weekly?.workoutsGoal ?? 4} done</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                    <div
                      className="h-full rounded-full bg-white/80 transition-all duration-500"
                      style={{ width: `${Math.min(((weekly?.workoutsCompleted ?? 0) / (weekly?.workoutsGoal ?? 4)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-3 text-xl font-bold leading-tight lg:text-2xl">
                  No workout planned
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Create a routine to get started with your training
                </p>
              </>
            )}
          </div>

          <div className="mt-6">
            {focus?.hasWorkout ? (
              <Link
                href="/training/start"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
              >
                💪 Start{" "}
                {focus.workoutName && focus.workoutName.length <= 18
                  ? focus.workoutName
                  : "Workout"}
              </Link>
            ) : (
              <Link
                href="/workouts/new"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:border-zinc-400 hover:bg-zinc-700"
              >
                Create Workout
              </Link>
            )}
          </div>
        </div>

        {/* Weekly Progress — takes 2/5 columns, secondary */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">This Week</h2>
            <span className="text-xs text-zinc-400">
              {weekly?.workoutsCompleted ?? 0}/{weekly?.workoutsGoal ?? 4}
            </span>
          </div>

          {/* Day dots visualization */}
          <div className="mb-5 grid grid-cols-7 gap-1">
            {getDayLabels().map((day, idx) => {
              const completed = weekly?.dailyWorkouts[idx] ?? false;
              const isToday = idx === ((new Date().getDay() + 6) % 7);
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span
                    className={[
                      "text-[9px] font-medium",
                      isToday ? "text-zinc-900" : "text-zinc-400",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all",
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

          {/* Progress bars */}
          <div className="space-y-3">
            <ProgressRow
              label="Calories"
              current={weekly?.avgCalories ?? 0}
              target={weekly?.caloriesTarget ?? 2200}
              suffix="kcal avg"
              color="bg-amber-500"
            />
            <ProgressRow
              label="Workouts"
              current={weekly?.workoutsCompleted ?? 0}
              target={weekly?.workoutsGoal ?? 4}
              suffix="sessions"
              color="bg-blue-500"
            />
            <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <span className="text-xs font-medium text-zinc-600">Weight Δ</span>
              {weekly?.weightChange !== null &&
              weekly?.weightChange !== undefined ? (
                <span
                  className={[
                    "text-sm font-bold",
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
                <Link
                  href="/progress/new"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Add weight →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 — BOTTOM AREA (Next Meal + Recent Activity)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Next Meal */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">Next Meal</h2>
            <Link
              href="/nutrition/meal-planner"
              className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700"
            >
              Meal Plan →
            </Link>
          </div>
          {nextMeal ? (
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {nextMeal.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
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
                className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Log
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-500">No meal planned</p>
                <p className="text-xs text-zinc-400">
                  Set up your meal plan for the week
                </p>
              </div>
              <Link
                href="/nutrition/meal-planner"
                className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Plan
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
            <h2 className="text-sm font-bold text-zinc-900">Recent Activity</h2>
            {activity.length > 0 && (
              <span className="text-[10px] font-medium text-zinc-400">
                {activity.length} entries
              </span>
            )}
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-5 text-center">
              <p className="text-sm text-zinc-400">
                No activity yet
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                Complete a workout or log a meal to see it here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {activity.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
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
                  <p className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-zinc-400">
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
  { label: "Upload Photo", icon: "📸", href: "/progress/photos/upload" },
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
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
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg animate-in fade-in-0 zoom-in-95"
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
                  "flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-none",
                  focusIndex === idx ? "bg-zinc-50" : "",
                ].join(" ")}
                style={{ minHeight: "44px" }}
              >
                <span className="text-base">{action.icon}</span>
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
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white pb-8 pt-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-300" />
            <p className="mb-2 px-5 text-xs font-bold uppercase tracking-widest text-zinc-400">
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
                  className="flex items-center gap-4 px-5 py-4 text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                  style={{ minHeight: "52px" }}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-base font-medium">{action.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Metric Tile ───────────────────────────────────────────────────────────────

function MetricTile({
  icon,
  label,
  value,
  emptyLabel,
  href,
}: {
  icon: string;
  label: string;
  value: string | null;
  emptyLabel?: string;
  href?: string;
}) {
  const isEmpty = !value && emptyLabel && href;

  const inner = (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-sm transition-all",
        isEmpty
          ? "border-zinc-200 cursor-pointer hover:border-zinc-300 hover:shadow-md"
          : "border-zinc-200",
      ].join(" ")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-base">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {label}
        </p>
        {value ? (
          <p className="mt-0.5 truncate text-sm font-bold text-zinc-900">
            {value}
          </p>
        ) : emptyLabel ? (
          <p className="mt-0.5 text-xs font-medium text-blue-600">
            {emptyLabel} →
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-zinc-400">—</p>
        )}
      </div>
    </div>
  );

  if (isEmpty) {
    return <Link href={href!}>{inner}</Link>;
  }
  return inner;
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
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600">{label}</span>
        <span className="text-[11px] font-semibold text-zinc-700">
          {current} / {target} {suffix}
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
