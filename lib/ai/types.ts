// ── Provider Types ────────────────────────────────────────────────────────────

export type AIProviderType = "openai" | "claude" | "gemini" | "local_llm" | "ollama" | "openrouter" | "rule_based";

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseUrl: string | null;
  enabled: boolean;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  context?: AIContext;
}

export interface AICompletionResponse {
  content: string;
  tokensUsed: number;
  provider: AIProviderType;
  model: string;
  cached: boolean;
}

// ── Context Types ─────────────────────────────────────────────────────────────

export interface AIContext {
  profile: UserProfileContext | null;
  nutrition: NutritionContext | null;
  training: TrainingContext | null;
  progress: ProgressContext | null;
  goals: GoalContext | null;
}

export interface UserProfileContext {
  name: string;
  gender: string;
  weight: number | null;
  height: number | null;
  activityLevel: string;
  fitnessGoal: string;
}

export interface NutritionContext {
  todayCalories: number;
  todayProtein: number;
  calorieTarget: number;
  proteinTarget: number;
  mealsLoggedToday: number;
  avgCaloriesWeek: number;
}

export interface TrainingContext {
  workoutsThisWeek: number;
  lastWorkoutDate: string | null;
  currentStreak: number;
  totalSessions: number;
  avgDuration: number;
}

export interface ProgressContext {
  currentWeight: number | null;
  startingWeight: number | null;
  goalWeight: number | null;
  weightChange: number | null;
  measurementsTrend: "improving" | "stable" | "declining" | "unknown";
}

export interface GoalContext {
  primaryGoal: string;
  goalProgress: number; // 0-100
  daysActive: number;
  consistency: "high" | "medium" | "low";
}

// ── Prompt Types ──────────────────────────────────────────────────────────────

export type PromptType = "nutrition_coach" | "workout_coach" | "recovery_coach" | "motivation_coach" | "meal_planner" | "workout_generator" | "insights";

export interface PromptTemplate {
  type: PromptType;
  systemPrompt: string;
  contextInstructions: string;
}

// ── Usage Tracking ────────────────────────────────────────────────────────────

export interface AIUsageEntry {
  id: string;
  date: string;
  provider: AIProviderType;
  model: string;
  tokensUsed: number;
  estimatedCost: number;
  promptType: PromptType | "chat";
}

export interface AIUsageStats {
  dailyRequests: number;
  monthlyRequests: number;
  dailyTokens: number;
  monthlyTokens: number;
  estimatedMonthlyCost: number;
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export interface AIFeatureFlags {
  aiCoach: boolean;
  aiMealPlanner: boolean;
  aiWorkoutGenerator: boolean;
  aiInsights: boolean;
}

// ── Safety ────────────────────────────────────────────────────────────────────

export interface SafetyCheck {
  passed: boolean;
  reason: string | null;
}
