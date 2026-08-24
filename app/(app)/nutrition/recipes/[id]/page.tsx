import { notFound } from "next/navigation";
import Link from "next/link";
import { recipes } from "@/data/recipes";

function goalColor(goal: string) {
  switch (goal) {
    case "Fat Loss":    return "bg-emerald-50 text-emerald-700";
    case "Muscle Gain": return "bg-blue-50 text-blue-700";
    case "Maintenance": return "bg-amber-50 text-amber-700";
    default:            return "bg-zinc-100 text-zinc-700";
  }
}

export async function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = recipes.find((r) => r.id === id);
  return { title: recipe ? `${recipe.name} — Recipes` : "Recipe Not Found" };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) notFound();

  return (
    <div className="flex flex-col gap-6">
      {/* Back link */}
      <Link
        href="/nutrition/recipes"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        ← Back to Recipes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {recipe.name}
          </h1>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${goalColor(recipe.goal)}`}
          >
            {recipe.goal}
          </span>
        </div>
      </div>

      {/* Image placeholder */}
      <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-10 w-10" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium">Recipe photo</span>
        </div>
      </div>

      {/* Macro cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-zinc-900">{recipe.calories}</p>
          <p className="text-xs text-zinc-400">Calories</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{recipe.protein}g</p>
          <p className="text-xs text-zinc-400">Protein</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{recipe.carbs}g</p>
          <p className="text-xs text-zinc-400">Carbs</p>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{recipe.fat}g</p>
          <p className="text-xs text-zinc-400">Fat</p>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ingredients */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Ingredients
          </h2>
          <ul className="flex flex-col gap-2.5">
            {recipe.ingredients.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Instructions
          </h2>
          <ol className="flex flex-col gap-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Add to Meal Plan */}
      <div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          + Add to Meal Plan
        </button>
        <p className="mt-2 text-xs text-zinc-400">Meal plan functionality coming soon.</p>
      </div>
    </div>
  );
}
