"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, newUsersThisMonth: 0, totalWorkouts: 0, totalMeals: 0, totalRecipes: 0, totalExercises: 0 });
  const [auditLog, setAuditLog] = useState<{ id: string; action: string; entity: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [users, workouts, meals, recipes, exercises, audit] = await Promise.all([
        supabase.from("users").select("id, status, created_at"),
        supabase.from("training_sessions").select("id", { count: "exact", head: true }),
        supabase.from("meal_logs").select("id", { count: "exact", head: true }),
        supabase.from("recipes").select("id", { count: "exact", head: true }),
        supabase.from("exercises").select("id", { count: "exact", head: true }),
        supabase.from("audit_log").select("id, action, entity, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const allUsers = users.data || [];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

      setStats({
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((u) => u.status === "Active").length,
        newUsersThisMonth: allUsers.filter((u) => u.created_at >= monthStart).length,
        totalWorkouts: workouts.count || 0,
        totalMeals: meals.count || 0,
        totalRecipes: recipes.count || 0,
        totalExercises: exercises.count || 0,
      });

      setAuditLog(audit.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-blue-600", href: "/admin/users" },
    { label: "Active Users", value: stats.activeUsers, color: "text-emerald-600", href: "/admin/users" },
    { label: "New This Month", value: stats.newUsersThisMonth, color: "text-violet-600", href: "/admin/users" },
    { label: "Workouts Logged", value: stats.totalWorkouts, color: "text-amber-600", href: "/admin/workout-plans" },
    { label: "Meals Logged", value: stats.totalMeals, color: "text-rose-600", href: "/admin/recipes" },
    { label: "Total Recipes", value: stats.totalRecipes, color: "text-teal-600", href: "/admin/recipes" },
    { label: "Total Exercises", value: stats.totalExercises, color: "text-indigo-600", href: "/admin/exercises" },
    { label: "Platform Growth", value: `${stats.totalUsers > 0 ? Math.round((stats.newUsersThisMonth / stats.totalUsers) * 100) : 0}%`, color: "text-zinc-900", href: "/admin/users" },
  ];

  const quickLinks = [
    { label: "Users", description: "Manage user accounts", href: "/admin/users" },
    { label: "Exercises", description: "Exercise database", href: "/admin/exercises" },
    { label: "Recipes", description: "Recipe management", href: "/admin/recipes" },
    { label: "Ingredients", description: "Ingredient database", href: "/admin/ingredients" },
    { label: "Workout Templates", description: "Manage templates", href: "/admin/workout-plans" },
    { label: "AI & Rules", description: "Recommendation engine", href: "/admin/ai" },
    { label: "Settings", description: "Platform configuration", href: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Platform overview and management tools.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="mt-1 text-xs text-zinc-400">{card.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-zinc-900">Quick Access</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <p className="text-sm font-semibold text-zinc-900">{link.label}</p>
              <p className="text-xs text-zinc-400">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4"><p className="text-sm font-semibold text-zinc-900">Recent Activity</p></div>
        {auditLog.length === 0 ? (
          <div className="flex h-32 items-center justify-center"><p className="text-sm text-zinc-400">No recent activity recorded.</p></div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {auditLog.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800">{entry.action}</p>
                  <p className="text-xs text-zinc-400">{entry.entity || "—"}</p>
                </div>
                <span className="text-xs text-zinc-400">{new Date(entry.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
