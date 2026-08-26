"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserData {
  name?: string;
  goal?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
}

interface Macros { calories: number; protein: number; carbs: number; fat: number; }

interface TodayWorkout {
  id: string;
  workout_name: string | null;
  duration_minutes: number | null;
  status: string;
  date: string;
}

interface TodayNutrition {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
}

interface WeightProgress {
  current: number | null;
  previous: number | null;
  change: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sedentary: 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55, "Very Active": 1.725, Athlete: 1.9,
};

function calculateMacros(user: UserData): Macros | null {
  const { weight: w, height: h, age: a, gender, activityLevel, goal } = user;
  if (!w || !h || !a) return null;
  let bmr = gender === "Female" ? 10 * w + 6.25 * h - 5 * a - 161 : gender === "Male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 78;
  const mult = ACTIVITY_MULTIPLIERS[activityLevel || ""] || 1.55;
  const adj = goal === "Lose Fat" ? -300 : goal === "Build Muscle" ? 250 : 0;
  const calories = Math.round(bmr * mult + adj);
  return { calories, protein: Math.round((calories * 0.30) / 4), carbs: Math.round((calories * 0.40) / 4), fat: Math.round((calories * 0.30) / 9) };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MacroCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-medium text-zinc-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-[10px] text-zinc-400">{unit}</p>
    </div>
  );
}

function StatCard({ label, value, sub, color = "text-zinc-900" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-medium text-zinc-400">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-zinc-400">{sub}</p>}
    </div>
  );
}

