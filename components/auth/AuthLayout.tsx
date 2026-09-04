import Logo from "@/components/ui/Logo";

// Dashboard preview cards shown on the dark left panel
const previewCards = [
  {
    label: "Today's Workout",
    value: "Upper Body Strength",
    sub: "6 exercises · 45 min",
    badge: "In Progress",
    badgeColor: "bg-blue-500/20 text-blue-300",
  },
  {
    label: "Calories Today",
    value: "1,840 / 2,200 kcal",
    sub: "Protein 142g · Carbs 198g",
    badge: "On Track",
    badgeColor: "bg-movive-500/20 text-movive-400",
  },
  {
    label: "Weekly Streak",
    value: "5 days active",
    sub: "Personal best — keep going",
    badge: "🔥 Streak",
    badgeColor: "bg-orange-500/20 text-orange-300",
  },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  headline?: string;
  description?: string;
}

export default function AuthLayout({
  children,
  headline = "Welcome Back",
  description = "Join thousands of athletes and coaches already transforming their fitness with Movive.",
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel (dark, 40%) ──────────────────────────────────── */}
      <div className="relative hidden w-2/5 flex-col justify-between bg-zinc-950 px-10 py-12 lg:flex">
        {/* Top: logo + badge */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {/* Isotipo (icon) reads on the dark panel; white wordmark beside it
                since the isologo's wordmark ink is too dark for a dark bg. */}
            <Logo variant="isotipo" className="h-7" alt="" />
            <span className="text-xl font-bold tracking-tight text-white">
              Movive
            </span>
            <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
              Fitness SaaS
            </span>
          </div>

          {/* Headline + description */}
          <div className="mt-10">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
              {headline}
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          </div>
        </div>

        {/* Middle: dashboard preview cards */}
        <div className="flex flex-col gap-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
            Dashboard Preview
          </p>
          {previewCards.map((card) => (
            <div
              key={card.label}
              className="flex items-start justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs text-zinc-500">{card.label}</p>
                <p className="text-sm font-semibold text-white">{card.value}</p>
                <p className="text-xs text-zinc-500">{card.sub}</p>
              </div>
              <span
                className={`mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom: subtle footer */}
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Movive. All rights reserved.
        </p>
      </div>

      {/* ── Right panel (light, 60%) ────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12">
        {children}
      </div>
    </div>
  );
}
