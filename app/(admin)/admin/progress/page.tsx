"use client";

  const { success: showToast } = useToast();
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanType = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";
type SubscriptionStatus = "Active" | "Trial" | "Expired" | "Cancelled" | "Pending";

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  start_date: string;
  renewal_date: string | null;
  expiration_date: string | null;
}

function statusBadge(s: SubscriptionStatus): string {
  switch (s) {
    case "Active": return "bg-emerald-50 text-emerald-700";
    case "Trial": return "bg-amber-50 text-amber-700";
    case "Expired": return "bg-red-50 text-red-700";
    case "Cancelled": return "bg-zinc-100 text-zinc-600";
    case "Pending": return "bg-blue-50 text-blue-700";
  }
}

function planBadge(p: PlanType): string {
  return p === "FREE" ? "bg-zinc-100 text-zinc-600" : "bg-violet-50 text-violet-700";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"All" | PlanType>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, status, start_date, renewal_date, expiration_date")
        .order("created_at", { ascending: false });
      if (data) setSubscriptions(data as SubscriptionRow[]);
      setLoading(false);
    }
    loadData();
  }, []);


  async function handleGrantPremium(subId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("subscriptions").update({ plan: "PREMIUM_MONTHLY", status: "Active" }).eq("id", subId);
    if (!error) {
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? { ...s, plan: "PREMIUM_MONTHLY" as PlanType, status: "Active" as SubscriptionStatus } : s)));
      showToast("Premium access granted");
    }
  }

  async function handleRevoke(subId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("subscriptions").update({ plan: "FREE", status: "Active", renewal_date: null, expiration_date: null }).eq("id", subId);
    if (!error) {
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? { ...s, plan: "FREE" as PlanType, status: "Active" as SubscriptionStatus, renewal_date: null, expiration_date: null } : s)));
      showToast("Premium access revoked");
    }
  }

  const filtered = subscriptions.filter((s) => {
    const matchesSearch = s.user_id.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "All" || s.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const totalPremium = subscriptions.filter((s) => s.plan !== "FREE" && s.status === "Active").length;
  const totalFree = subscriptions.filter((s) => s.plan === "FREE").length;
  const totalTrials = subscriptions.filter((s) => s.status === "Trial").length;
  const revenue = totalPremium * 9.99;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">Subscription Management</h1><p className="mt-1 text-sm text-zinc-500">Manage user subscriptions and plan access.</p></div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-violet-600">{totalPremium}</p><p className="text-xs text-zinc-400">Premium Users</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-900">{totalFree}</p><p className="text-xs text-zinc-400">Free Users</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-amber-600">{totalTrials}</p><p className="text-xs text-zinc-400">Active Trials</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-emerald-600">${revenue.toFixed(0)}</p><p className="text-xs text-zinc-400">Est. MRR</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64"><svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg><input type="search" placeholder="Search by user ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as "All" | PlanType)} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="All">All Plans</option><option value="FREE">Free</option><option value="PREMIUM_MONTHLY">Monthly</option><option value="PREMIUM_YEARLY">Yearly</option></select>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50"><tr><th className="px-5 py-3 font-semibold text-zinc-700">User</th><th className="px-5 py-3 font-semibold text-zinc-700">Plan</th><th className="px-5 py-3 font-semibold text-zinc-700">Status</th><th className="px-5 py-3 font-semibold text-zinc-700">Start</th><th className="px-5 py-3 font-semibold text-zinc-700">Renewal/Expiry</th><th className="px-5 py-3 font-semibold text-zinc-700">Actions</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">No subscriptions found.</td></tr>
                ) : (
                  filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900 text-xs">{sub.user_id.slice(0, 8)}…</td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${planBadge(sub.plan)}`}>{sub.plan === "FREE" ? "Free" : sub.plan === "PREMIUM_MONTHLY" ? "Monthly" : "Yearly"}</span></td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(sub.status)}`}>{sub.status}</span></td>
                      <td className="px-5 py-3 text-zinc-500">{sub.start_date}</td>
                      <td className="px-5 py-3 text-zinc-500">{sub.expiration_date || sub.renewal_date || "—"}</td>
                      <td className="px-5 py-3">
                        {sub.plan === "FREE" ? (
                          <button type="button" onClick={() => handleGrantPremium(sub.id)} className="text-xs font-medium text-violet-600 hover:text-violet-800">Grant Premium</button>
                        ) : (
                          <button type="button" onClick={() => handleRevoke(sub.id)} className="text-xs font-medium text-red-500 hover:text-red-700">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
