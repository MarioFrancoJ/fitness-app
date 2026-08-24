"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  loadSubscription, upgradePlan, cancelSubscription, downgradeToFree, startTrial,
  isPremium, getUsageStats, getCurrentLimits, getPlanBadge,
  PLAN_DEFINITIONS, type Subscription, type UsageStats, type PlanLimits,
} from "@/lib/subscription";

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

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ recipesCreated: 0, workoutPlansCreated: 0, progressPhotosUploaded: 0, historyDays: 0 });
  const [limits, setLimits] = useState<PlanLimits>({ maxRecipes: 10, maxWorkoutPlans: 3, maxProgressPhotos: 30, maxHistoryDays: 90 });
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    setSub(loadSubscription());
    setUsage(getUsageStats());
    setLimits(getCurrentLimits());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); }
  }, [toast, dismissToast]);

  function refresh() {
    setSub(loadSubscription());
    setUsage(getUsageStats());
    setLimits(getCurrentLimits());
  }

  function handleUpgrade(plan: "PREMIUM_MONTHLY" | "PREMIUM_YEARLY") {
    upgradePlan(plan);
    refresh();
    setToast("Upgraded to Premium!");
  }

  function handleCancel() {
    cancelSubscription();
    refresh();
    setToast("Subscription cancelled. Access until renewal date.");
  }

  function handleDowngrade() {
    downgradeToFree();
    refresh();
    setToast("Downgraded to Free plan.");
  }

  function handleStartTrial() {
    startTrial(7);
    refresh();
    setToast("7-day Premium trial started!");
  }

  if (!hydrated || !sub) return null;

  const badge = getPlanBadge();
  const premium = isPremium();
  const planDef = PLAN_DEFINITIONS.find((p) => p.id === sub.plan) ?? PLAN_DEFINITIONS[0];

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
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
            <div className="rounded-lg bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">Plan</p>
              <p className="text-sm font-bold text-zinc-900">{planDef.name}</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">Status</p>
              <p className={`text-sm font-bold ${sub.status === "Active" ? "text-emerald-600" : sub.status === "Trial" ? "text-amber-600" : "text-red-500"}`}>{sub.status}</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">Start Date</p>
              <p className="text-sm font-bold text-zinc-900">{sub.startDate}</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4">
              <p className="text-xs text-zinc-400">{sub.expirationDate ? "Expires" : "Renewal"}</p>
              <p className="text-sm font-bold text-zinc-900">{sub.expirationDate || sub.renewalDate || "—"}</p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-zinc-400 uppercase">Included Features</p>
            <div className="flex flex-wrap gap-2">
              {planDef.features.map((f) => (
                <span key={f} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">{f}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {!premium && (
              <>
                <button type="button" onClick={() => handleUpgrade("PREMIUM_MONTHLY")}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
                  Upgrade to Monthly ($9.99/mo)
                </button>
                <button type="button" onClick={() => handleUpgrade("PREMIUM_YEARLY")}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                  Upgrade to Yearly ($7.99/mo)
                </button>
                {sub.status !== "Trial" && (
                  <button type="button" onClick={handleStartTrial}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                    Start 7-Day Trial
                  </button>
                )}
              </>
            )}
            {premium && sub.status === "Active" && (
              <>
                <button type="button" onClick={handleCancel}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                  Cancel Subscription
                </button>
                <button type="button" onClick={handleDowngrade}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                  Downgrade to Free
                </button>
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

        {/* Upgrade CTA for free users */}
        {!premium && (
          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-6">
            <p className="text-sm font-semibold text-violet-900">Unlock Your Full Potential</p>
            <p className="mt-1 text-xs text-violet-700">Upgrade to Premium for unlimited access to all features, advanced analytics, and AI coaching.</p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
              View Plans
            </Link>
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
