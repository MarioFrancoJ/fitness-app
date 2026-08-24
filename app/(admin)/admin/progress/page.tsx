"use client";

import { useState, useEffect } from "react";
import {
  loadAllSubscriptions, saveAllSubscriptions, adminGrantPremium, adminRevokePremium,
  PLAN_DEFINITIONS, type Subscription, type PlanType, type SubscriptionStatus,
} from "@/lib/subscription";
import { loadUsers, type PlatformUser } from "@/lib/admin-platform";

function statusBadge(s: SubscriptionStatus): string {
  switch (s) {
    case "Active":    return "bg-emerald-50 text-emerald-700";
    case "Trial":     return "bg-amber-50 text-amber-700";
    case "Expired":   return "bg-red-50 text-red-700";
    case "Cancelled": return "bg-zinc-100 text-zinc-600";
    case "Pending":   return "bg-blue-50 text-blue-700";
  }
}

function planBadge(p: PlanType): string {
  if (p === "FREE") return "bg-zinc-100 text-zinc-600";
  return "bg-violet-50 text-violet-700";
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"All" | PlanType>("All");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setSubscriptions(loadAllSubscriptions());
    setUsers(loadUsers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  function refresh() { setSubscriptions(loadAllSubscriptions()); }

  function getUserName(userId: string): string {
    return users.find((u) => u.id === userId)?.name ?? userId;
  }

  function handleGrantPremium(subId: string) {
    adminGrantPremium(subId);
    refresh();
    setToast("Premium access granted");
  }

  function handleRevoke(subId: string) {
    adminRevokePremium(subId);
    refresh();
    setToast("Premium access revoked");
  }

  const filtered = subscriptions.filter((s) => {
    const name = getUserName(s.userId).toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || s.userId.includes(search.toLowerCase());
    const matchesPlan = planFilter === "All" || s.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  // Stats
  const totalPremium = subscriptions.filter((s) => s.plan !== "FREE" && s.status === "Active").length;
  const totalFree = subscriptions.filter((s) => s.plan === "FREE").length;
  const totalTrials = subscriptions.filter((s) => s.status === "Trial").length;
  const revenue = totalPremium * 9.99; // simplified estimate

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Subscription Management</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage user subscriptions and plan access.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-violet-600">{totalPremium}</p>
            <p className="text-xs text-zinc-400">Premium Users</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{totalFree}</p>
            <p className="text-xs text-zinc-400">Free Users</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-amber-600">{totalTrials}</p>
            <p className="text-xs text-zinc-400">Active Trials</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-emerald-600">${revenue.toFixed(0)}</p>
            <p className="text-xs text-zinc-400">Est. MRR</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input type="search" placeholder="Search by user..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
          </div>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as "All" | PlanType)} aria-label="Filter by plan"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
            <option value="All">All Plans</option>
            {PLAN_DEFINITIONS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">User</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Plan</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Status</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Start</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Renewal/Expiry</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">No subscriptions found.</td></tr>
                ) : (
                  filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">{getUserName(sub.userId)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${planBadge(sub.plan)}`}>
                          {sub.plan === "FREE" ? "Free" : sub.plan === "PREMIUM_MONTHLY" ? "Monthly" : "Yearly"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(sub.status)}`}>{sub.status}</span>
                      </td>
                      <td className="px-5 py-3 text-zinc-500">{sub.startDate}</td>
                      <td className="px-5 py-3 text-zinc-500">{sub.expirationDate || sub.renewalDate || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {sub.plan === "FREE" ? (
                            <button type="button" onClick={() => handleGrantPremium(sub.id)} className="text-xs font-medium text-violet-600 hover:text-violet-800">Grant Premium</button>
                          ) : (
                            <button type="button" onClick={() => handleRevoke(sub.id)} className="text-xs font-medium text-red-500 hover:text-red-700">Revoke</button>
                          )}
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

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
