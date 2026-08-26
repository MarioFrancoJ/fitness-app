"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformSettings {
  platformName: string;
  logoUrl: string | null;
  featureToggles: {
    aiCoach: boolean;
    mealPlanner: boolean;
    shoppingLists: boolean;
    progressPhotos: boolean;
    analytics: boolean;
    recommendations: boolean;
  };
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "FitnessApp",
  logoUrl: null,
  featureToggles: { aiCoach: true, mealPlanner: true, shoppingLists: true, progressPhotos: true, analytics: true, recommendations: true },
};

const ROLE_PERMISSIONS = [
  { resource: "Dashboard", roles: { USER: [true, false, false], ADMIN: [true, true, false], SUPER_ADMIN: [true, true, true] } },
  { resource: "Users", roles: { USER: [false, false, false], ADMIN: [true, false, false], SUPER_ADMIN: [true, true, true] } },
  { resource: "Workouts", roles: { USER: [true, true, true], ADMIN: [true, true, true], SUPER_ADMIN: [true, true, true] } },
  { resource: "Nutrition", roles: { USER: [true, true, true], ADMIN: [true, true, true], SUPER_ADMIN: [true, true, true] } },
  { resource: "Exercises", roles: { USER: [true, false, false], ADMIN: [true, true, true], SUPER_ADMIN: [true, true, true] } },
  { resource: "Settings", roles: { USER: [false, false, false], ADMIN: [true, false, false], SUPER_ADMIN: [true, true, true] } },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase.from("platform_settings").select("value").eq("key", "platform_settings").maybeSingle();
      if (data?.value && typeof data.value === "object") {
        setSettings(data.value as unknown as PlatformSettings);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    try {
      const { data: existing } = await supabase.from("platform_settings").select("id").eq("key", "platform_settings").maybeSingle();
      if (existing) {
        await supabase.from("platform_settings").update({ value: settings as any }).eq("key", "platform_settings");
      } else {
        await supabase.from("platform_settings").insert({ key: "platform_settings", value: settings as any });
      }
      setToast("Settings saved successfully!");
    } catch { setToast("Failed to save settings."); }
    setSaving(false);
  }

  function toggleFeature(key: keyof PlatformSettings["featureToggles"]) {
    setSettings({ ...settings, featureToggles: { ...settings.featureToggles, [key]: !settings.featureToggles[key] } });
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  const featureList: { key: keyof PlatformSettings["featureToggles"]; label: string; description: string }[] = [
    { key: "aiCoach", label: "AI Coach", description: "Rule-based fitness coaching and chat" },
    { key: "mealPlanner", label: "Meal Planner", description: "Weekly meal planning with recipes" },
    { key: "shoppingLists", label: "Shopping Lists", description: "Auto-generated shopping lists" },
    { key: "progressPhotos", label: "Progress Photos", description: "Photo upload and comparison" },
    { key: "analytics", label: "Analytics", description: "Platform and user analytics" },
    { key: "recommendations", label: "Recommendations", description: "Smart recommendation engine" },
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">Platform Settings</h1><p className="mt-1 text-sm text-zinc-500">Configure platform branding and feature availability.</p></div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">Branding</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5"><label htmlFor="platform-name" className="text-sm font-medium text-zinc-700">Platform Name</label><input id="platform-name" type="text" value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="logo-url" className="text-sm font-medium text-zinc-700">Logo URL</label><input id="logo-url" type="text" value={settings.logoUrl || ""} onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value || null })} placeholder="https://example.com/logo.png" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">Feature Toggles</p>
            <div className="flex flex-col gap-3">
              {featureList.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-4">
                  <div><p className="text-sm font-medium text-zinc-900">{feature.label}</p><p className="text-xs text-zinc-400">{feature.description}</p></div>
                  <button type="button" onClick={() => toggleFeature(feature.key)} aria-label={`Toggle ${feature.label}`} className={["relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors", settings.featureToggles[feature.key] ? "bg-zinc-900" : "bg-zinc-200"].join(" ")}><span className={["inline-block h-5 w-5 rounded-full bg-white shadow transition-transform", settings.featureToggles[feature.key] ? "translate-x-5" : "translate-x-0"].join(" ")} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">Role Permissions Matrix</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100">
                  <tr><th className="px-4 py-2 text-xs font-semibold text-zinc-400">Resource</th><th className="px-4 py-2 text-center text-xs font-semibold text-zinc-400">USER (V/E/D)</th><th className="px-4 py-2 text-center text-xs font-semibold text-zinc-400">ADMIN (V/E/D)</th><th className="px-4 py-2 text-center text-xs font-semibold text-zinc-400">SUPER_ADMIN (V/E/D)</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {ROLE_PERMISSIONS.map((perm) => (
                    <tr key={perm.resource} className="hover:bg-zinc-50">
                      <td className="px-4 py-2 text-xs font-medium text-zinc-700">{perm.resource}</td>
                      {(["USER", "ADMIN", "SUPER_ADMIN"] as const).map((role) => (
                        <td key={role} className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-1">
                            {perm.roles[role].map((v, i) => (
                              <span key={i} className={`text-[10px] font-semibold ${v ? (i === 0 ? "text-emerald-600" : i === 1 ? "text-blue-600" : "text-red-500") : "text-zinc-300"}`}>{v ? "✓" : "—"}</span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] text-zinc-400">V = View · E = Edit · D = Delete</p>
          </div>

          <div><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button></div>
        </form>
      </div>

      {toast && (<div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg"><p className="text-sm font-medium text-zinc-800">{toast}</p></div>)}
    </>
  );
}
