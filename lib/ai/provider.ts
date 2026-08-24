import type { AIProviderType, AIProviderConfig, AICompletionRequest, AICompletionResponse } from "./types";

// ── Provider Interface (all providers implement this) ─────────────────────────

export interface IAIProvider {
  readonly type: AIProviderType;
  readonly name: string;
  isConfigured(): boolean;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}

// ── Rule-Based Fallback Provider ──────────────────────────────────────────────

export class RuleBasedProvider implements IAIProvider {
  readonly type: AIProviderType = "rule_based";
  readonly name = "Rule-Based (Fallback)";

  isConfigured(): boolean {
    return true; // Always available
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const lastMessage = request.messages[request.messages.length - 1]?.content || "";
    const response = this.generateResponse(lastMessage, request.context);

    return {
      content: response,
      tokensUsed: 0,
      provider: "rule_based",
      model: "internal",
      cached: false,
    };
  }

  private generateResponse(message: string, context?: AICompletionRequest["context"]): string {
    const msg = message.toLowerCase();

    // Context-aware responses
    if (context?.nutrition) {
      if (msg.includes("eat") || msg.includes("food") || msg.includes("meal") || msg.includes("nutrition")) {
        const { todayCalories, calorieTarget, todayProtein, proteinTarget } = context.nutrition;
        if (todayCalories > 0 && todayCalories < calorieTarget * 0.5) {
          return `You've had ${todayCalories} kcal so far today out of your ${Math.round(calorieTarget)} target. You still have room for a solid meal. Focus on protein-rich options to hit your ${Math.round(proteinTarget)}g target.`;
        }
        if (todayProtein < proteinTarget * 0.5) {
          return `Your protein is at ${todayProtein}g today — aim for ${Math.round(proteinTarget)}g. Consider adding Greek yogurt, chicken breast, or a protein shake to close the gap.`;
        }
      }
    }

    if (context?.training) {
      if (msg.includes("workout") || msg.includes("train") || msg.includes("exercise")) {
        const { workoutsThisWeek, currentStreak } = context.training;
        if (workoutsThisWeek < 3) {
          return `You've trained ${workoutsThisWeek} time${workoutsThisWeek !== 1 ? "s" : ""} this week. Try to fit in at least 3 sessions for optimal progress. ${currentStreak > 0 ? `Your current streak is ${currentStreak} days — keep it going!` : "Start building your streak today!"}`;
        }
        return `Great work — ${workoutsThisWeek} workouts this week! ${currentStreak >= 7 ? `Amazing ${currentStreak}-day streak!` : "Keep pushing toward your goals."}`;
      }
    }

    if (context?.progress) {
      if (msg.includes("progress") || msg.includes("weight") || msg.includes("goal")) {
        const { currentWeight, goalWeight, weightChange } = context.progress;
        if (currentWeight && goalWeight) {
          const diff = Math.abs(currentWeight - goalWeight);
          if (diff <= 2) return `You're only ${diff.toFixed(1)} kg from your goal weight of ${goalWeight} kg. Stay consistent with your nutrition and training — you're almost there!`;
          return `Current: ${currentWeight} kg, Goal: ${goalWeight} kg (${diff.toFixed(1)} kg to go). ${weightChange && weightChange < 0 ? "You're making progress!" : "Focus on consistency."}`;
        }
      }
    }

    // Generic keyword responses
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "Hey! I'm your AI fitness coach. I can help with nutrition, training, recovery, and goal setting. What would you like to work on?";
    }
    if (msg.includes("recover") || msg.includes("rest") || msg.includes("sleep") || msg.includes("tired")) {
      return "Recovery is crucial for progress. Aim for 7-9 hours of sleep, stay hydrated, and consider foam rolling. If you're feeling very fatigued, a rest day is more productive than pushing through.";
    }
    if (msg.includes("motivat") || msg.includes("quit") || msg.includes("hard")) {
      return "Every champion was once a beginner. Focus on small daily wins rather than perfection. You showed up today — that matters. What's one thing you can do right now to move forward?";
    }
    if (msg.includes("fat") || msg.includes("lose") || msg.includes("cut")) {
      return "For fat loss: maintain a moderate calorie deficit (300-500 kcal below maintenance), keep protein high (2g/kg bodyweight), train with weights to preserve muscle, and be patient — sustainable loss is 0.5-1 kg per week.";
    }
    if (msg.includes("muscle") || msg.includes("gain") || msg.includes("bulk") || msg.includes("grow")) {
      return "For muscle gain: eat in a slight surplus (200-300 kcal above maintenance), prioritize protein (1.6-2.2g/kg), progressive overload in training, and get adequate sleep for recovery and growth hormone release.";
    }

    return "I'm here to help with your fitness journey! Ask me about nutrition, training plans, recovery strategies, or goal setting. The more specific your question, the better I can help.";
  }
}

// ── OpenAI Provider (Placeholder — requires API key) ──────────────────────────

export class OpenAIProvider implements IAIProvider {
  readonly type: AIProviderType = "openai";
  readonly name = "OpenAI";
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Placeholder: In production, this would call the OpenAI API
    // For now, fall back to rule-based
    const fallback = new RuleBasedProvider();
    const response = await fallback.complete(request);
    return { ...response, provider: "openai", model: this.config.model };
  }
}

// ── Claude Provider (Placeholder) ─────────────────────────────────────────────

export class ClaudeProvider implements IAIProvider {
  readonly type: AIProviderType = "claude";
  readonly name = "Claude (Anthropic)";
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const fallback = new RuleBasedProvider();
    const response = await fallback.complete(request);
    return { ...response, provider: "claude", model: this.config.model };
  }
}

// ── Gemini Provider (Placeholder) ─────────────────────────────────────────────

export class GeminiProvider implements IAIProvider {
  readonly type: AIProviderType = "gemini";
  readonly name = "Gemini (Google)";
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const fallback = new RuleBasedProvider();
    const response = await fallback.complete(request);
    return { ...response, provider: "gemini", model: this.config.model };
  }
}
