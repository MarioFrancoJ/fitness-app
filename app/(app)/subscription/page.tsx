"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanType = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";
type SubscriptionStatus = "Active" | "Trial" | "Expired" | "Cancelled" | "Pending";

interface Subscription {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate: string | null;
  expirationDate: string | null;
}

interface PlanLimits {
  maxRecipes: number;
  maxWorkoutPlans: number;
  maxProgressPhotos: number;
  maxHistoryDays: number;
}

interface PlanDefinition {
  id: PlanType;
  name: string;
  price: number;
  features: string[];
  limits: PlanLimits;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLAN_DEFINITIONS: PlanDefinition[] = [
  { id: "FREE", name: "Free", price: 0, features: ["Profile Management", "Body Measurements", "Weight Tracking", "Basic Nutrition Tracking", "Basic Workout Tracking"], limits: { maxRecipes: 10, maxWorkoutPlans: 3, maxProgressPhotos: 30, maxHistoryDays: 90 } },
  { id: "PREMIUM_MONTHLY", name: "Premium Monthly", price: 9.99, features: ["Everything in Free", "Unlimited Recipes", "Unlimited Workout Plans", "Unlimited Progress Photos", "Advanced Analytics", "AI Coach", "Data Export"], limits: { maxRecipes: -1, maxWorkoutPlans: -1, maxProgressPhotos: -1, maxHistoryDays: -1 } },
  { id: "PREMIUM_YEARLY", name: "Premium Yearly", price: 7.99, features: ["Everything in Premium Monthly", "2 months free", "Early access"], limits: { maxRecipes: -1, maxWorkoutPlans: -1, maxProgressPhotos: -1, maxHistoryDays: -1 } },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min((current / max) * 100, 100);
  const isNear = !unlimited && pct >= 80;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600">{label}</span>
        <span className={`text-xs font-semibold ${isNear ? "text-red-500" : "text-zinc-700"}`}>
          {current} / {unlimited ? "∞" : max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full transition-all ${isNear ? "bg-red-400" : "bg-zinc-800"}`}
          style={{ width: unlimited ? "0%" : `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState({ recipesCreated: 0, workoutPlansCreated: 0, progressPhotosUploaded: 0, historyDays: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("id, plan, status, start_date, renewal_date, expiration_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setSub({
          id: subData.id,
          plan: subData.plan as PlanType,
          status: subData.status as SubscriptionStatus,
          startDate: subData.start_date,
          renewalDate: subData.renewal_date,
          expirationDate: subData.expiration_date,
        });
      } else {
        setSub({ id: "", plan: "FREE", status: "Active", startDate: new Date().toISOString().slice(0, 10), renewalDate: null, expirationDate: null });
      }

      // Load usage counts from actual tables
      const { count: recipesCount } = await supabase.from("recipes").select("id", { count: "exact", head: true }).eq("created_by", user.id);
      const { count: workoutsCount } = await supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: photosCount } = await supabase.from("progress_photos").select("id", { count: "exact", head: true }).eq("user_id", user.id);

      setUsage({
        recipesCreated: recipesCount || 0,
        workoutPlansCreated: workoutsCount || 0,
        progressPhotosUploaded: photosCount || 0,
        historyDays: 0,
      });

      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); }
  }, [toast, dismissToast]);

  async function handleUpgrade(plan: PlanType) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !sub) return;

    const now = new Date();
    const renewalDate = new Date(now);
    if (plan === "PREMIUM_MONTHLY") renewalDate.setMonth(now.getMonth() + 1);
    else if (plan === "PREMIUM_YEARLY") renewalDate.setFullYear(now.getFullYear() + 1);

    try {
      if (sub.id) {
        await supabase.from("subscriptions").update({ plan, status: "Active", start_date: now.toISOString().slice(0, 10), renewal_date: renewalDate.toISOString().slice(0, 10), expiration_date: null }).eq("id", sub.id);
      } else {
        const { data: inserted } = await supabase.from("subscriptions").insert({ user_id: user.id, plan, status: "Active", start_date: now.toISOString().slice(0, 10), renewal_date: renewalDate.toISOString().slice(0, 10) }).select("id").single();
        if (inserted) sub.id = inserted.id;
      }
      setSub({ ...sub, plan, status: "Active", startDate: now.toISOString().slice(0, 10), renewalDate: renewalDate.toISOString().slice(0, 10), expirationDate: null });
      setToast("Upgraded to Premium!");
    } catch (err) { console.error("Upgrade failed:", err); }
  }

  async function handleCancel() {
    if (!sub?.id) return;
    const supabase = createClient();
    await supabase.from("subscriptions").update({ status: "Cancelled", expiration_date: sub.renewalDate }).eq("id", sub.id);
    setSub({ ...sub, status: "Cancelled", expirationDate: sub.renewalDate });
    setToast("Subscription cancelled.");
  }

  async function handleDowngrade() {
    if (!sub?.id) return;
    const supabase = createClient();
    await supabase.from("subscriptions").update({ plan: "FREE", status: "Active", renewal_date: null, expiration_date: null }).eq("id", sub.id);
    setSub({ ...sub, plan: "FREE", status: "Active", renewalDate: null, expirationDate: null });
    setToast("Downgraded to Free.");
  }

  async function handleStartTrial() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !sub) return;

    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(now.getDate() + 7);

    if (sub.id) {
      await supabase.from("subscriptions").update({ plan: "PREMIUM_MONTHLY", status: "Trial", start_date: now.toISOString().slice(0, 10), renewal_date: null, expiration_date: expiry.toISOString().slice(0, 10) }).eq("id", sub.id);
    } else {
      await supabase.from("subscriptions").insert({ user_id: user.id, plan: "PREMIUM_MONTHLY", status: "Trial", start_date: now.toISOString().slice(0, 10), expiration_date: expiry.toISOString().slice(0, 10) });
    }
    setSub({ ...sub, plan: "PREMIUM_MONTHLY", status: "Trial", startDate: now.toISOString().slice(0, 10), renewalDate: null, expirationDate: expiry.toISOString().slice(0, 10) });
    setToast("7-day Premium trial started!");
  }

  if (loading) {
    return (
      <PageLoader text="Loading subscription..." />
    );
  }

  if (!sub) return null;

  const premium = (sub.plan === "PREMIUM_MONTHLY" || sub.plan === "PREMIUM_YEARLY") && (sub.status === "Active" || sub.status === "Trial");
  const planDef = PLAN_DEFINITIONS.find((p) => p.id === sub.plan) ?? PLAN_DEFINITIONS[0];
  const limits = planDef.limits;
  const badge = sub.plan === "FREE" ? { label: "FREE", color: "bg-zinc-100 text-zinc-600" } : sub.status === "Trial" ? { label: "TRIAL", color: "bg-amber-100 text-amber-700" } : { label: "PREMIUM", color: "bg-gradient-to-r from-violet-500 to-purple-600 text-white" };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Subscription</h1>
            <p className="mt-1 text-sm text-zinc-500">Manage your plan and usage.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.color}`}>{badge.label}</span>
        </div>

        {/* Current Plan */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">Current Plan</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs text-zinc-400">Plan</p><p className="text-sm font-bold text-zinc-900">{planDef.name}</p></div>
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs text-zinc-400">Status</p><p className={`text-sm font-bold ${sub.status === "Active" ? "text-emerald-600" : sub.status === "Trial" ? "text-amber-600" : "text-red-500"}`}>{sub.status}</p></div>
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs text-zinc-400">Start Date</p><p className="text-sm font-bold text-zinc-900">{sub.startDate}</p></div>
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs text-zinc-400">{sub.expirationDate ? "Expires" : "Renewal"}</p><p className="text-sm font-bold text-zinc-900">{sub.expirationDate || sub.renewalDate || "—"}</p></div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!premium && (
              <>
                <button type="button" onClick={() => handleUpgrade("PREMIUM_MONTHLY")} className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">Upgrade Monthly ($9.99/mo)</button>
                <button type="button" onClick={() => handleUpgrade("PREMIUM_YEARLY")} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">Upgrade Yearly ($7.99/mo)</button>
                {sub.status !== "Trial" && <button type="button" onClick={handleStartTrial} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Start 7-Day Trial</button>}
              </>
            )}
            {premium && sub.status === "Active" && (
              <>
                <button type="button" onClick={handleCancel} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Cancel</button>
                <button type="button" onClick={handleDowngrade} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">Downgrade to Free</button>
              </>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">Usage</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <UsageBar label="Recipes Created" current={usage.recipesCreated} max={limits.maxRecipes} />
            <UsageBar label="Workout Plans" current={usage.workoutPlansCreated} max={limits.maxWorkoutPlans} />
            <UsageBar label="Progress Photos" current={usage.progressPhotosUploaded} max={limits.maxProgressPhotos} />
            <UsageBar label="History Days" current={usage.historyDays} max={limits.maxHistoryDays} />
          </div>
        </div>

        {!premium && (
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6">
            <p className="text-sm font-semibold text-violet-900">Unlock Your Full Potential</p>
            <p className="mt-1 text-xs text-violet-700">Upgrade to Premium for unlimited access.</p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">View Plans</Link>
          </div>
        )}
      </div>

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
