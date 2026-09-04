"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import {
  PLANS,
  type PlanId,
  type BillingCycle,
  formatPrice,
  proApproxMonthly,
  yearlySavingsPct,
  tierForPlanId,
} from "@/lib/plans";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { dict } = useDictionary();
  const p = dict.pricing.landing;
  const { success: showToast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanId>("FREE");
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [loading, setLoading] = useState(true);

  const isYearly = cycle === "yearly";
  const maxSavings = yearlySavingsPct() ?? 0;

  useEffect(() => {
    async function loadSubscription() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .eq("status", "Active")
        .maybeSingle();

      if (sub) {
        setCurrentPlan(sub.plan as PlanId);
      }
      setLoading(false);
    }
    loadSubscription();
  }, []);

  async function handleUpgrade(plan: PlanId) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const now = new Date();
      const renewalDate = new Date(now);
      if (plan === "PREMIUM_MONTHLY") renewalDate.setMonth(now.getMonth() + 1);
      else if (plan === "PREMIUM_YEARLY") renewalDate.setFullYear(now.getFullYear() + 1);

      // Check for existing subscription
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("subscriptions")
          .update({
            plan,
            status: "Active",
            start_date: now.toISOString().slice(0, 10),
            renewal_date: plan !== "FREE" ? renewalDate.toISOString().slice(0, 10) : null,
            expiration_date: null,
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan,
            status: "Active",
            start_date: now.toISOString().slice(0, 10),
            renewal_date: plan !== "FREE" ? renewalDate.toISOString().slice(0, 10) : null,
          });
      }

      setCurrentPlan(plan);
      showToast(plan === "FREE" ? p.toastSwitchedFree : p.toastUpgraded);
    } catch (err) {
      console.error("Failed to update subscription:", err);
      showToast(p.toastUpdateError);
    }
  }

  if (loading) {
    return <PageLoader text={p.loading} />;
  }

  // The current plan's tier — used to mark the active card (Free vs Pro).
  const currentTier = tierForPlanId(currentPlan).tier;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{p.headline}</h1>
        <p className="mt-2 text-sm text-zinc-500">{p.subtitle}</p>
      </div>

      {/* Billing toggle */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">{p.billingLabel}</span>
        <div
          role="group"
          aria-label={p.billingLabel}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1"
        >
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            aria-pressed={!isYearly}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              !isYearly ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            ].join(" ")}
          >
            {p.monthly}
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            aria-pressed={isYearly}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isYearly ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
            ].join(" ")}
          >
            {p.yearly}
            <span className="rounded-full bg-success-light px-2 py-0.5 text-xs font-bold text-success">
              {p.saveUpTo.replace("{percent}", String(maxSavings))}
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards — Free + Pro (centered) */}
      <div className="mx-auto grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        {PLANS.map((cfg) => {
          const plan = p.plans[cfg.dictKey];
          const isFree = cfg.tier === "free";
          const highlighted = cfg.highlighted;
          const isCurrent = currentTier === cfg.tier;
          // The DB id this card would set when purchased on the selected cycle.
          const targetPlanId = cfg.planIdFor(cycle);

          const price = isFree
            ? p.freePrice
            : isYearly
            ? formatPrice(cfg.priceYearly ?? 0)
            : formatPrice(cfg.priceMonthly);
          const period = isFree ? p.periodFreeForever : isYearly ? p.perYear : p.perMonth;
          const showApprox = isYearly && !isFree;
          const savingsPct = isFree ? null : yearlySavingsPct();
          const showSavings = isYearly && !isFree && savingsPct !== null && savingsPct > 0;

          return (
            <div
              key={cfg.tier}
              className={[
                "relative flex flex-col rounded-2xl border p-6 shadow-sm transition-colors",
                highlighted ? "border-primary bg-primary text-white" : "border-zinc-200 bg-white text-zinc-900",
              ].join(" ")}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-white shadow">
                  {p.mostPopular}
                </span>
              )}

              {/* Name */}
              <p className={`text-sm font-semibold uppercase tracking-widest ${highlighted ? "text-white/70" : "text-zinc-400"}`}>
                {plan.name}
              </p>

              {/* Price */}
              <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="text-4xl font-bold">{price}</span>
                <span className={`mb-1 text-sm ${highlighted ? "text-white/60" : "text-zinc-400"}`}>{period}</span>
                {showSavings && (
                  <span className="mb-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-bold text-success">
                    {p.save.replace("{percent}", String(savingsPct))}
                  </span>
                )}
              </div>
              <p className={`mt-1 h-4 text-xs ${highlighted ? "text-white/60" : "text-zinc-400"}`}>
                {showApprox ? p.approxPerMonth.replace("{price}", formatPrice(Number(proApproxMonthly().toFixed(2)))) : ""}
              </p>
              <p className={`mt-2 text-sm ${highlighted ? "text-white/70" : "text-zinc-500"}`}>{plan.description}</p>

              {/* Features */}
              <ul className="mt-5 flex flex-1 flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 ${highlighted ? "text-movive-400" : "text-success"}`}>&#10003;</span>
                    <span className={highlighted ? "text-white/80" : "text-zinc-600"}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-6">
                {isCurrent ? (
                  <span
                    className={[
                      "block w-full rounded-lg py-2.5 text-center text-sm font-semibold",
                      highlighted ? "bg-white/15 text-white" : "border border-zinc-200 bg-zinc-50 text-zinc-500",
                    ].join(" ")}
                  >
                    {p.currentPlan}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(targetPlanId)}
                    className={[
                      "block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      highlighted
                        ? "bg-white text-primary hover:bg-zinc-100 focus-visible:ring-white"
                        : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:ring-primary",
                    ].join(" ")}
                  >
                    {isFree ? plan.cta : plan.cta}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
