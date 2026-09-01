"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIUsageStats {
  dailyRequests: number;
  monthlyRequests: number;
  dailyTokens: number;
  monthlyTokens: number;
  estimatedMonthlyCost: number;
}

interface AIFeatureFlags {
  aiCoach: boolean;
  aiMealPlanner: boolean;
  aiWorkoutGenerator: boolean;
  aiInsights: boolean;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AISettingsPage() {
  const [usage, setUsage] = useState<AIUsageStats>({ dailyRequests: 0, monthlyRequests: 0, dailyTokens: 0, monthlyTokens: 0, estimatedMonthlyCost: 0 });
  const [provider, setProvider] = useState("rule_based");
  const [model, setModel] = useState("gpt-4o-mini");
  const [flags, setFlags] = useState<AIFeatureFlags>({ aiCoach: true, aiMealPlanner: false, aiWorkoutGenerator: false, aiInsights: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load AI config from platform_settings
      const { data: configData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "ai_config")
        .maybeSingle();

      if (configData?.value && typeof configData.value === "object") {
        const cfg = configData.value as Record<string, string>;
        setProvider(cfg.provider || "rule_based");
        setModel(cfg.model || "gpt-4o-mini");
      }

      // Load feature flags
      const { data: flagsData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "ai_feature_flags")
        .maybeSingle();

      if (flagsData?.value && typeof flagsData.value === "object") {
        const v = flagsData.value as Record<string, boolean>;
        setFlags({
          aiCoach: v.aiCoach ?? true,
          aiMealPlanner: v.aiMealPlanner ?? false,
          aiWorkoutGenerator: v.aiWorkoutGenerator ?? false,
          aiInsights: v.aiInsights ?? false,
        });
      }

      // Load usage stats
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7);

      const { data: usageData } = await supabase
        .from("ai_usage")
        .select("tokens_used, estimated_cost, date")
        .eq("user_id", user.id);

      if (usageData) {
        const dailyEntries = usageData.filter((u) => u.date === today);
        const monthlyEntries = usageData.filter((u) => u.date.startsWith(monthStart));
        setUsage({
          dailyRequests: dailyEntries.length,
          monthlyRequests: monthlyEntries.length,
          dailyTokens: dailyEntries.reduce((s, u) => s + u.tokens_used, 0),
          monthlyTokens: monthlyEntries.reduce((s, u) => s + u.tokens_used, 0),
          estimatedMonthlyCost: monthlyEntries.reduce((s, u) => s + u.estimated_cost, 0),
        });
      }

      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <PageLoader text="Loading AI settings..." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/ai" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr;</Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">View your AI configuration and usage.</p>
        </div>
      </div>

      {/* Current config */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-zinc-900">Configuration</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs text-zinc-400">Active Provider</p>
            <p className="text-sm font-bold text-zinc-900 capitalize">{provider.replace("_", " ")}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-xs text-zinc-400">Model</p>
            <p className="text-sm font-bold text-zinc-900">{model}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Provider configuration is managed by administrators. Contact support to change providers.</p>
      </div>

      {/* Feature status */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-zinc-900">AI Features</p>
        <div className="flex flex-col gap-2">
          {[
            { label: "AI Coach", enabled: flags.aiCoach },
            { label: "AI Meal Planner", enabled: flags.aiMealPlanner },
            { label: "AI Workout Generator", enabled: flags.aiWorkoutGenerator },
            { label: "AI Insights", enabled: flags.aiInsights },
          ].map((f) => (
            <div key={f.label} className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
              <span className="text-sm text-zinc-700">{f.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.enabled ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                {f.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-zinc-900">Usage This Month</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-lg font-bold text-zinc-900">{usage.monthlyRequests}</p>
            <p className="text-xs text-zinc-400">Requests</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-lg font-bold text-zinc-900">{usage.monthlyTokens.toLocaleString()}</p>
            <p className="text-xs text-zinc-400">Tokens</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-lg font-bold text-zinc-900">{usage.dailyRequests}</p>
            <p className="text-xs text-zinc-400">Today</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">${usage.estimatedMonthlyCost.toFixed(4)}</p>
            <p className="text-xs text-zinc-400">Est. Cost</p>
          </div>
        </div>
      </div>

      {/* Subscription note */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
        <p className="text-sm font-semibold text-violet-900">Premium AI Features</p>
        <p className="mt-1 text-xs text-violet-700">Free users get limited AI requests. Upgrade to Premium for higher limits and advanced AI features.</p>
        <Link href="/pricing" className="mt-3 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
          View Plans
        </Link>
      </div>
    </div>
  );
}
