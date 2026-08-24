import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recipes — Admin" };

export default function RecipesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Recipes</h1>
      <p className="text-sm text-zinc-500">Manage recipes across the platform.</p>
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
        <span className="text-sm text-zinc-400">Recipe management coming soon</span>
      </div>
    </div>
  );
}
