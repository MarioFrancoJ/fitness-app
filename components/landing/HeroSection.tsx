const stats = [
  { label: "Active Users", value: "12,400" },
  { label: "Workouts Logged", value: "284K" },
  { label: "Avg. Goal Completion", value: "91%" },
];

const dashboardCards = [
  {
    title: "Today's Workout",
    subtitle: "Upper Body Strength",
    detail: "6 exercises · 45 min",
    badge: "In Progress",
    badgeColor: "bg-blue-50 text-blue-600",
  },
  {
    title: "Calories Today",
    subtitle: "1,840 / 2,200 kcal",
    detail: "Protein 142g · Carbs 198g · Fat 61g",
    badge: "On Track",
    badgeColor: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Weekly Streak",
    subtitle: "5 days active",
    detail: "Personal best — keep going",
    badge: "🔥 Streak",
    badgeColor: "bg-orange-50 text-orange-600",
  },
  {
    title: "Body Weight",
    subtitle: "78.4 kg",
    detail: "↓ 1.2 kg this month",
    badge: "Progress",
    badgeColor: "bg-violet-50 text-violet-600",
  },
];

export default function HeroSection() {
  return (
    <section className="pb-24 pt-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Now in public beta
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-zinc-900">
              Transform Your{" "}
              <span className="text-zinc-400">Fitness Journey</span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-zinc-500">
              Personalized workouts, nutrition plans and progress tracking in
              one modern platform.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/register"
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                Start Free
              </a>
              <a
                href="/login"
                className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Login
              </a>
            </div>

            {/* Social proof stats */}
            <div className="flex gap-8 border-t border-zinc-100 pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-zinc-900">{s.value}</p>
                  <p className="text-xs text-zinc-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard placeholder */}
          <div className="flex flex-col gap-4">
            {/* Top bar mock */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-5 py-3 shadow-sm">
              <span className="text-sm font-medium text-zinc-700">
                Good morning, Alex 👋
              </span>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                Pro Plan
              </span>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 gap-4">
              {dashboardCards.map((card) => (
                <div
                  key={card.title}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium text-zinc-400">
                      {card.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-zinc-900">
                    {card.subtitle}
                  </p>
                  <p className="text-xs text-zinc-400">{card.detail}</p>
                </div>
              ))}
            </div>

            {/* Bottom activity bar */}
            <div className="rounded-xl border border-zinc-100 bg-white px-5 py-4 shadow-sm">
              <p className="mb-3 text-xs font-medium text-zinc-400">
                Weekly Activity
              </p>
              <div className="flex items-end gap-1.5">
                {[60, 80, 45, 90, 70, 95, 40].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-zinc-900"
                    style={{ height: `${h * 0.4}px` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i} className="flex-1 text-center text-xs text-zinc-400">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
