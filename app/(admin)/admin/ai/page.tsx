"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecommendationCategory = "Nutrition" | "Training" | "Recovery" | "Weight Management" | "Consistency" | "Motivation" | "Goal Achievement";
type RecommendationPriority = "Low" | "Medium" | "High" | "Critical";

interface RuleDefinition {
  id: string;
  name: string;
  category: RecommendationCategory;
  description: string;
  enabled: boolean;
  priority: RecommendationPriority;
  evaluator_type: string;
}

interface AIConfig {
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

interface AIFeatureFlags {
  aiCoach: boolean;
  aiMealPlanner: boolean;
  aiWorkoutGenerator: boolean;
  aiInsights: boolean;
}

const RECOMMENDATION_CATEGORIES: RecommendationCategory[] = ["Nutrition", "Training", "Recovery", "Weight Management", "Consistency", "Motivation", "Goal Achievement"];
const PRIORITIES: RecommendationPriority[] = ["Low", "Medium", "High", "Critical"];

function priorityBadge(p: string): string {
  switch (p) {
    case "Critical": return "bg-red-100 text-red-700";
    case "High": return "bg-orange-100 text-orange-700";
    case "Medium": return "bg-amber-100 text-amber-700";
    default: return "bg-emerald-100 text-emerald-700";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAIPage() {
  const { success: showToast } = useToast();
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | RecommendationCategory>("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // AI Config
  const [aiConfig, setAiConfig] = useState<AIConfig>({ provider: "rule_based", model: "gpt-4o-mini", apiKey: "", temperature: 0.7, maxTokens: 1024 });
  const [aiFlags, setAiFlags] = useState<AIFeatureFlags>({ aiCoach: true, aiMealPlanner: false, aiWorkoutGenerator: false, aiInsights: false });
  const [usageStats, setUsageStats] = useState({ monthlyRequests: 0, monthlyTokens: 0, dailyRequests: 0, estimatedCost: 0 });

  // Rule form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<RecommendationCategory>("Nutrition");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<RecommendationPriority>("Medium");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Load rules
      const { data: rulesData } = await supabase.from("recommendation_rules").select("*").order("name");
      if (rulesData) setRules(rulesData as RuleDefinition[]);

      // Load AI config from platform_settings
      const { data: configData } = await supabase.from("platform_settings").select("value").eq("key", "ai_config").maybeSingle();
      if (configData?.value && typeof configData.value === "object") {
        const v = configData.value as Record<string, any>;
        setAiConfig({ provider: v.provider || "rule_based", model: v.model || "gpt-4o-mini", apiKey: v.apiKey || "", temperature: v.temperature ?? 0.7, maxTokens: v.maxTokens ?? 1024 });
      }

      // Load feature flags
      const { data: flagsData } = await supabase.from("platform_settings").select("value").eq("key", "ai_feature_flags").maybeSingle();
      if (flagsData?.value && typeof flagsData.value === "object") {
        const v = flagsData.value as Record<string, boolean>;
        setAiFlags({ aiCoach: v.aiCoach ?? true, aiMealPlanner: v.aiMealPlanner ?? false, aiWorkoutGenerator: v.aiWorkoutGenerator ?? false, aiInsights: v.aiInsights ?? false });
      }

      // Load usage stats
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7);
      const { data: usageData } = await supabase.from("ai_usage").select("tokens_used, estimated_cost, date");
      if (usageData) {
        const daily = usageData.filter((u) => u.date === today);
        const monthly = usageData.filter((u) => u.date.startsWith(monthStart));
        setUsageStats({ monthlyRequests: monthly.length, monthlyTokens: monthly.reduce((s, u) => s + u.tokens_used, 0), dailyRequests: daily.length, estimatedCost: monthly.reduce((s, u) => s + u.estimated_cost, 0) });
      }

      setLoading(false);
    }
    loadData();
  }, []);


  // ── AI Config persistence ───────────────────────────────────────────────────

  async function saveConfig(newConfig: AIConfig) {
    setAiConfig(newConfig);
    const supabase = createClient();
    const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", "ai_config").maybeSingle();
    if (existing) {
      await supabase.from("platform_settings").update({ value: newConfig as any }).eq("key", "ai_config");
    } else {
      await supabase.from("platform_settings").insert({ key: "ai_config", value: newConfig as any });
    }
  }

