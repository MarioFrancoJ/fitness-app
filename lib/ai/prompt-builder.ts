import type { PromptType, PromptTemplate, AIContext, AIMessage } from "./types";

// ── Prompt Templates ──────────────────────────────────────────────────────────

const TEMPLATES: Record<PromptType, PromptTemplate> = {
  nutrition_coach: {
    type: "nutrition_coach",
    systemPrompt: "You are an expert nutrition coach. Provide evidence-based dietary advice personalized to the user's goals, current intake, and body composition. Be specific with recommendations (exact grams, meal ideas). Never recommend extreme diets or harmful restrictions.",
    contextInstructions: "Consider their calorie target, protein needs, current intake today, and weekly averages.",
  },
  workout_coach: {
    type: "workout_coach",
    systemPrompt: "You are an expert strength and conditioning coach. Provide safe, progressive training advice based on the user's experience level, equipment access, and goals. Emphasize proper form and injury prevention.",
    contextInstructions: "Consider their training frequency, current streak, goal, and recent workout history.",
  },
  recovery_coach: {
    type: "recovery_coach",
    systemPrompt: "You are a recovery and wellness specialist. Provide advice on sleep, stress management, active recovery, and injury prevention. Prioritize rest when signs of overtraining are detected.",
    contextInstructions: "Consider their training volume, sleep quality, stress levels, and workout frequency.",
  },
  motivation_coach: {
    type: "motivation_coach",
    systemPrompt: "You are a supportive fitness mentor. Help maintain motivation, celebrate progress, reframe setbacks positively, and set achievable micro-goals. Be encouraging but honest.",
    contextInstructions: "Consider their goal progress percentage, streak, consistency level, and recent achievements.",
  },
  meal_planner: {
    type: "meal_planner",
    systemPrompt: "You are a meal planning specialist. Generate practical, balanced meal plans that match calorie and macro targets. Include simple recipes with common ingredients. Consider meal prep efficiency.",
    contextInstructions: "Use their calorie target, protein target, and fitness goal to structure meals.",
  },
  workout_generator: {
    type: "workout_generator",
    systemPrompt: "You are a program design specialist. Create structured workout programs with appropriate volume, intensity, and progression. Match programs to goals, experience level, and available equipment.",
    contextInstructions: "Consider their goal, training experience (based on session count), and preferred training frequency.",
  },
  insights: {
    type: "insights",
    systemPrompt: "You are a data analyst specializing in fitness progress. Provide clear insights about trends, plateaus, and areas for improvement based on the user's historical data. Be objective and actionable.",
    contextInstructions: "Analyze their weight trend, measurement changes, training consistency, and nutrition adherence.",
  },
};

// ── Prompt Builder ────────────────────────────────────────────────────────────

export function buildPrompt(type: PromptType, userMessage: string, context: AIContext): AIMessage[] {
  const template = TEMPLATES[type];
  const messages: AIMessage[] = [];

  // System prompt with context
  let systemContent = template.systemPrompt + "\n\n";
  systemContent += "USER CONTEXT:\n";
  systemContent += formatContext(context);
  systemContent += "\n\nINSTRUCTIONS: " + template.contextInstructions;

  messages.push({ role: "system", content: systemContent });
  messages.push({ role: "user", content: userMessage });

  return messages;
}

export function buildChatPrompt(conversationHistory: AIMessage[], newMessage: string, context: AIContext): AIMessage[] {
  const messages: AIMessage[] = [];

  // General coach system prompt
  let systemContent = "You are a personalized AI fitness coach. You help with nutrition, training, recovery, and motivation. ";
  systemContent += "Be concise, specific, and actionable. Use the user's data to personalize advice.\n\n";
  systemContent += "USER CONTEXT:\n" + formatContext(context);

  messages.push({ role: "system", content: systemContent });

  // Add conversation history (last 10 messages)
  const recent = conversationHistory.slice(-10);
  messages.push(...recent);

  messages.push({ role: "user", content: newMessage });

  return messages;
}

function formatContext(context: AIContext): string {
  const lines: string[] = [];

  if (context.profile) {
    const p = context.profile;
    lines.push(`- Name: ${p.name}`);
    if (p.weight) lines.push(`- Weight: ${p.weight} kg`);
    if (p.height) lines.push(`- Height: ${p.height} cm`);
    if (p.fitnessGoal) lines.push(`- Goal: ${p.fitnessGoal}`);
    if (p.activityLevel) lines.push(`- Activity: ${p.activityLevel}`);
  }

  if (context.nutrition) {
    const n = context.nutrition;
    lines.push(`- Today's calories: ${n.todayCalories}/${Math.round(n.calorieTarget)} kcal`);
    lines.push(`- Today's protein: ${n.todayProtein}/${Math.round(n.proteinTarget)}g`);
    lines.push(`- Meals logged today: ${n.mealsLoggedToday}`);
    lines.push(`- Avg weekly calories: ${Math.round(n.avgCaloriesWeek)} kcal`);
  }

  if (context.training) {
    const t = context.training;
    lines.push(`- Workouts this week: ${t.workoutsThisWeek}`);
    lines.push(`- Training streak: ${t.currentStreak} days`);
    lines.push(`- Total sessions: ${t.totalSessions}`);
    if (t.lastWorkoutDate) lines.push(`- Last workout: ${t.lastWorkoutDate}`);
  }

  if (context.progress) {
    const pr = context.progress;
    if (pr.currentWeight && pr.goalWeight) lines.push(`- Weight: ${pr.currentWeight} kg (goal: ${pr.goalWeight} kg)`);
    if (pr.weightChange !== null) lines.push(`- Weight change from start: ${pr.weightChange > 0 ? "+" : ""}${pr.weightChange.toFixed(1)} kg`);
    lines.push(`- Measurements trend: ${pr.measurementsTrend}`);
  }

  if (context.goals) {
    const g = context.goals;
    lines.push(`- Goal progress: ${Math.round(g.goalProgress)}%`);
    lines.push(`- Days active: ${g.daysActive}`);
    lines.push(`- Consistency: ${g.consistency}`);
  }

  return lines.length > 0 ? lines.join("\n") : "No data available yet.";
}

export function getAvailablePromptTypes(): { type: PromptType; label: string }[] {
  return [
    { type: "nutrition_coach", label: "Nutrition Coach" },
    { type: "workout_coach", label: "Workout Coach" },
    { type: "recovery_coach", label: "Recovery Coach" },
    { type: "motivation_coach", label: "Motivation Coach" },
    { type: "meal_planner", label: "Meal Planner" },
    { type: "workout_generator", label: "Workout Generator" },
    { type: "insights", label: "Insights & Analysis" },
  ];
}
