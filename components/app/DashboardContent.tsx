"use client";

import { useEffect, useState } from "react";
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

interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ── Calorie & macro estimation ────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sedentary: 1.2,
  "Lightly Active": 1.375,
  "Moderately Active": 1.55,
  "Very Active": 1.725,
  Athlete: 1.9,
};

/**
 * Mifflin-St Jeor equation for BMR.
 * Male:   10 × weight(kg) + 6.25 × height(cm) − 5 × age − 5 + 5  → simplified: +5
 * Female: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
 * Other:  average of male and female (neutral estimate)
 *
 * TDEE = BMR × activity multiplier
 * Macro split: Protein 30%, Carbs 40%, Fat 30%
 */
function calculateMacros(user: UserData): Macros | null {
  const w = user.weight;
  const h = user.height;
  const a = user.age;

  if (!w || !h || !a) return null;

  // BMR
  let bmr: number;
  if (user.gender === "Female") {
    bmr = 10 * w + 6.25 * h - 5 * a - 161;
  } else if (user.gender === "Male") {
    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  } else {
    // Neutral average
    bmr = 10 * w + 6.25 * h - 5 * a - 78;
  }

  // Activity multiplier
  const multiplier = ACTIVITY_MULTIPLIERS[user.activityLevel || ""] || 1.55;

  // Goal adjustment
  let goalAdjustment = 0;
  if (user.goal === "Lose Fat") goalAdjustment = -300;
  else if (user.goal === "Build Muscle") goalAdjustment = 250;

  const calories = Math.round(bmr * multiplier + goalAdjustment);
  const protein = Math.round((calories * 0.30) / 4);  // 4 kcal/g
  const carbs = Math.round((calories * 0.40) / 4);    // 4 kcal/g
  const fat = Math.round((calories * 0.30) / 9);      // 9 kcal/g

  return { calories, protein, carbs, fat };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function MacroCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-zinc-400">{unit}</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

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
          name: profile.name || undefined,
          goal: profile.fitness_goal || undefined,
          age,
          gender: profile.gender || undefined,
          height: profile.height_cm ? Number(profile.height_cm) : undefined,
          weight: profile.weight_kg ? Number(profile.weight_kg) : undefined,
          activityLevel: profile.activity_level || undefined,
        });
      }
    }

    loadProfile();
  }, []);

  const name = user?.name || "User";
  const goal = user?.goal || "Not set";
  const age = user?.age ? `${user.age} years` : "Not set";
  const gender = user?.gender || "Not set";
  const height = user?.height ? `${user.height} cm` : "Not set";
  const weight = user?.weight ? `${user.weight} kg` : "Not set";
  const activityLevel = user?.activityLevel || "Not set";

  const macros = user ? calculateMacros(user) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back, {name}. Here&apos;s your fitness overview.
        </p>
      </div>

      {/* Daily targets — macro cards */}
      {macros ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Daily Nutrition Targets
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MacroCard label="Calories" value={macros.calories} unit="kcal" color="text-zinc-900" />
            <MacroCard label="Protein" value={macros.protein} unit="grams" color="text-blue-600" />
            <MacroCard label="Carbs" value={macros.carbs} unit="grams" color="text-amber-600" />
            <MacroCard label="Fat" value={macros.fat} unit="grams" color="text-emerald-600" />
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            * Calculated using the Mifflin-St Jeor formula with a {activityLevel.toLowerCase()} activity multiplier
            {goal !== "Not set" && `, adjusted for "${goal}" goal`}.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-400">
            Complete onboarding to see your daily calorie and macro targets.
          </p>
        </div>
      )}

      {/* Overview metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Fitness Goal"
          value={goal}
          sub={goal !== "Not set" ? "Selected during onboarding" : undefined}
        />
        <MetricCard
          label="Body Weight"
          value={weight}
          sub={height !== "Not set" ? `Height: ${height}` : undefined}
        />
        <MetricCard
          label="Activity Level"
          value={activityLevel}
          sub={activityLevel !== "Not set" ? "Used for calorie estimation" : undefined}
        />
        <MetricCard
          label="Age"
          value={age}
          sub={gender !== "Not set" ? gender : undefined}
        />
      </div>

      {/* Profile + modules */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Your Profile</p>
          <div className="divide-y divide-zinc-100">
            <ProfileRow label="Full Name" value={name} />
            <ProfileRow label="Goal" value={goal} />
            <ProfileRow label="Age" value={age} />
            <ProfileRow label="Gender" value={gender} />
            <ProfileRow label="Height" value={height} />
            <ProfileRow label="Weight" value={weight} />
            <ProfileRow label="Activity Level" value={activityLevel} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">
              Today&apos;s Workout
            </p>
            <div className="flex h-28 items-center justify-center rounded-lg bg-zinc-50">
              <p className="text-sm text-zinc-400">Workout module coming soon</p>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">
              Nutrition Summary
            </p>
            <div className="flex h-28 items-center justify-center rounded-lg bg-zinc-50">
              <p className="text-sm text-zinc-400">Nutrition module coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