function EmptyCTA({ icon, title, description, href, cta }: { icon: string; title: string; description: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-8">
      <span className="mb-2 text-2xl">{icon}</span>
      <p className="mb-1 text-sm font-semibold text-zinc-700">{title}</p>
      <p className="mb-3 text-xs text-zinc-400">{description}</p>
      <Link href={href} className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">{cta}</Link>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [user, setUser] = useState<UserData | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<TodayNutrition | null>(null);
  const [weightProgress, setWeightProgress] = useState<WeightProgress>({ current: null, previous: null, change: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setLoading(false); return; }

      const today = new Date().toISOString().slice(0, 10);

      // Profile
      const { data: profile } = await supabase
        .from("users")
        .select("name, fitness_goal, gender, height_cm, weight_kg, activity_level, date_of_birth")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        const age = profile.date_of_birth
          ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined;
        setUser({
          name: profile.name || undefined, goal: profile.fitness_goal || undefined, age,
          gender: profile.gender || undefined, height: profile.height_cm ? Number(profile.height_cm) : undefined,
          weight: profile.weight_kg ? Number(profile.weight_kg) : undefined, activityLevel: profile.activity_level || undefined,
        });
      }

      // Today's most recent workout session
      const { data: sessionData } = await supabase
        .from("training_sessions")
        .select("id, workout_name, duration_minutes, status, date")
        .eq("user_id", authUser.id)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionData) setTodayWorkout(sessionData);

      // Today's nutrition
      const { data: mealsData } = await supabase
        .from("meal_logs")
        .select("calories, protein, carbs, fat")
        .eq("date", today);

      if (mealsData && mealsData.length > 0) {
        setTodayNutrition({
          totalCalories: mealsData.reduce((s, m) => s + m.calories, 0),
          totalProtein: mealsData.reduce((s, m) => s + m.protein, 0),
          totalCarbs: mealsData.reduce((s, m) => s + m.carbs, 0),
          totalFat: mealsData.reduce((s, m) => s + m.fat, 0),
          mealCount: mealsData.length,
        });
      }

      // Weight progress (last 2 entries)
      const { data: weights } = await supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", authUser.id)
        .order("date", { ascending: false })
        .limit(2);

      if (weights && weights.length > 0) {
        const current = weights[0].weight_kg;
        const previous = weights.length > 1 ? weights[1].weight_kg : null;
        setWeightProgress({ current, previous, change: previous ? Math.round((current - previous) * 10) / 10 : null });
      }

      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  const name = user?.name || "User";
  const macros = user ? calculateMacros(user) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Welcome back, {name}. Here&apos;s your fitness overview.</p>
      </div>

      {/* Daily Nutrition Targets */}
      {macros ? (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Daily Targets</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MacroCard label="Calories" value={macros.calories} unit="kcal" color="text-zinc-900" />
            <MacroCard label="Protein" value={macros.protein} unit="grams" color="text-blue-600" />
            <MacroCard label="Carbs" value={macros.carbs} unit="grams" color="text-amber-600" />
            <MacroCard label="Fat" value={macros.fat} unit="grams" color="text-emerald-600" />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Complete your <Link href="/profile" className="font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-700">profile</Link> to see daily nutrition targets.</p>
        </div>
      )}

      {/* Main grid: Workout + Nutrition + Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Workout */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">Last Workout</p>
            <Link href="/training/start" className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900">Start →</Link>
          </div>
          {todayWorkout ? (
            <div>
              <p className="text-sm font-bold text-zinc-900">{todayWorkout.workout_name || "Workout"}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                {todayWorkout.duration_minutes && <span>{todayWorkout.duration_minutes} min</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${todayWorkout.status === "Completed" ? "bg-emerald-50 text-emerald-700" : todayWorkout.status === "In Progress" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>{todayWorkout.status}</span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-400">{todayWorkout.date}</p>
            </div>
          ) : (
            <EmptyCTA icon="💪" title="No workouts yet" description="Start training to see your progress" href="/training/start" cta="Start Workout" />
          )}
        </div>

        {/* Today's Nutrition */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">Today&apos;s Nutrition</p>
            <Link href="/nutrition" className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900">Log →</Link>
          </div>
          {todayNutrition ? (
            <div>
              <p className="text-2xl font-bold text-zinc-900">{todayNutrition.totalCalories} <span className="text-sm font-normal text-zinc-400">kcal</span></p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-blue-600 font-semibold">P {todayNutrition.totalProtein}g</span>
                <span className="text-amber-600 font-semibold">C {todayNutrition.totalCarbs}g</span>
                <span className="text-emerald-600 font-semibold">F {todayNutrition.totalFat}g</span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-400">{todayNutrition.mealCount} meal{todayNutrition.mealCount !== 1 ? "s" : ""} logged today</p>
            </div>
          ) : (
            <EmptyCTA icon="🥗" title="No meals logged today" description="Track your nutrition to stay on target" href="/nutrition" cta="Log First Meal" />
          )}
        </div>

        {/* Weight Progress */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-700">Weight</p>
            <Link href="/progress/weight" className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900">Track →</Link>
          </div>
          {weightProgress.current ? (
            <div>
              <p className="text-2xl font-bold text-zinc-900">{weightProgress.current} <span className="text-sm font-normal text-zinc-400">kg</span></p>
              {weightProgress.change !== null && (
                <p className={`mt-1 text-xs font-semibold ${weightProgress.change < 0 ? "text-emerald-600" : weightProgress.change > 0 ? "text-red-500" : "text-zinc-500"}`}>
                  {weightProgress.change > 0 ? "+" : ""}{weightProgress.change} kg from last entry
                </p>
              )}
            </div>
          ) : (
            <EmptyCTA icon="⚖️" title="No weight tracked" description="Log your weight to see trends" href="/progress/new" cta="Track Weight" />
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Goal" value={user?.goal || "Not set"} />
        <StatCard label="Weight" value={user?.weight ? `${user.weight} kg` : "Not set"} sub={user?.height ? `Height: ${user.height} cm` : undefined} />
        <StatCard label="Activity" value={user?.activityLevel || "Not set"} />
        <StatCard label="Age" value={user?.age ? `${user.age} years` : "Not set"} sub={user?.gender || undefined} />
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quick Actions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/training/start" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-zinc-900">Start Workout</p>
            <p className="text-xs text-zinc-400">Begin a training session</p>
          </Link>
          <Link href="/nutrition" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-zinc-900">Log Meal</p>
            <p className="text-xs text-zinc-400">Track your nutrition</p>
          </Link>
          <Link href="/progress/new" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-zinc-900">Add Measurement</p>
            <p className="text-xs text-zinc-400">Record body measurements</p>
          </Link>
          <Link href="/ai-coach" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-zinc-900">AI Coach</p>
            <p className="text-xs text-zinc-400">Get personalized tips</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