  async function saveFlags(newFlags: AIFeatureFlags) {
    setAiFlags(newFlags);
    const supabase = createClient();
    const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", "ai_feature_flags").maybeSingle();
    if (existing) {
      await supabase.from("platform_settings").update({ value: newFlags as any }).eq("key", "ai_feature_flags");
    } else {
      await supabase.from("platform_settings").insert({ key: "ai_feature_flags", value: newFlags as any });
    }
  }

  // ── Rules CRUD ──────────────────────────────────────────────────────────────

  const filtered = rules.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  function resetForm() { setFormName(""); setFormCategory("Nutrition"); setFormDescription(""); setFormPriority("Medium"); setFormError(""); setEditId(null); setShowForm(false); }

  async function handleToggle(id: string) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const supabase = createClient();
    await supabase.from("recommendation_rules").update({ enabled: !rule.enabled }).eq("id", id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function handleEdit(rule: RuleDefinition) {
    setFormName(rule.name); setFormCategory(rule.category); setFormDescription(rule.description); setFormPriority(rule.priority); setEditId(rule.id); setShowForm(true);
  }

  async function handleDeleteRule(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("recommendation_rules").delete().eq("id", id);
    if (!error) { setRules((prev) => prev.filter((r) => r.id !== id)); showToast("Rule deleted"); }
    setDeleteTarget(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim()) { setFormError("Rule name is required."); return; }

    setSaving(true);
    const supabase = createClient();

    try {
      if (editId) {
        await supabase.from("recommendation_rules").update({ name: formName.trim(), category: formCategory, description: formDescription.trim(), priority: formPriority }).eq("id", editId);
        setRules((prev) => prev.map((r) => (r.id === editId ? { ...r, name: formName.trim(), category: formCategory, description: formDescription.trim(), priority: formPriority } : r)));
        showToast("Rule updated");
      } else {
        const { data: inserted, error } = await supabase.from("recommendation_rules").insert({ name: formName.trim(), category: formCategory, description: formDescription.trim(), priority: formPriority, enabled: true, evaluator_type: "rule-based" }).select("*").single();
        if (!error && inserted) { setRules((prev) => [...prev, inserted as RuleDefinition]); showToast("Rule created"); }
      }
      resetForm();
    } catch { setFormError("Failed to save."); }
    setSaving(false);
  }

  if (loading) {
    return <PageLoader />;
  }

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI & Recommendation Management</h1><p className="mt-1 text-sm text-zinc-500">Configure AI providers, feature flags, and recommendation rules.</p></div>

        {/* AI Provider Config */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">AI Provider Configuration</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-zinc-600">Provider</label><select value={aiConfig.provider} onChange={(e) => saveConfig({ ...aiConfig, provider: e.target.value })} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="rule_based">Rule-Based (Fallback)</option><option value="openai">OpenAI</option><option value="claude">Claude (Anthropic)</option><option value="gemini">Gemini (Google)</option><option value="ollama">Ollama (Local)</option><option value="openrouter">OpenRouter</option></select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-zinc-600">Model</label><input type="text" value={aiConfig.model} onChange={(e) => saveConfig({ ...aiConfig, model: e.target.value })} placeholder="gpt-4o-mini" className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-zinc-600">API Key</label><input type="password" value={aiConfig.apiKey} onChange={(e) => saveConfig({ ...aiConfig, apiKey: e.target.value })} placeholder="sk-..." className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-zinc-600">Temperature ({aiConfig.temperature})</label><input type="range" min={0} max={1} step={0.1} value={aiConfig.temperature} onChange={(e) => saveConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-zinc-600">Max Tokens</label><input type="number" value={aiConfig.maxTokens} onChange={(e) => saveConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) || 1024 })} min={100} max={8000} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">AI Feature Flags</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {([["aiCoach", "AI Coach"], ["aiMealPlanner", "AI Meal Planner"], ["aiWorkoutGenerator", "AI Workout Generator"], ["aiInsights", "AI Insights"]] as [keyof AIFeatureFlags, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-700">{label}</span>
                <button type="button" onClick={() => saveFlags({ ...aiFlags, [key]: !aiFlags[key] })} className={["relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", aiFlags[key] ? "bg-zinc-900" : "bg-zinc-200"].join(" ")}><span className={["inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", aiFlags[key] ? "translate-x-4" : "translate-x-0"].join(" ")} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"><p className="text-lg font-bold text-zinc-900">{usageStats.monthlyRequests}</p><p className="text-xs text-zinc-400">Monthly Requests</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"><p className="text-lg font-bold text-zinc-900">{usageStats.monthlyTokens.toLocaleString()}</p><p className="text-xs text-zinc-400">Monthly Tokens</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"><p className="text-lg font-bold text-zinc-900">{usageStats.dailyRequests}</p><p className="text-xs text-zinc-400">Today</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"><p className="text-lg font-bold text-emerald-600">${usageStats.estimatedCost.toFixed(4)}</p><p className="text-xs text-zinc-400">Est. Cost</p></div>
        </div>

        {/* Rules */}
        <div className="flex items-center justify-between">
          <div><h2 className="text-lg font-bold tracking-tight text-zinc-900">Recommendation Rules</h2><p className="mt-1 text-sm text-zinc-500">{enabledCount} enabled · {rules.length - enabledCount} disabled · {rules.length} total</p></div>
          <Button type="button" onClick={() => { resetForm(); setShowForm(true); }}>+ New Rule</Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">{editId ? "Edit Rule" : "New Rule"}</p>
            {formError && <p className="mb-3 text-xs text-red-500" role="alert">{formError}</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5"><label htmlFor="rule-name" className="text-sm font-medium text-zinc-700">Rule Name</label><input id="rule-name" type="text" value={formName} onChange={(e) => { setFormName(e.target.value); setFormError(""); }} placeholder="e.g. Low Protein Intake" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="rule-cat" className="text-sm font-medium text-zinc-700">Category</label><select id="rule-cat" value={formCategory} onChange={(e) => setFormCategory(e.target.value as RecommendationCategory)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{RECOMMENDATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="rule-pri" className="text-sm font-medium text-zinc-700">Priority</label><select id="rule-pri" value={formPriority} onChange={(e) => setFormPriority(e.target.value as RecommendationPriority)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-1.5"><label htmlFor="rule-desc" className="text-sm font-medium text-zinc-700">Description</label><input id="rule-desc" type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="When does this rule trigger?" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
            </div>
            <div className="mt-5 flex gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving..." : editId ? "Save Changes" : "Create Rule"}</Button><button type="button" onClick={resetForm} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Cancel</button></div>
          </form>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64"><svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg><input type="search" placeholder="Search rules..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as "All" | RecommendationCategory)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="All">All Categories</option>{RECOMMENDATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center"><p className="text-sm text-zinc-400">No rules found.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50"><tr><th className="px-5 py-3 font-semibold text-zinc-700">Enabled</th><th className="px-5 py-3 font-semibold text-zinc-700">Rule</th><th className="px-5 py-3 font-semibold text-zinc-700">Category</th><th className="px-5 py-3 font-semibold text-zinc-700">Priority</th><th className="px-5 py-3 font-semibold text-zinc-700">Actions</th></tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((rule) => (
                    <tr key={rule.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3"><button type="button" onClick={() => handleToggle(rule.id)} className={["relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", rule.enabled ? "bg-zinc-900" : "bg-zinc-200"].join(" ")}><span className={["inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", rule.enabled ? "translate-x-4" : "translate-x-0"].join(" ")} /></button></td>
                      <td className="px-5 py-3"><p className="font-medium text-zinc-900">{rule.name}</p><p className="text-xs text-zinc-400">{rule.description}</p></td>
                      <td className="px-5 py-3 text-zinc-600 text-xs">{rule.category}</td>
                      <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge(rule.priority)}`}>{rule.priority}</span></td>
                      <td className="px-5 py-3"><div className="flex gap-2"><button type="button" onClick={() => handleEdit(rule)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Edit</button><button type="button" onClick={() => setDeleteTarget(rule.id)} className="text-xs font-medium text-zinc-500 hover:text-red-600">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete rule?"
        description="This recommendation rule will be permanently removed."
        onConfirm={() => { if (deleteTarget) handleDeleteRule(deleteTarget); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
