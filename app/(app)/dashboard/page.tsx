import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — FitnessApp",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Good morning — here&apos;s your overview for today.
        </p>
      </div>

      {/* Placeholder metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Workouts This Week", value: "4", sub: "+1 from last week" },
          { label: "Calories Today",     value: "1,840", sub: "Goal: 2,200 kcal" },
          { label: "Active Streak",      value: "5 days", sub: "Personal best" },
          { label: "Body Weight",        value: "78.4 kg", sub: "↓ 1.2 kg this month" },
        ].map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-zinc-400">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
            <p className="text-xs text-zinc-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Placeholder content area */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">
            Today&apos;s Workout
          </p>
          <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-50">
            <p className="text-sm text-zinc-400">Workout module coming soon</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">
            Nutrition Summary
          </p>
          <div className="flex h-32 items-center justify-center rounded-lg bg-zinc-50">
            <p className="text-sm text-zinc-400">Nutrition module coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
