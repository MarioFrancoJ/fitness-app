"use client";

import Link from "next/link";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted: boolean;
};

export default function PricingSection() {
  const { dict } = useDictionary();
  const p = dict.pricing.landing;

  const plans: Plan[] = [
    {
      name: p.plans.basic.name,
      price: p.plans.basic.price,
      period: p.periodFreeForever,
      description: p.plans.basic.description,
      features: p.plans.basic.features,
      cta: p.plans.basic.cta,
      highlighted: false,
    },
    {
      name: p.plans.pro.name,
      price: p.plans.pro.price,
      period: p.periodPerMonth,
      description: p.plans.pro.description,
      features: p.plans.pro.features,
      cta: p.plans.pro.cta,
      highlighted: true,
    },
    {
      name: p.plans.elite.name,
      price: p.plans.elite.price,
      period: p.periodPerMonth,
      description: p.plans.elite.description,
      features: p.plans.elite.features,
      cta: p.plans.elite.cta,
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
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

        {/* Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-8 shadow-sm ${
                plan.highlighted
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-900 shadow">
                    {p.mostPopular}
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-6">
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="mb-1 text-sm text-zinc-400">
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm ${
                    plan.highlighted ? "text-zinc-400" : "text-zinc-500"
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
                        plan.highlighted ? "text-emerald-400" : "text-emerald-600"
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-zinc-300" : "text-zinc-600"
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
                  plan.highlighted
                    ? "bg-white text-zinc-900 hover:bg-zinc-100"
                    : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
