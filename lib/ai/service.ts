import type { AIProviderType, AIProviderConfig, AICompletionRequest, AICompletionResponse, AIUsageEntry, AIUsageStats, AIFeatureFlags, SafetyCheck } from "./types";
import { type IAIProvider, RuleBasedProvider, OpenAIProvider, ClaudeProvider, GeminiProvider } from "./provider";

// ── Storage Keys ──────────────────────────────────────────────────────────────

const CONFIG_KEY = "fitnessapp_ai_config";
const USAGE_KEY = "fitnessapp_ai_usage";
const FLAGS_KEY = "fitnessapp_ai_flags";

// ── Default Config ────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AIProviderConfig = {
  provider: "rule_based",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1024,
  baseUrl: null,
  enabled: true,
};

const DEFAULT_FLAGS: AIFeatureFlags = {
  aiCoach: true,
  aiMealPlanner: false,
  aiWorkoutGenerator: false,
  aiInsights: false,
};

// ── Config Store ──────────────────────────────────────────────────────────────

export function loadAIConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveAIConfig(config: AIProviderConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadFeatureFlags(): AIFeatureFlags {
  try {
    const raw = localStorage.getItem(FLAGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_FLAGS;
}

export function saveFeatureFlags(flags: AIFeatureFlags) {
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

// ── Provider Factory ──────────────────────────────────────────────────────────

function createProvider(config: AIProviderConfig): IAIProvider {
  switch (config.provider) {
    case "openai":     return new OpenAIProvider(config);
    case "claude":     return new ClaudeProvider(config);
    case "gemini":     return new GeminiProvider(config);
    default:           return new RuleBasedProvider();
  }
}

// ── AI Service (Main Entry Point) ─────────────────────────────────────────────

export class AIService {
  private provider: IAIProvider;
  private fallback: IAIProvider;
  private config: AIProviderConfig;

  constructor() {
    this.config = loadAIConfig();
    this.provider = createProvider(this.config);
    this.fallback = new RuleBasedProvider();
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Safety check
    const safety = this.validateInput(request);
    if (!safety.passed) {
      return { content: safety.reason || "Request blocked by safety filter.", tokensUsed: 0, provider: "rule_based", model: "safety", cached: false };
    }

    try {
      // Try primary provider
      if (this.provider.isConfigured()) {
        const response = await this.provider.complete(request);
        this.trackUsage(response);

        // Validate output
        const outputSafety = this.validateOutput(response.content);
        if (!outputSafety.passed) {
          return { ...response, content: "I'm not able to provide that type of advice. Let me suggest something more appropriate." };
        }

        return response;
      }
    } catch (error) {
      console.error("AI provider error, falling back:", error);
    }

    // Fallback to rule-based
    const response = await this.fallback.complete(request);
    this.trackUsage(response);
    return response;
  }

  getActiveProvider(): string {
    return this.provider.isConfigured() ? this.provider.name : this.fallback.name;
  }

  getConfig(): AIProviderConfig {
    return this.config;
  }

  // ── Safety Layer ─────────────────────────────────────────────────────────

  private validateInput(request: AICompletionRequest): SafetyCheck {
    const lastMsg = request.messages[request.messages.length - 1]?.content || "";
    const lower = lastMsg.toLowerCase();

    // Block harmful content
    const blocked = ["self-harm", "suicide", "eating disorder", "anorexia", "purging", "laxative abuse"];
    for (const term of blocked) {
      if (lower.includes(term)) {
        return { passed: false, reason: "I'm not qualified to help with that topic. Please consult a healthcare professional or call a helpline for support." };
      }
    }

    // Block non-fitness
    if (lower.includes("illegal") || lower.includes("steroid") || lower.includes("inject")) {
      return { passed: false, reason: "I can only provide advice on safe, legal fitness and nutrition practices. Please consult a medical professional for other topics." };
    }

    return { passed: true, reason: null };
  }

  private validateOutput(content: string): SafetyCheck {
    const lower = content.toLowerCase();
    const dangerous = ["skip meals entirely", "zero calorie", "extreme fasting", "never eat"];
    for (const term of dangerous) {
      if (lower.includes(term)) {
        return { passed: false, reason: "Potentially unsafe advice detected" };
      }
    }
    return { passed: true, reason: null };
  }

  // ── Usage Tracking ───────────────────────────────────────────────────────

  private trackUsage(response: AICompletionResponse) {
    if (response.tokensUsed === 0 && response.provider === "rule_based") return;

    const entry: AIUsageEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      provider: response.provider,
      model: response.model,
      tokensUsed: response.tokensUsed,
      estimatedCost: this.estimateCost(response.tokensUsed, response.model),
      promptType: "chat",
    };

    const usage = loadUsage();
    usage.unshift(entry);
    saveUsage(usage.slice(0, 500)); // Keep last 500
  }

  private estimateCost(tokens: number, model: string): number {
    // Rough cost estimation per 1K tokens
    const costs: Record<string, number> = {
      "gpt-4o": 0.005, "gpt-4o-mini": 0.00015, "gpt-4": 0.03,
      "claude-3-sonnet": 0.003, "claude-3-haiku": 0.00025,
      "gemini-pro": 0.001, "gemini-flash": 0.0001,
    };
    const rate = costs[model] || 0.001;
    return (tokens / 1000) * rate;
  }
}

// ── Usage Store ───────────────────────────────────────────────────────────────

export function loadUsage(): AIUsageEntry[] {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsage(entries: AIUsageEntry[]) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(entries));
}

export function getUsageStats(): AIUsageStats {
  const usage = loadUsage();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7);

  const dailyEntries = usage.filter((u) => u.date === today);
  const monthlyEntries = usage.filter((u) => u.date.startsWith(monthStart));

  return {
    dailyRequests: dailyEntries.length,
    monthlyRequests: monthlyEntries.length,
    dailyTokens: dailyEntries.reduce((s, u) => s + u.tokensUsed, 0),
    monthlyTokens: monthlyEntries.reduce((s, u) => s + u.tokensUsed, 0),
    estimatedMonthlyCost: monthlyEntries.reduce((s, u) => s + u.estimatedCost, 0),
  };
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let serviceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!serviceInstance) serviceInstance = new AIService();
  return serviceInstance;
}

export function resetAIService() {
  serviceInstance = null;
}
