// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendationCategory = "Nutrition" | "Training" | "Recovery" | "Motivation" | "Consistency";

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export interface DailyCheckIn {
  date: string;
  energyLevel: number;
  sleepQuality: number;
  stressLevel: number;
  motivationLevel: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: string;
}

// ── Storage Keys ──────────────────────────────────────────────────────────────

const CHECKIN_KEY = "fitnessapp_daily_checkins";
const CHAT_KEY = "fitnessapp_coach_chat";
const PROFILE_KEY = "fitnessapp_user";
const MEALS_KEY = "fitnessapp_nutrition_meals";
const SESSIONS_KEY = "fitnessapp_training_sessions";
const HISTORY_KEY = "fitnessapp_measurement_history";

// ── Check-In Store ────────────────────────────────────────────────────────────

export function loadCheckIns(): DailyCheckIn[] {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCheckIn(checkIn: DailyCheckIn) {
  const all = loadCheckIns();
  const existing = all.findIndex((c) => c.date === checkIn.date);
  if (existing >= 0) {
    all[existing] = checkIn;
  } else {
    all.unshift(checkIn);
  }
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(all));
}

export function getTodayCheckIn(): DailyCheckIn | null {
  const today = new Date().toISOString().slice(0, 10);
  return loadCheckIns().find((c) => c.date === today) ?? null;
}

// ── Chat Store ────────────────────────────────────────────────────────────────

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
}

// ── Rule Engine ───────────────────────────────────────────────────────────────

interface ProfileData {
  fitnessGoal?: string;
  goal?: string;
  currentWeight?: number;
  weight?: number;
  goalWeight?: number;
  startingWeight?: number;
  activityLevel?: string;
}

interface MealEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SessionEntry {
  date: string;
  status: string;
  durationMinutes: number;
}

