"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  status: "complete" | "partial" | "pending";
}

const CHECKLIST: ChecklistItem[] = [
  { id: "auth-1", category: "Authentication", task: "Login/Register flow", status: "complete" },
  { id: "auth-2", category: "Authentication", task: "Supabase Auth (OAuth + Email)", status: "complete" },
  { id: "auth-3", category: "Authentication", task: "Onboarding flow", status: "complete" },
  { id: "auth-4", category: "Authentication", task: "Logout functionality", status: "complete" },
  { id: "role-1", category: "Roles", task: "USER role implemented", status: "complete" },
  { id: "role-2", category: "Roles", task: "ADMIN role implemented", status: "complete" },
  { id: "role-3", category: "Roles", task: "SUPER_ADMIN role implemented", status: "complete" },
  { id: "role-4", category: "Roles", task: "Admin route protection (AuthGuard)", status: "complete" },
  { id: "sec-1", category: "Security", task: "Route protection for /admin", status: "complete" },
  { id: "sec-2", category: "Security", task: "Input validation on forms", status: "complete" },
  { id: "sec-3", category: "Security", task: "AI safety layer (input/output filtering)", status: "complete" },
  { id: "sec-4", category: "Security", task: "RLS policies on all tables", status: "complete" },
  { id: "sec-5", category: "Security", task: "Rate limiting", status: "pending" },
  { id: "perf-1", category: "Performance", task: "Client components with hydration", status: "complete" },
  { id: "perf-2", category: "Performance", task: "Static generation where possible", status: "complete" },
  { id: "perf-3", category: "Performance", task: "Build compiles without errors", status: "complete" },
  { id: "perf-4", category: "Performance", task: "Bundle splitting (app router)", status: "complete" },
  { id: "perf-5", category: "Performance", task: "Image optimization", status: "pending" },
  { id: "data-1", category: "Data Layer", task: "Supabase Only architecture", status: "complete" },
  { id: "data-2", category: "Data Layer", task: "All modules migrated to Supabase", status: "complete" },
  { id: "data-3", category: "Data Layer", task: "RLS on all user tables", status: "complete" },
  { id: "data-4", category: "Data Layer", task: "Database schema with enums", status: "complete" },
  { id: "data-5", category: "Data Layer", task: "Zero localStorage in app/(app)", status: "complete" },
  { id: "sub-1", category: "Subscriptions", task: "Plan definitions (Free/Premium)", status: "complete" },
  { id: "sub-2", category: "Subscriptions", task: "Feature gate service", status: "complete" },
  { id: "sub-3", category: "Subscriptions", task: "Usage tracking", status: "complete" },
  { id: "sub-4", category: "Subscriptions", task: "Payment gateway integration", status: "pending" },
  { id: "not-1", category: "Notifications", task: "In-app notifications", status: "complete" },
  { id: "not-2", category: "Notifications", task: "Notification preferences", status: "complete" },
  { id: "not-3", category: "Notifications", task: "Notification panel (Topbar)", status: "complete" },
  { id: "not-4", category: "Notifications", task: "Email/Push notifications", status: "pending" },
  { id: "mon-1", category: "Monitoring", task: "Error boundary (global)", status: "complete" },
  { id: "mon-2", category: "Monitoring", task: "Error pages (404/403/500)", status: "complete" },
  { id: "mon-3", category: "Monitoring", task: "External monitoring (Sentry/PostHog)", status: "pending" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminLaunchPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalWorkouts: 0, totalRecipes: 0, totalExercises: 0, betaCount: 0, feedbackCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [users, workouts, recipes, exercises, beta, feedback] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("workouts").select("id", { count: "exact", head: true }),
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("exercises").select("id", { count: "exact", head: true }),
        supabase.from("beta_registrations").select("id", { count: "exact", head: true }),
        supabase.from("feedback").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalWorkouts: workouts.count || 0,
        totalRecipes: recipes.count || 0,
        totalExercises: exercises.count || 0,
        betaCount: beta.count || 0,
        feedbackCount: feedback.count || 0,
      });

      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  const completed = CHECKLIST.filter((i) => i.status === "complete").length;
  const total = CHECKLIST.length;
  const score = Math.round((completed / total) * 100);
  const categories = [...new Set(CHECKLIST.map((c) => c.category))];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Launch Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">v1.0.0 — Production readiness overview</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${score >= 80 ? "bg-emerald-100 text-emerald-800" : score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
          {score}% Ready
        </span>
      </div>

      {/* Readiness score */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-zinc-900">Launch Readiness Score</p><p className="text-sm font-bold text-zinc-900">{completed}/{total}</p></div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} /></div>
        <div className="mt-3 flex gap-4 text-xs"><span className="text-emerald-600"><strong>{completed}</strong> complete</span><span className="text-amber-600"><strong>{CHECKLIST.filter((i) => i.status === "partial").length}</strong> partial</span><span className="text-red-500"><strong>{CHECKLIST.filter((i) => i.status === "pending").length}</strong> pending</span></div>
      </div>

      {/* KPIs from Supabase */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-900">{stats.totalUsers}</p><p className="text-[10px] text-zinc-400">Users</p></div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-emerald-600">{stats.totalWorkouts}</p><p className="text-[10px] text-zinc-400">Workouts</p></div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-blue-600">{stats.totalRecipes}</p><p className="text-[10px] text-zinc-400">Recipes</p></div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-900">{stats.totalExercises}</p><p className="text-[10px] text-zinc-400">Exercises</p></div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-violet-600">{stats.betaCount}</p><p className="text-[10px] text-zinc-400">Beta Signups</p></div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-amber-600">{stats.feedbackCount}</p><p className="text-[10px] text-zinc-400">Feedback</p></div>
      </div>

      {/* Production Checklist */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4"><p className="text-sm font-semibold text-zinc-900">Production Checklist</p></div>
        <div className="divide-y divide-zinc-50">
          {categories.map((cat) => {
            const items = CHECKLIST.filter((i) => i.category === cat);
            const catComplete = items.filter((i) => i.status === "complete").length;
            return (
              <div key={cat} className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-zinc-700">{cat}</p><span className="text-xs text-zinc-400">{catComplete}/{items.length}</span></div>
                <div className="flex flex-col gap-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${item.status === "complete" ? "bg-emerald-500" : item.status === "partial" ? "bg-amber-400" : "bg-zinc-300"}`} />
                      <span className={`text-xs ${item.status === "complete" ? "text-zinc-600" : "text-zinc-400"}`}>{item.task}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
