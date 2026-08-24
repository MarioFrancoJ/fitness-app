"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PLAN_DEFINITIONS, FEATURE_COMPARISON, loadSubscription, upgradePlan, type PlanType } from "@/lib/subscription";

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanType>("FREE");
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    setCurrentPlan(loadSubscription().plan);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); }
  }, [toast, dismissToast]);

  function handleUpgrade(plan: PlanType) {
    upgradePlan(plan);
    setCurrentPlan(plan);
    setToast(plan === "FREE" ? "Switched to Free plan" : "Upgraded to Premium!");
  }

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Choose Your Plan</h1>
          <p className="mt-2 text-sm text-zinc-500">Start free and upgrade when you need more power.</p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto w-full">
          {PLAN_DEFINITIONS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isPremium = plan.id !== "FREE";
            const isYearly = plan.id === "PREMIUM_YEARLY";

            return (
              <div key={plan.id} className={[
                "relative flex flex-col rounded-2xl border p-6 shadow-sm",
                isYearly ? "border-violet-300 bg-violet-50/50 ring-2 ring-violet-200" : "border-zinc-200 bg-white",
              ].join(" ")}>
                {isYearly && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Best Value
                  </span>
                )}

                <p className="text-sm font-semibold text-zinc-900">{plan.name}</p>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">${plan.price}</span>
                  {plan.interval && <span className="text-sm text-zinc-400">/{plan.interval === "month" ? "mo" : "mo (billed yearly)"}</span>}
                  {!plan.interval && <span className="text-sm text-zinc-400">forever</span>}
                </div>

                <ul className="mt-5 flex flex-1 flex-col gap-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
                      <span className="mt-0.5 text-emerald-500">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <span className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 text-center text-sm font-semibold text-zinc-500">
                      Current Plan
                    </span>
                  ) : (
                    <button type="button" onClick={() => handleUpgrade(plan.id)}
                      className={[
                        "block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                        isPremium
                          ? "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:ring-zinc-900"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:ring-zinc-300",
                      ].join(" ")}>
                      {isPremium ? "Upgrade to Premium" : "Start Free"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto w-full">
          <p className="mb-4 text-center text-sm font-semibold text-zinc-900">Feature Comparison</p>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-zinc-700">Feature</th>
                    <th className="px-5 py-3 text-center font-semibold text-zinc-700">Free</th>
                    <th className="px-5 py-3 text-center font-semibold text-zinc-700">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {FEATURE_COMPARISON.map((f) => (
                    <tr key={f.name} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 text-zinc-700">{f.name}</td>
                      <td className="px-5 py-3 text-center">
                        {typeof f.free === "boolean" ? (
                          f.free ? <span className="text-emerald-600 font-semibold">&#10003;</span> : <span className="text-zinc-300">—</span>
                        ) : (
                          <span className="text-xs text-zinc-500">{f.free}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {typeof f.premium === "boolean" ? (
                          f.premium ? <span className="text-emerald-600 font-semibold">&#10003;</span> : <span className="text-zinc-300">—</span>
                        ) : (
                          <span className="text-xs font-medium text-violet-600">{f.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
