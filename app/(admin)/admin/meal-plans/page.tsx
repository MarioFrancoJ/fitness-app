"use client";

import { useState, useEffect } from "react";
import { getPlatformStats } from "@/lib/admin-platform";
import { getMonitoringStats } from "@/lib/monitoring";

interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  status: "complete" | "partial" | "pending";
}

const CHECKLIST: ChecklistItem[] = [
  // Authentication
  { id: "auth-1", category: "Authentication", task: "Login/Register flow", status: "complete" },
  { id: "auth-2", category: "Authentication", task: "Session management (localStorage)", status: "complete" },
  { id: "auth-3", category: "Authentication", task: "Onboarding flow", status: "complete" },
  { id: "auth-4", category: "Authentication", task: "Logout functionality", status: "complete" },
  // Roles
  { id: "role-1", category: "Roles", task: "USER role implemented", status: "complete" },
  { id: "role-2", category: "Roles", task: "ADMIN role implemented", status: "complete" },
  { id: "role-3", category: "Roles", task: "SUPER_ADMIN role implemented", status: "complete" },
  { id: "role-4", category: "Roles", task: "Admin route protection (AuthGuard)", status: "complete" },
  // Security
  { id: "sec-1", category: "Security", task: "Route protection for /admin", status: "complete" },
  { id: "sec-2", category: "Security", task: "Input validation on forms", status: "complete" },
  { id: "sec-3", category: "Security", task: "AI safety layer (input/output filtering)", status: "complete" },
  { id: "sec-4", category: "Security", task: "HTTPS enforcement", status: "pending" },
  { id: "sec-5", category: "Security", task: "Rate limiting", status: "pending" },
  // Performance
  { id: "perf-1", category: "Performance", task: "Client components with hydration", status: "complete" },
  { id: "perf-2", category: "Performance", task: "Static generation where possible", status: "complete" },
  { id: "perf-3", category: "Performance", task: "Build compiles without errors", status: "complete" },
  { id: "perf-4", category: "Performance", task: "Bundle splitting (app router)", status: "complete" },
  { id: "perf-5", category: "Performance", task: "Image optimization", status: "pending" },
  // Analytics
  { id: "ana-1", category: "Analytics", task: "Event tracking architecture", status: "complete" },
  { id: "ana-2", category: "Analytics", task: "Error logging system", status: "complete" },
  { id: "ana-3", category: "Analytics", task: "Usage stats computation", status: "complete" },
  { id: "ana-4", category: "Analytics", task: "External provider integration (Sentry/PostHog)", status: "pending" },
  // Monitoring
  { id: "mon-1", category: "Monitoring", task: "Error boundary (global)", status: "complete" },
  { id: "mon-2", category: "Monitoring", task: "Error pages (404/403/500)", status: "complete" },
  { id: "mon-3", category: "Monitoring", task: "Monitoring library", status: "complete" },
  { id: "mon-4", category: "Monitoring", task: "External monitoring connection", status: "pending" },
  // Data Layer
  { id: "data-1", category: "Data Layer", task: "localStorage persistence", status: "complete" },
  { id: "data-2", category: "Data Layer", task: "Data export (JSON/CSV)", status: "complete" },
  { id: "data-3", category: "Data Layer", task: "Backup & restore system", status: "complete" },
  { id: "data-4", category: "Data Layer", task: "Database schema designed", status: "complete" },
  { id: "data-5", category: "Data Layer", task: "PostgreSQL migration", status: "pending" },
  // Subscriptions
  { id: "sub-1", category: "Subscriptions", task: "Plan definitions (Free/Premium)", status: "complete" },
  { id: "sub-2", category: "Subscriptions", task: "Feature gate service", status: "complete" },
  { id: "sub-3", category: "Subscriptions", task: "Usage tracking", status: "complete" },
  { id: "sub-4", category: "Subscriptions", task: "Payment gateway integration", status: "pending" },
  // Notifications
  { id: "not-1", category: "Notifications", task: "In-app notifications", status: "complete" },
  { id: "not-2", category: "Notifications", task: "Reminder generator", status: "complete" },
  { id: "not-3", category: "Notifications", task: "Notification preferences", status: "complete" },
  { id: "not-4", category: "Notifications", task: "Email/Push notifications", status: "pending" },
];

export default function AdminLaunchPage() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, newUsersThisMonth: 0, totalWorkouts: 0, totalNutritionEntries: 0, totalRecipes: 0, totalExercises: 0 });
  const [monStats, setMonStats] = useState({ totalEvents: 0, todayEvents: 0, totalErrors: 0, todayErrors: 0, criticalErrors: 0 });
  const [betaCount, setBetaCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStats(getPlatformStats());
    setMonStats(getMonitoringStats());
    try { setBetaCount(JSON.parse(localStorage.getItem("fitnessapp_beta_registrations") || "[]").length); } catch {}
    try { setFeedbackCount(JSON.parse(localStorage.getItem("fitnessapp_feedback") || "[]").length); } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const completed = CHECKLIST.filter((i) => i.status === "complete").length;
  const total = CHECKLIST.length;
  const score = Math.round((completed / total) * 100);
  const categories = [...new Set(CHECKLIST.map((c) => c.category))];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Launch Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">v1.0.0-beta — Production readiness overview</p>
        </div>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${score >= 80 ? "bg-emerald-100 text-emerald-800" : score >= 60 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
          {score}% Ready
        </span>
      </div>

      {/* Readiness score */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">Launch Readiness Score</p>
          <p className="text-sm font-bold text-zinc-900">{completed}/{total}</p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className={`h-full rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <span className="text-emerald-600"><strong>{completed}</strong> complete</span>
          <span className="text-amber-600"><strong>{CHECKLIST.filter((i) => i.status === "partial").length}</strong> partial</span>
          <span className="text-red-500"><strong>{CHECKLIST.filter((i) => i.status === "pending").length}</strong> pending</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-zinc-900">{stats.totalUsers}</p>
          <p className="text-[10px] text-zinc-400">Users</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-emerald-600">{stats.activeUsers}</p>
          <p className="text-[10px] text-zinc-400">Active</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-blue-600">{betaCount}</p>
          <p className="text-[10px] text-zinc-400">Beta Signups</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-violet-600">{feedbackCount}</p>
          <p className="text-[10px] text-zinc-400">Feedback</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-zinc-900">{monStats.totalErrors}</p>
          <p className="text-[10px] text-zinc-400">Errors</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xl font-bold text-red-500">{monStats.criticalErrors}</p>
          <p className="text-[10px] text-zinc-400">Critical</p>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-700">LOW RISK</p>
          <p className="mt-1 text-sm text-emerald-900">Core features stable. Auth, UI, and data layer working.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700">MEDIUM RISK</p>
          <p className="mt-1 text-sm text-amber-900">No payment gateway. localStorage only. No external monitoring.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold text-zinc-600">OPEN ISSUES</p>
          <p className="mt-1 text-sm text-zinc-800">{total - completed} items pending before full production.</p>
        </div>
      </div>

      {/* Production Checklist */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-900">Production Checklist</p>
        </div>
        <div className="divide-y divide-zinc-50">
          {categories.map((cat) => {
            const items = CHECKLIST.filter((i) => i.category === cat);
            const catComplete = items.filter((i) => i.status === "complete").length;
            return (
              <div key={cat} className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-700">{cat}</p>
                  <span className="text-xs text-zinc-400">{catComplete}/{items.length}</span>
                </div>
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
