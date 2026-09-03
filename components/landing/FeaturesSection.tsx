"use client";

import { useDictionary } from "@/lib/i18n/DictionaryProvider";

const ICONS = ["⚡", "🥗", "📈", "🤖", "🍽️", "📊"] as const;
const ITEM_KEYS = [
  "workoutPrograms",
  "nutritionPlans",
  "progressTracking",
  "aiCoach",
  "mealPlanning",
  "analytics",
] as const;

export default function FeaturesSection() {
  const { dict } = useDictionary();
  const f = dict.features;

  const features = ITEM_KEYS.map((key, i) => ({
    icon: ICONS[i],
    title: f.items[key].title,
    description: f.items[key].description,
  }));

  return (
    <section id="features" className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
            {f.eyebrow}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
            {f.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            {f.subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-xl">
                {feature.icon}
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
