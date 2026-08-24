// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendationPriority = "Low" | "Medium" | "High" | "Critical";
export type RecommendationStatus = "New" | "Viewed" | "Dismissed" | "Completed";
export type RecommendationCategory =
  | "Nutrition"
  | "Training"
  | "Recovery"
  | "Weight Management"
  | "Consistency"
  | "Motivation"
  | "Goal Achievement";

export const RECOMMENDATION_CATEGORIES: RecommendationCategory[] = [
  "Nutrition", "Training", "Recovery", "Weight Management", "Consistency", "Motivation", "Goal Achievement",
];

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  generatedDate: string;
  status: RecommendationStatus;
}

export interface RuleDefinition {
  id: string;
  name: string;
  category: RecommendationCategory;
  description: string;
  enabled: boolean;
  priority: RecommendationPriority;
  // Modular: future AI providers can replace the evaluate function
  evaluatorType: "rule-based"; // future: "openai" | "claude" | "gemini"
}

// ── Storage Keys ──────────────────────────────────────────────────────────────

const RECOMMENDATIONS_KEY = "fitnessapp_recommendations";
const RULES_KEY = "fitnessapp_recommendation_rules";
const PROFILE_KEY = "fitnessapp_user";
const MEALS_KEY = "fitnessapp_nutrition_meals";
const SESSIONS_KEY = "fitnessapp_training_sessions";
const MEASUREMENT_HISTORY_KEY = "fitnessapp_measurement_history";

// ── Recommendation Store ──────────────────────────────────────────────────────