function loadProfileData(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadMealsData(): MealEntry[] {
  try {
    const raw = localStorage.getItem(MEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadSessionsData(): SessionEntry[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function generateRecommendations(): Recommendation[] {
  const profile = loadProfileData();
  const meals = loadMealsData();
  const sessions = loadSessionsData();
  const checkIns = loadCheckIns();
  const recommendations: Recommendation[] = [];

  const goal = (profile.fitnessGoal || profile.goal || "").toLowerCase();
  const weight = profile.currentWeight || profile.weight || 70;
  const goalWeight = profile.goalWeight;

  // Nutrition targets (estimated)
  const calorieTarget = goal.includes("lose") || goal.includes("fat") ? weight * 25 : goal.includes("muscle") || goal.includes("build") ? weight * 35 : weight * 30;
  const proteinTarget = weight * 2;

  // Today's meals
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = meals.filter((m) => m.date === today);
  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);

  // This week sessions
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = sessions.filter((s) => s.status === "Completed" && new Date(s.date) >= weekAgo);

  // Latest check-in
  const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;

  // ── Nutrition Rules ──────────────────────────────────────────────────────

  if (todayMeals.length === 0) {
    recommendations.push({
      id: "nutr-log",
      category: "Nutrition",
      title: "Log Your Meals",
      message: "You haven't logged any meals today. Tracking your food helps you stay on target.",
      priority: "medium",
    });
  } else {
    if ((goal.includes("lose") || goal.includes("fat")) && todayCalories > calorieTarget * 1.1) {
      recommendations.push({
        id: "nutr-high-cal",
        category: "Nutrition",
        title: "Calorie Intake High",
        message: `You've consumed ${todayCalories} kcal today, which is above your ${Math.round(calorieTarget)} kcal target. Consider lighter options for remaining meals.`,
        priority: "high",
      });
    }

    if (todayProtein < proteinTarget * 0.5 && todayMeals.length >= 2) {
      recommendations.push({
        id: "nutr-low-protein",
        category: "Nutrition",
        title: "Protein Below Target",
        message: `You've had ${todayProtein}g protein so far. Aim for ${Math.round(proteinTarget)}g daily to support your goals. Add a high-protein snack.`,
        priority: "high",
      });
    }

    if (todayProtein >= proteinTarget) {
      recommendations.push({
        id: "nutr-protein-goal",
        category: "Nutrition",
        title: "Protein Goal Reached",
        message: "Great job! You've hit your daily protein target. Keep it up.",
        priority: "low",
      });
    }
  }

  // ── Training Rules ───────────────────────────────────────────────────────

  if (weekSessions.length === 0) {
    recommendations.push({
      id: "train-inactive",
      category: "Training",
      title: "No Workouts This Week",
      message: "You haven't completed any workouts this week. Even a short session can maintain progress.",
      priority: "high",
    });
  } else if (weekSessions.length < 3) {
    recommendations.push({
      id: "train-low-freq",
      category: "Training",
      title: "Training Frequency Low",
      message: `You've trained ${weekSessions.length} time${weekSessions.length > 1 ? "s" : ""} this week. Try to get at least 3 sessions for optimal progress.`,
      priority: "medium",
    });
  } else if (weekSessions.length >= 5) {
    recommendations.push({
      id: "train-consistent",
      category: "Consistency",
      title: "Great Consistency",
      message: `${weekSessions.length} workouts this week! You're building excellent training habits.`,
      priority: "low",
    });
  }

  // ── Recovery Rules ───────────────────────────────────────────────────────

  if (latestCheckIn) {
    if (latestCheckIn.sleepQuality <= 4) {
      recommendations.push({
        id: "rec-sleep",
        category: "Recovery",
        title: "Poor Sleep Detected",
        message: "Your sleep quality was low. Consider lighter training today and prioritize rest tonight.",
        priority: "high",
      });
    }

    if (latestCheckIn.stressLevel >= 8) {
      recommendations.push({
        id: "rec-stress",
        category: "Recovery",
        title: "High Stress",
        message: "Your stress level is elevated. A light walk or mobility session may help more than intense training.",
        priority: "medium",
      });
    }

    if (latestCheckIn.energyLevel <= 3) {
      recommendations.push({
        id: "rec-energy",
        category: "Recovery",
        title: "Low Energy",
        message: "Your energy is low today. Consider a rest day or a lighter workout with focus on form.",
        priority: "medium",
      });
    }
  }

  // ── Motivation Rules ─────────────────────────────────────────────────────

  if (goalWeight && weight) {
    const progress = ((profile.startingWeight || weight) - weight) / ((profile.startingWeight || weight) - goalWeight) * 100;
    if (progress > 0 && progress < 100) {
      recommendations.push({
        id: "mot-progress",
        category: "Motivation",
        title: "You're Making Progress",
        message: `You're ${Math.round(progress)}% of the way to your goal weight. Every step counts, keep going!`,
        priority: "low",
      });
    }
    if (progress >= 100) {
      recommendations.push({
        id: "mot-goal-reached",
        category: "Motivation",
        title: "Goal Weight Reached!",
        message: "Congratulations! You've reached your goal weight. Time to set a new challenge!",
        priority: "low",
      });
    }
  }

  // Default if no recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      id: "gen-default",
      category: "Motivation",
      title: "Keep Going",
      message: "You're on track! Log your meals, complete your workout, and rest well tonight.",
      priority: "low",
    });
  }

  return recommendations;
}

// ── Chat Response Library ─────────────────────────────────────────────────────

const RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hey! I'm your AI fitness coach. How can I help you today?",
    "Hi there! Ready to crush your goals today? What's on your mind?",
    "Hello! I'm here to help with training, nutrition, and recovery. What do you need?",
  ],
  nutrition: [
    "For your goals, aim for a balanced plate: lean protein, complex carbs, and healthy fats at every meal.",
    "Protein timing matters! Try to have 20-40g within 2 hours post-workout for optimal recovery.",
    "Hydration is key. Aim for at least 2-3 liters of water daily, more on training days.",
    "If you're struggling with protein, Greek yogurt, eggs, and lean meats are great go-to options.",
  ],
  training: [
    "Progressive overload is the key to gains. Try to increase weight, reps, or sets each week.",
    "Rest days are when you actually grow. Don't skip them!",
    "If you've been training hard all week, consider an active recovery day with light mobility work.",
    "Compound movements like squats, deadlifts, and bench press give you the most bang for your buck.",
  ],
  recovery: [
    "Sleep is your #1 recovery tool. Aim for 7-9 hours every night.",
    "Foam rolling and stretching after workouts can significantly reduce soreness.",
    "If a muscle group is still very sore, give it at least 48 hours before training it again.",
    "Consider deload weeks every 4-6 weeks to prevent overtraining.",
  ],
  motivation: [
    "Remember: consistency beats perfection. One missed day won't ruin your progress.",
    "Focus on the process, not just the outcome. Small daily habits lead to big results.",
    "You've already shown commitment by being here. That's more than most people do!",
    "Set micro-goals for this week. What's one thing you can do better than last week?",
  ],
  weight_loss: [
    "A caloric deficit of 300-500 kcal per day is sustainable and effective for fat loss.",
    "Don't cut calories too aggressively. Your body needs fuel to train and recover.",
    "Focus on protein intake during a cut — it preserves muscle and keeps you full.",
    "Cardio helps, but strength training is what keeps your metabolism elevated long-term.",
  ],
  muscle_gain: [
    "You need a slight caloric surplus (200-300 kcal above maintenance) to build muscle efficiently.",
    "Aim for 1.6-2.2g protein per kg bodyweight for optimal muscle protein synthesis.",
    "Train each muscle group 2x per week for maximum growth stimulus.",
    "Don't neglect sleep — growth hormone is primarily released during deep sleep.",
  ],
  default: [
    "That's a great question! For personalized advice, make sure your profile and tracking data are up to date.",
    "I'd recommend focusing on consistency with both nutrition and training. Small improvements compound over time.",
    "Every journey is different. What matters is you're here and working on yourself.",
  ],
};

export function getCoachResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return pickRandom(RESPONSES.greeting);
  }
  if (msg.includes("eat") || msg.includes("food") || msg.includes("nutrition") || msg.includes("diet") || msg.includes("calorie") || msg.includes("protein") || msg.includes("meal")) {
    return pickRandom(RESPONSES.nutrition);
  }
  if (msg.includes("train") || msg.includes("workout") || msg.includes("exercise") || msg.includes("lift") || msg.includes("sets") || msg.includes("reps")) {
    return pickRandom(RESPONSES.training);
  }
  if (msg.includes("rest") || msg.includes("recovery") || msg.includes("sleep") || msg.includes("sore") || msg.includes("tired")) {
    return pickRandom(RESPONSES.recovery);
  }
  if (msg.includes("motivat") || msg.includes("lazy") || msg.includes("quit") || msg.includes("hard") || msg.includes("struggle")) {
    return pickRandom(RESPONSES.motivation);
  }
  if (msg.includes("lose") || msg.includes("fat") || msg.includes("cut") || msg.includes("slim") || msg.includes("weight loss")) {
    return pickRandom(RESPONSES.weight_loss);
  }
  if (msg.includes("muscle") || msg.includes("gain") || msg.includes("bulk") || msg.includes("grow") || msg.includes("mass")) {
    return pickRandom(RESPONSES.muscle_gain);
  }

  return pickRandom(RESPONSES.default);
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
