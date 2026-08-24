import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Dashboard — FitnessApp" };

const cards = [
  {
    label: "Users",
    value: "1,284",
    change: "+12 this week",
    href: "/admin/users",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "Exercises",
    value: "348",
    change: "+5 pending review",
    href: "/admin/exercises",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    label: "Ingredients",
    value: "12,490",
    change: "Full catalogue",
    href: "/admin/ingredients",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    label: "Recipes",
    value: "864",
    change: "+23 this month",
    href: "/admin/recipes",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    label: "Meal Plans",
    value: "412",
    change: "189 active",
    href: "/admin/meal-plans",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    label: "Workout Plans",
    value: "156",
    change: "98 active",
    href: "/admin/workout-plans",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Platform overview and key metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${card.color} ${card.bgColor}`}
              >
                {card.label}
              </span>
              <span className="text-xs text-zinc-400 transition-colors group-hover:text-zinc-600">
                View →
              </span>
            </div>
            <p className="text-3xl font-bold text-zinc-900">{card.value}</p>
            <p className="text-xs text-zinc-400">{card.change}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