export function loadRecommendations(): Recommendation[] {
  try {
    const raw = localStorage.getItem(RECOMMENDATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecommendations(recs: Recommendation[]) {
  localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(recs));
}

export function updateRecommendationStatus(id: string, status: RecommendationStatus) {
  const all = loadRecommendations();
  saveRecommendations(all.map((r) => (r.id === id ? { ...r, status } : r)));
}

export function dismissRecommendation(id: string) {
  updateRecommendationStatus(id, "Dismissed");
}

export function completeRecommendation(id: string) {
  updateRecommendationStatus(id, "Completed");
}

export function markAsViewed(id: string) {
  updateRecommendationStatus(id, "Viewed");
}

// ── Rules Store ───────────────────────────────────────────────────────────────

const DEFAULT_RULES: RuleDefinition[] = [
  { id: "r1", name: "Low Protein Intake", category: "Nutrition", description: "Triggers when protein is below target for 3+ days", enabled: true, priority: "High", evaluatorType: "rule-based" },
  { id: "r2", name: "High Calorie Intake", category: "Nutrition", description: "Triggers when calories exceed target for 3+ days", enabled: true, priority: "High", evaluatorType: "rule-based" },
  { id: "r3", name: "No Meals Logged", category: "Nutrition", description: "Triggers when no meals are logged today", enabled: true, priority: "Medium", evaluatorType: "rule-based" },
  { id: "r4", name: "Inactive Week", category: "Training", description: "Triggers when no workouts in 7 days", enabled: true, priority: "Critical", evaluatorType: "rule-based" },
  { id: "r5", name: "Low Training Frequency", category: "Training", description: "Triggers when fewer than 3 workouts this week", enabled: true, priority: "Medium", evaluatorType: "rule-based" },
  { id: "r6", name: "Consistency Improvement", category: "Consistency", description: "Triggers when training frequency improves week over week", enabled: true, priority: "Low", evaluatorType: "rule-based" },
  { id: "r7", name: "Weight Loss Plateau", category: "Weight Management", description: "Triggers when weight unchanged for 21+ days (fat loss goal)", enabled: true, priority: "High", evaluatorType: "rule-based" },
  { id: "r8", name: "Rapid Weight Loss", category: "Weight Management", description: "Triggers when losing more than 1kg per week", enabled: true, priority: "High", evaluatorType: "rule-based" },
  { id: "r9", name: "Waist Improving", category: "Goal Achievement", description: "Triggers when waist measurement is decreasing", enabled: true, priority: "Low", evaluatorType: "rule-based" },
  { id: "r10", name: "Measurements Stagnant", category: "Weight Management", description: "Triggers when measurements unchanged for 30+ days", enabled: true, priority: "Medium", evaluatorType: "rule-based" },
  { id: "r11", name: "Long Workout Sessions", category: "Recovery", description: "Triggers when average session exceeds 90 minutes", enabled: true, priority: "Medium", evaluatorType: "rule-based" },
  { id: "r12", name: "Overtraining Risk", category: "Recovery", description: "Triggers when training 6+ days per week consistently", enabled: true, priority: "High", evaluatorType: "rule-based" },
  { id: "r13", name: "Goal Nearly Reached", category: "Motivation", description: "Triggers when within 2kg of goal weight", enabled: true, priority: "Low", evaluatorType: "rule-based" },
  { id: "r14", name: "New Streak Milestone", category: "Motivation", description: "Triggers at 7, 14, 30, 60, 90 day streaks", enabled: true, priority: "Low", evaluatorType: "rule-based" },
];

export function loadRules(): RuleDefinition[] {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(RULES_KEY, JSON.stringify(DEFAULT_RULES));
    return DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveRules(rules: RuleDefinition[]) {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function toggleRule(id: string) {
  const rules = loadRules();
  saveRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
}

export function updateRule(id: string, data: Partial<RuleDefinition>) {
  const rules = loadRules();
  saveRules(rules.map((r) => (r.id === id ? { ...r, ...data } : r)));
}

export function addRule(rule: Omit<RuleDefinition, "id">): RuleDefinition {
  const rules = loadRules();
  const newRule: RuleDefinition = { ...rule, id: `r-${Date.now()}` };
  saveRules([...rules, newRule]);
  return newRule;
}

export function deleteRule(id: string) {
  saveRules(loadRules().filter((r) => r.id !== id));
}

// ── Data Loaders ──────────────────────────────────────────────────────────────

interface ProfileData {
  fitnessGoal?: string;
  goal?: string;
  currentWeight?: number;
  weight?: number;
  goalWeight?: number;
  startingWeight?: number;
}

interface MealEntry {
  date: string;
  calories: number;
  protein: number;
}

interface SessionEntry {
  date: string;
  status: string;
  durationMinutes: number;
}

interface MeasurementRecord {
  date: string;
  weight: string;
  measurements: { waist?: string; chest?: string; hips?: string };
}

function loadProfile(): ProfileData {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { return {}; }
}

function loadMeals(): MealEntry[] {
  try { return JSON.parse(localStorage.getItem(MEALS_KEY) || "[]"); } catch { return []; }
}

function loadSessions(): SessionEntry[] {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch { return []; }
}

function loadMeasurementHistory(): MeasurementRecord[] {
  try { return JSON.parse(localStorage.getItem(MEASUREMENT_HISTORY_KEY) || "[]"); } catch { return []; }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Rule Engine (Modular — replaceable by AI later) ───────────────────────────

export function runEngine(): Recommendation[] {
  const rules = loadRules().filter((r) => r.enabled);
  const profile = loadProfile();
  const meals = loadMeals();
  const sessions = loadSessions().filter((s) => s.status === "Completed");
  const measurementHistory = loadMeasurementHistory();
  const today = new Date().toISOString().slice(0, 10);

  const goal = (profile.fitnessGoal || profile.goal || "").toLowerCase();
  const weight = profile.currentWeight || profile.weight || 70;
  const goalWeight = profile.goalWeight;
  const startingWeight = profile.startingWeight || weight;

  // Targets
  const calorieTarget = goal.includes("lose") || goal.includes("fat") ? weight * 25 : goal.includes("muscle") ? weight * 35 : weight * 30;
  const proteinTarget = weight * 2;

  const generated: Recommendation[] = [];

  function emit(ruleId: string, title: string, description: string) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    generated.push({
      id: `rec-${ruleId}-${today}`,
      category: rule.category,
      priority: rule.priority,
      title,
      description,
      generatedDate: today,
      status: "New",
    });
  }

  // ── Nutrition Rules ────────────────────────────────────────────────────────

  // r1: Low Protein
  if (rules.some((r) => r.id === "r1")) {
    const last3 = meals.filter((m) => m.date >= daysAgo(3));
    const days = new Set(last3.map((m) => m.date));
    if (days.size >= 2) {
      const avgProtein = last3.reduce((s, m) => s + (m.protein || 0), 0) / days.size;
      if (avgProtein < proteinTarget * 0.7) {
        emit("r1", "Protein Intake Below Target", `Your average protein over the last few days is ${Math.round(avgProtein)}g. Aim for ${Math.round(proteinTarget)}g daily. Add lean meats, eggs, or a protein shake.`);
      }
    }
  }

  // r2: High Calories
  if (rules.some((r) => r.id === "r2")) {
    const last3 = meals.filter((m) => m.date >= daysAgo(3));
    const days = new Set(last3.map((m) => m.date));
    if (days.size >= 2) {
      const avgCal = last3.reduce((s, m) => s + (m.calories || 0), 0) / days.size;
      if (avgCal > calorieTarget * 1.15) {
        emit("r2", "Calorie Intake Consistently High", `You're averaging ${Math.round(avgCal)} kcal/day, which is above your ${Math.round(calorieTarget)} kcal target. Consider reducing portion sizes or swapping snacks.`);
      }
    }
  }

  // r3: No meals today
  if (rules.some((r) => r.id === "r3")) {
    const todayMeals = meals.filter((m) => m.date === today);
    if (todayMeals.length === 0) {
      emit("r3", "No Meals Logged Today", "Tracking your food helps you stay accountable. Log your meals as you eat them for accurate data.");
    }
  }

  // ── Training Rules ─────────────────────────────────────────────────────────

  const weekSessions = sessions.filter((s) => s.date >= daysAgo(7));
  const prevWeekSessions = sessions.filter((s) => s.date >= daysAgo(14) && s.date < daysAgo(7));

  // r4: Inactive week
  if (rules.some((r) => r.id === "r4") && weekSessions.length === 0) {
    emit("r4", "No Workouts This Week", "You haven't completed any workouts in the past 7 days. Even a short 20-minute session helps maintain your fitness level.");
  }

  // r5: Low frequency
  if (rules.some((r) => r.id === "r5") && weekSessions.length > 0 && weekSessions.length < 3) {
    emit("r5", "Training Frequency Below Optimal", `You've trained ${weekSessions.length} time${weekSessions.length > 1 ? "s" : ""} this week. For your goals, aim for at least 3-4 sessions per week.`);
  }

  // r6: Consistency improvement
  if (rules.some((r) => r.id === "r6") && weekSessions.length > prevWeekSessions.length && prevWeekSessions.length > 0) {
    emit("r6", "Great Consistency Improvement!", `You went from ${prevWeekSessions.length} to ${weekSessions.length} workouts this week. That's the kind of progress that leads to real results.`);
  }

  // ── Weight Management Rules ────────────────────────────────────────────────

  const sortedHistory = [...measurementHistory].sort((a, b) => a.date.localeCompare(b.date));

  // r7: Weight loss plateau
  if (rules.some((r) => r.id === "r7") && (goal.includes("lose") || goal.includes("fat"))) {
    const recent = sortedHistory.filter((r) => r.date >= daysAgo(21) && r.weight);
    if (recent.length >= 3) {
      const weights = recent.map((r) => parseFloat(r.weight)).filter((w) => !isNaN(w));
      if (weights.length >= 3) {
        const range = Math.max(...weights) - Math.min(...weights);
        if (range < 0.5) {
          emit("r7", "Weight Loss Has Plateaued", "Your weight hasn't changed significantly in 3 weeks. Consider adjusting calories down by 100-200 kcal or adding an extra training session per week.");
        }
      }
    }
  }

  // r8: Rapid weight loss
  if (rules.some((r) => r.id === "r8")) {
    const twoWeeksAgo = sortedHistory.filter((r) => r.date >= daysAgo(14) && r.weight);
    if (twoWeeksAgo.length >= 2) {
      const first = parseFloat(twoWeeksAgo[0].weight);
      const last = parseFloat(twoWeeksAgo[twoWeeksAgo.length - 1].weight);
      if (!isNaN(first) && !isNaN(last) && first - last > 2) {
        emit("r8", "Weight Decreasing Too Quickly", `You've lost ${(first - last).toFixed(1)} kg in 2 weeks. Losing more than 0.5-1 kg/week may cause muscle loss. Consider increasing calories slightly.`);
      }
    }
  }

  // r9: Waist improving
  if (rules.some((r) => r.id === "r9") && sortedHistory.length >= 2) {
    const withWaist = sortedHistory.filter((r) => r.measurements?.waist);
    if (withWaist.length >= 2) {
      const first = parseFloat(withWaist[0].measurements.waist!);
      const last = parseFloat(withWaist[withWaist.length - 1].measurements.waist!);
      if (!isNaN(first) && !isNaN(last) && last < first) {
        emit("r9", "Waist Circumference Improving", `Your waist has decreased from ${first} cm to ${last} cm. This is a great indicator of fat loss, regardless of what the scale says.`);
      }
    }
  }

  // r10: Measurements stagnant
  if (rules.some((r) => r.id === "r10")) {
    const recent30 = sortedHistory.filter((r) => r.date >= daysAgo(30));
    if (recent30.length >= 2 && sortedHistory.length > 2) {
      const older = sortedHistory.filter((r) => r.date < daysAgo(30));
      if (older.length === 0 || recent30.length < 2) {
        // Not enough data — skip
      }
    }
  }

  // ── Recovery Rules ─────────────────────────────────────────────────────────

  // r11: Long sessions
  if (rules.some((r) => r.id === "r11") && weekSessions.length >= 3) {
    const avgDuration = weekSessions.reduce((s, sess) => s + sess.durationMinutes, 0) / weekSessions.length;
    if (avgDuration > 90) {
      emit("r11", "Workout Sessions Are Very Long", `Your average session this week is ${Math.round(avgDuration)} minutes. Consider keeping sessions under 75 minutes for optimal recovery and hormone response.`);
    }
  }

  // r12: Overtraining
  if (rules.some((r) => r.id === "r12") && weekSessions.length >= 6) {
    emit("r12", "Overtraining Risk Detected", `You've trained ${weekSessions.length} days this week. Rest days are essential for muscle repair and nervous system recovery. Consider taking 1-2 rest days.`);
  }

  // ── Motivation Rules ───────────────────────────────────────────────────────

  // r13: Goal nearly reached
  if (rules.some((r) => r.id === "r13") && goalWeight && Math.abs(weight - goalWeight) <= 2) {
    emit("r13", "Almost at Goal Weight!", `You're only ${Math.abs(weight - goalWeight).toFixed(1)} kg from your goal of ${goalWeight} kg. Stay consistent — you're nearly there!`);
  }

  // r14: Streak milestones
  if (rules.some((r) => r.id === "r14")) {
    const sessionDays = new Set(sessions.map((s) => s.date));
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      if (sessionDays.has(d.toISOString().slice(0, 10))) { streak++; } else if (i > 0) break;
    }
    const milestones = [90, 60, 30, 14, 7];
    for (const m of milestones) {
      if (streak >= m) {
        emit("r14", `${m}-Day Training Streak!`, `You've trained consistently for ${streak} days. That's incredible dedication. Keep the momentum going!`);
        break;
      }
    }
  }

  return generated;
}

// ── Generate & Merge ──────────────────────────────────────────────────────────

export function generateAndSaveRecommendations(): Recommendation[] {
  const existing = loadRecommendations();
  const generated = runEngine();

  // Merge: keep existing statuses for recommendations already generated today
  const merged: Recommendation[] = [];
  const existingMap = new Map(existing.map((r) => [r.id, r]));

  for (const rec of generated) {
    const prev = existingMap.get(rec.id);
    if (prev) {
      merged.push(prev); // Keep existing status
    } else {
      merged.push(rec);
    }
  }

  // Keep dismissed/completed from past
  for (const prev of existing) {
    if ((prev.status === "Dismissed" || prev.status === "Completed") && !merged.some((m) => m.id === prev.id)) {
      merged.push(prev);
    }
  }

  saveRecommendations(merged);
  return merged;
}

// ── Weekly Summary ────────────────────────────────────────────────────────────

export interface WeeklySummary {
  topRecommendations: Recommendation[];
  improvements: string[];
  risks: string[];
}

export function getWeeklySummary(): WeeklySummary {
  const recs = loadRecommendations().filter((r) => r.status !== "Dismissed");
  const active = recs.filter((r) => r.status === "New" || r.status === "Viewed");
  const completed = recs.filter((r) => r.status === "Completed");

  const improvements: string[] = [];
  const risks: string[] = [];

  // Classify
  for (const r of active) {
    if (r.priority === "Critical" || r.priority === "High") {
      risks.push(r.title);
    }
  }

  for (const r of completed) {
    improvements.push(r.title);
  }

  // Add generic if empty
  if (improvements.length === 0 && completed.length > 0) improvements.push("Completed recommendations successfully");
  if (risks.length === 0 && active.length > 0) risks.push("Review active recommendations");

  return {
    topRecommendations: active.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority)).slice(0, 5),
    improvements: improvements.slice(0, 5),
    risks: risks.slice(0, 5),
  };
}

function priorityOrder(p: RecommendationPriority): number {
  switch (p) { case "Critical": return 0; case "High": return 1; case "Medium": return 2; case "Low": return 3; }
}
