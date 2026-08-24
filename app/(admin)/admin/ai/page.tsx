"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import {
  loadAIConfig, saveAIConfig, loadFeatureFlags, saveFeatureFlags, resetAIService, getUsageStats,
  type AIProviderType, type AIProviderConfig, type AIFeatureFlags, type AIUsageStats,
} from "@/lib/ai";
import {
  loadRules,
  saveRules,
  toggleRule,
  updateRule,
  addRule,
  deleteRule,
  RECOMMENDATION_CATEGORIES,
  type RuleDefinition,
  type RecommendationCategory,
  type RecommendationPriority,
} from "@/lib/recommendation-engine";

const PRIORITIES: RecommendationPriority[] = ["Low", "Medium", "High", "Critical"];

function priorityBadge(p: RecommendationPriority): string {
  switch (p) {
    case "Critical": return "bg-red-100 text-red-700";
    case "High":     return "bg-orange-100 text-orange-700";
    case "Medium":   return "bg-amber-100 text-amber-700";
    case "Low":      return "bg-emerald-100 text-emerald-700";
  }
}

export default function AdminRecommendationRulesPage() {
  const [rules, setRules] = useState<RuleDefinition[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | RecommendationCategory>("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // AI Provider config state
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>({ provider: "rule_based", apiKey: "", model: "gpt-4o-mini", temperature: 0.7, maxTokens: 1024, baseUrl: null, enabled: true });
  const [aiFlags, setAiFlags] = useState<AIFeatureFlags>({ aiCoach: true, aiMealPlanner: false, aiWorkoutGenerator: false, aiInsights: false });
  const [aiUsage, setAiUsage] = useState<AIUsageStats>({ dailyRequests: 0, monthlyRequests: 0, dailyTokens: 0, monthlyTokens: 0, estimatedMonthlyCost: 0 });

  // Form
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<RecommendationCategory>("Nutrition");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<RecommendationPriority>("Medium");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setRules(loadRules());
    setAiConfig(loadAIConfig());
    setAiFlags(loadFeatureFlags());
    setAiUsage(getUsageStats());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function refresh() { setRules(loadRules()); }

  const filtered = rules.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  function resetForm() {
    setFormName(""); setFormCategory("Nutrition"); setFormDescription("");
    setFormPriority("Medium"); setFormError(""); setEditId(null); setShowForm(false);
  }

  function handleToggle(id: string) {
    toggleRule(id);
    refresh();
  }

  function handleEdit(rule: RuleDefinition) {
    setFormName(rule.name);
    setFormCategory(rule.category);
    setFormDescription(rule.description);
    setFormPriority(rule.priority);
    setEditId(rule.id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    deleteRule(id);
    refresh();
    setToast("Rule deleted");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formName.trim()) { setFormError("Rule name is required."); return; }

    if (editId) {
      updateRule(editId, { name: formName.trim(), category: formCategory, description: formDescription.trim(), priority: formPriority });
      setToast("Rule updated");
    } else {
      addRule({ name: formName.trim(), category: formCategory, description: formDescription.trim(), priority: formPriority, enabled: true, evaluatorType: "rule-based" });
      setToast("Rule created");
    }

    resetForm();
    refresh();
  }

  if (!hydrated) return null;

  const enabledCount = rules.filter((r) => r.enabled).length;
  const disabledCount = rules.filter((r) => !r.enabled).length;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI & Recommendation Management</h1>
          <p className="mt-1 text-sm text-zinc-500">Configure AI providers, feature flags, and recommendation rules.</p>
        </div>

        {/* ── AI Provider Configuration ── */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">AI Provider Configuration</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">Provider</label>
              <select value={aiConfig.provider} onChange={(e) => { const c = { ...aiConfig, provider: e.target.value as AIProviderType }; setAiConfig(c); saveAIConfig(c); resetAIService(); }}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                <option value="rule_based">Rule-Based (Fallback)</option>
                <option value="openai">OpenAI</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="gemini">Gemini (Google)</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">Model</label>
              <input type="text" value={aiConfig.model} onChange={(e) => { const c = { ...aiConfig, model: e.target.value }; setAiConfig(c); saveAIConfig(c); }}
                placeholder="gpt-4o-mini" className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">API Key</label>
              <input type="password" value={aiConfig.apiKey} onChange={(e) => { const c = { ...aiConfig, apiKey: e.target.value }; setAiConfig(c); saveAIConfig(c); resetAIService(); }}
                placeholder="sk-..." className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">Temperature ({aiConfig.temperature})</label>
              <input type="range" min={0} max={1} step={0.1} value={aiConfig.temperature} onChange={(e) => { const c = { ...aiConfig, temperature: parseFloat(e.target.value) }; setAiConfig(c); saveAIConfig(c); }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">Max Tokens</label>
              <input type="number" value={aiConfig.maxTokens} onChange={(e) => { const c = { ...aiConfig, maxTokens: parseInt(e.target.value) || 1024 }; setAiConfig(c); saveAIConfig(c); }}
                min={100} max={8000} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
          </div>
        </div>

        {/* ── Feature Flags ── */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">AI Feature Flags</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {([["aiCoach", "AI Coach"], ["aiMealPlanner", "AI Meal Planner"], ["aiWorkoutGenerator", "AI Workout Generator"], ["aiInsights", "AI Insights"]] as [keyof AIFeatureFlags, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-700">{label}</span>
                <button type="button" onClick={() => { const f = { ...aiFlags, [key]: !aiFlags[key] }; setAiFlags(f); saveFeatureFlags(f); }}
                  className={["relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", aiFlags[key] ? "bg-zinc-900" : "bg-zinc-200"].join(" ")}>
                  <span className={["inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", aiFlags[key] ? "translate-x-4" : "translate-x-0"].join(" ")} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Usage Stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">{aiUsage.monthlyRequests}</p>
            <p className="text-[10px] text-zinc-400">Monthly Requests</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">{aiUsage.monthlyTokens.toLocaleString()}</p>
            <p className="text-[10px] text-zinc-400">Monthly Tokens</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">{aiUsage.dailyRequests}</p>
            <p className="text-[10px] text-zinc-400">Today</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <p className="text-lg font-bold text-emerald-600">${aiUsage.estimatedMonthlyCost.toFixed(4)}</p>
            <p className="text-[10px] text-zinc-400">Est. Cost</p>
          </div>
        </div>

        {/* ── Recommendation Rules ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Recommendation Rules</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {enabledCount} enabled · {disabledCount} disabled · {rules.length} total rules
            </p>
          </div>
          <Button type="button" onClick={() => { resetForm(); setShowForm(true); }}>+ New Rule</Button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">{editId ? "Edit Rule" : "New Rule"}</p>
            {formError && <p className="mb-3 text-xs text-red-500" role="alert">{formError}</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="rule-name" className="text-sm font-medium text-zinc-700">Rule Name</label>
                <input id="rule-name" type="text" value={formName} onChange={(e) => { setFormName(e.target.value); setFormError(""); }}
                  placeholder="e.g. Low Protein Intake"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rule-cat" className="text-sm font-medium text-zinc-700">Category</label>
                <select id="rule-cat" value={formCategory} onChange={(e) => setFormCategory(e.target.value as RecommendationCategory)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  {RECOMMENDATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rule-pri" className="text-sm font-medium text-zinc-700">Priority</label>
                <select id="rule-pri" value={formPriority} onChange={(e) => setFormPriority(e.target.value as RecommendationPriority)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-1.5">
                <label htmlFor="rule-desc" className="text-sm font-medium text-zinc-700">Description</label>
                <input id="rule-desc" type="text" value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="When does this rule trigger?"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button type="submit">{editId ? "Save Changes" : "Create Rule"}</Button>
              <button type="button" onClick={resetForm} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Cancel</button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input type="search" placeholder="Search rules..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search rules"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as "All" | RecommendationCategory)} aria-label="Filter by category"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
            <option value="All">All Categories</option>
            {RECOMMENDATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Rules table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Enabled</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Rule Name</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Category</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Priority</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Type</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">No rules found.</td></tr>
                ) : (
                  filtered.map((rule) => (
                    <tr key={rule.id} className={`hover:bg-zinc-50 ${!rule.enabled ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <button type="button" onClick={() => handleToggle(rule.id)} aria-label={`Toggle ${rule.name}`}
                          className={["relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                            rule.enabled ? "bg-zinc-900" : "bg-zinc-200"
                          ].join(" ")}>
                          <span className={["inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                            rule.enabled ? "translate-x-4" : "translate-x-0"
                          ].join(" ")} />
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-zinc-900">{rule.name}</p>
                        <p className="text-xs text-zinc-400 line-clamp-1">{rule.description}</p>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{rule.category}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge(rule.priority)}`}>{rule.priority}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{rule.evaluatorType}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEdit(rule)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Edit</button>
                          <button type="button" onClick={() => handleDelete(rule.id)} className="text-xs font-medium text-zinc-500 hover:text-red-600">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
