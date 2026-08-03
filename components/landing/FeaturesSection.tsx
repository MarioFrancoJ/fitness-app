const features = [
  {
    icon: "⚡",
    title: "Workout Programs",
    description:
      "Structured multi-week training plans built by certified coaches. Adapt intensity, volume, and rest to your schedule.",
  },
  {
    icon: "🥗",
    title: "Nutrition Plans",
    description:
      "Macro-balanced meal plans aligned with your goal — cut, bulk, or maintain. Automatically adjusts as your weight changes.",
  },
  {
    icon: "📈",
    title: "Progress Tracking",
    description:
      "Log body measurements, upload progress photos, and visualise trends across weeks and months with clear charts.",
  },
  {
    icon: "🤖",
    title: "AI Coach",
    description:
      "Chat with an AI fitness assistant that knows your program, your recent metrics, and your goals to give contextual advice.",
  },
  {
    icon: "🍽️",
    title: "Meal Planning",
    description:
      "Build weekly meal plans from a library of 500,000+ foods. Auto-generate shopping lists for any date range.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description:
      "Coaches get compliance dashboards. Clients get volume, streak, and body-composition trend reports — all in one view.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-zinc-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
            Everything you need
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
            Built for serious results
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500">
            Every feature is designed around one goal — helping you and your
            coach work better together.
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
