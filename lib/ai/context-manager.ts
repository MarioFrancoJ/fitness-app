import type { AIContext, UserProfileContext, NutritionContext, TrainingContext, ProgressContext, GoalContext } from "./types";

// ── Context Manager: Collects data from all modules ───────────────────────────

export function buildAIContext(): AIContext {
  return {
    profile: buildProfileContext(),
    nutrition: buildNutritionContext(),
    training: buildTrainingContext(),
    progress: buildProgressContext(),
    goals: buildGoalContext(),
  };
}

function buildProfileContext(): UserProfileContext | null {
  try {
    const raw = localStorage.getItem("fitnessapp_user");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      name: data.fullName || data.name || "User",
      gender: data.gender || "",
      weight: data.currentWeight || data.weight || null,
      height: data.height || null,
      activityLevel: data.activityLevel || "",
      fitnessGoal: data.fitnessGoal || data.goal || "",
    };
  } catch {
    return null;
  }
}

function buildNutritionContext(): NutritionContext | null {
  try {
    const raw = localStorage.getItem("fitnessapp_nutrition_meals");
    if (!raw) return null;
    const meals = JSON.parse(raw) as { date: string; calories: number; protein: number }[];
    const today = new Date().toISOString().slice(0, 10);
    const todayMeals = meals.filter((m) => m.date === today);

    const profile = JSON.parse(localStorage.getItem("fitnessapp_user") || "{}");
    const weight = profile.currentWeight || profile.weight || 70;
    const goal = (profile.fitnessGoal || profile.goal || "").toLowerCase();
    const multiplier = goal.includes("lose") ? 25 : goal.includes("muscle") ? 35 : 30;

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekMeals = meals.filter((m) => new Date(m.date) >= weekAgo);
    const weekDays = new Set(weekMeals.map((m) => m.date)).size || 1;

    return {
      todayCalories: todayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      todayProtein: todayMeals.reduce((s, m) => s + (m.protein || 0), 0),
      calorieTarget: weight * multiplier,
      proteinTarget: weight * 2,
      mealsLoggedToday: todayMeals.length,
      avgCaloriesWeek: weekMeals.reduce((s, m) => s + (m.calories || 0), 0) / weekDays,
    };
  } catch {
    return null;
  }
}

function buildTrainingContext(): TrainingContext | null {
  try {
    const raw = localStorage.getItem("fitnessapp_training_sessions");
    if (!raw) return null;
    const sessions = JSON.parse(raw) as { date: string; status: string; durationMinutes: number }[];
    const completed = sessions.filter((s) => s.status === "Completed");

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = completed.filter((s) => new Date(s.date) >= weekAgo);

    // Streak
    const daySet = new Set(completed.map((s) => s.date));
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      if (daySet.has(d.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
    }

    return {
      workoutsThisWeek: weekSessions.length,
      lastWorkoutDate: completed.length > 0 ? completed[0].date : null,
      currentStreak: streak,
      totalSessions: completed.length,
      avgDuration: completed.length > 0 ? Math.round(completed.reduce((s, sess) => s + sess.durationMinutes, 0) / completed.length) : 0,
    };
  } catch {
    return null;
  }
}

function buildProgressContext(): ProgressContext | null {
  try {
    const profile = JSON.parse(localStorage.getItem("fitnessapp_user") || "{}");
    const currentWeight = profile.currentWeight || profile.weight || null;
    const startingWeight = profile.startingWeight || null;
    const goalWeight = profile.goalWeight || null;

    let trend: ProgressContext["measurementsTrend"] = "unknown";
    try {
      const history = JSON.parse(localStorage.getItem("fitnessapp_measurement_history") || "[]");
      if (history.length >= 2) {
        const recent = history[0];
        const older = history[Math.min(history.length - 1, 3)];
        if (recent.measurements?.waist && older.measurements?.waist) {
          const diff = parseFloat(recent.measurements.waist) - parseFloat(older.measurements.waist);
          trend = diff < -0.5 ? "improving" : diff > 0.5 ? "declining" : "stable";
        }
      }
    } catch {}

    return {
      currentWeight,
      startingWeight,
      goalWeight,
      weightChange: currentWeight && startingWeight ? currentWeight - startingWeight : null,
      measurementsTrend: trend,
    };
  } catch {
    return null;
  }
}

function buildGoalContext(): GoalContext | null {
  try {
    const profile = JSON.parse(localStorage.getItem("fitnessapp_user") || "{}");
    const goal = profile.fitnessGoal || profile.goal || "";
    if (!goal) return null;

    const currentWeight = profile.currentWeight || profile.weight;
    const goalWeight = profile.goalWeight;
    const startingWeight = profile.startingWeight || currentWeight;
    let goalProgress = 0;
    if (startingWeight && goalWeight && currentWeight && startingWeight !== goalWeight) {
      goalProgress = Math.min(100, Math.max(0, ((startingWeight - currentWeight) / (startingWeight - goalWeight)) * 100));
    }

    const sessions = JSON.parse(localStorage.getItem("fitnessapp_training_sessions") || "[]");
    const completed = sessions.filter((s: { status: string }) => s.status === "Completed");
    const daysActive = new Set(completed.map((s: { date: string }) => s.date)).size;

    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = completed.filter((s: { date: string }) => new Date(s.date) >= weekAgo);
    const consistency = weekSessions.length >= 5 ? "high" : weekSessions.length >= 3 ? "medium" : "low";

    return { primaryGoal: goal, goalProgress, daysActive, consistency };
  } catch {
    return null;
  }
}
