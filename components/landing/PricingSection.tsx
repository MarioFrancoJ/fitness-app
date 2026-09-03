"use client";

import { useState } from "react";
import Link from "next/link";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

type BillingCycle = "monthly" | "yearly";

// Default billing cycle. Set to "yearly" to lead with annual billing
// (favors retention + annual conversion). Switch to "monthly" here to change it.
const DEFAULT_CYCLE: BillingCycle = "yearly";

type PlanKey = "basic" | "pro" | "elite";

// Parse a formatted price like "$5.99" into a number (5.99). Returns null for
// non-numeric prices (e.g. "Free"), so callers can skip savings math.
function parsePrice(price: string): number | null {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Real yearly savings %: how much cheaper the annual plan is vs paying monthly
// for 12 months. Returns null when it can't be computed (free/invalid prices).
function yearlySavingsPct(monthly: string, yearly: string): number | null {
  const m = parsePrice(monthly);
  const y = parsePrice(yearly);
  if (m === null || y === null) return null;
  const fullYear = m * 12;
  if (fullYear <= 0) return null;
  return Math.round(((fullYear - y) / fullYear) * 100);
}

export default function PricingSection() {
  const { dict } = useDictionary();
  const p = dict.pricing.landing;
  const [cycle, setCycle] = useState<BillingCycle>(DEFAULT_CYCLE);
  const isYearly = cycle === "yearly";

  // Highest real savings across paid plans — drives the "Save up to X%" badge
  // on the yearly toggle, so the headline claim is always accurate.
  const maxSavings = (["pro", "elite"] as PlanKey[]).reduce((max, key) => {
    const pct = yearlySavingsPct(p.plans[key].priceMonthly, p.plans[key].priceYearly);
    return pct !== null && pct > max ? pct : max;
  }, 0);

  const planOrder: { key: PlanKey; highlighted: boolean }[] = [
    { key: "basic", highlighted: false },
    // Pro is the highlighted "Most Popular" card — the primary Free → paid jump.
    { key: "pro", highlighted: true },
    { key: "elite", highlighted: false },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
            {p.eyebrow}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
            {p.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            {p.subtitle}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-12 flex flex-col items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {p.billingLabel}
          </span>
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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
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
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                isYearly ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900",
              ].join(" ")}
            >
              {p.yearly}
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {p.saveUpTo.replace("{percent}", String(maxSavings))}
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {planOrder.map(({ key, highlighted }) => {
            const plan = p.plans[key];
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            const isFree = key === "basic";
            // Period suffix: free plans show "Free forever"; paid plans show
            // /month or /year depending on the selected billing cycle.
            const period = isFree
              ? p.periodFreeForever
              : isYearly
              ? p.perYear
              : p.perMonth;
            const showApprox = isYearly && !isFree && plan.approxMonthly !== "";
            const savingsPct = yearlySavingsPct(plan.priceMonthly, plan.priceYearly);
            // Show the real per-plan savings chip next to the annual price.
            const showSavings = isYearly && !isFree && savingsPct !== null && savingsPct > 0;

            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-xl border p-8 shadow-sm transition-colors ${
                  highlighted
                    ? "border-zinc-900 bg-zinc-900 text-white lg:-mt-2 lg:mb-2"
                    : "border-zinc-200 bg-white text-zinc-900"
                }`}
              >
                {/* Top badge: "Most Popular" only on the highlighted (Pro) card. */}
                {highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow">
                      {p.mostPopular}
                    </span>
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-6">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
                    {plan.name}
                  </p>
                  <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                    <span className="text-4xl font-bold transition-all duration-300">
                      {price}
                    </span>
                    {!isFree && (
                      <span className="mb-1 text-sm text-zinc-400">{period}</span>
                    )}
                    {isFree && (
                      <span className="mb-1 text-sm text-zinc-400">
                        {p.periodFreeForever}
                      </span>
                    )}
                    {showSavings && (
                      <span className="mb-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        {p.save.replace("{percent}", String(savingsPct))}
                      </span>
                    )}
                  </div>
                  {/* Monthly equivalent for annual plans */}
                  <p
                    className={`mt-1 h-4 text-xs ${
                      highlighted ? "text-zinc-400" : "text-zinc-400"
                    }`}
                  >
                    {showApprox
                      ? p.approxPerMonth.replace("{price}", plan.approxMonthly)
                      : ""}
                  </p>
                  <p
                    className={`mt-2 text-sm ${
                      highlighted ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="mb-8 flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 text-sm ${
                          highlighted ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm ${
                          highlighted ? "text-zinc-300" : "text-zinc-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/register"
                  className={`block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    highlighted
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
