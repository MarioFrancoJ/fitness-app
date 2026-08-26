"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShoppingItem {
  id: string;
  ingredientName: string;
  category: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

type FilterMode = "all" | "pending" | "purchased";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
      </span>
      <p className="text-sm font-medium text-zinc-800">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="ml-1 text-zinc-400 hover:text-zinc-600 focus-visible:outline-none">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
      </button>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-zinc-400" aria-hidden="true">
          <path fillRule="evenodd" d="M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.414A2 2 0 0 0 15.414 6L12 2.586A2 2 0 0 0 10.586 2H6Zm5 6a1 1 0 1 0-2 0v2H7a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2V8Z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="mb-1 text-base font-semibold text-zinc-900">No meal plan available</p>
      <p className="mb-6 text-sm text-zinc-500">Create a weekly meal plan first to generate your shopping list.</p>
      <Link
        href="/meal-planner"
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
      >
        Go to Meal Planner
      </Link>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = "text-zinc-900" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{label}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Load from Supabase ──────────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Check if a meal plan exists for current week
      const { start, end } = getWeekDates();
      const { data: planData } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start_date", start)
        .eq("week_end_date", end)
        .maybeSingle();

      setHasMealPlan(!!planData);

      // Load saved shopping list (most recent for this user)
      const { data: listData } = await supabase
        .from("shopping_lists")
        .select("id, items")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (listData) {
        setListId(listData.id);
        const storedItems = (listData.items as any[]) || [];
        setItems(storedItems.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          ingredientName: item.ingredientName || item.name || "",
          category: item.category || "Other",
          quantity: item.quantity || 0,
          unit: item.unit || "",
          purchased: item.purchased || false,
        })));
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // ── Persist to Supabase ─────────────────────────────────────────────────────

  async function saveItems(updatedItems: ShoppingItem[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);

    try {
      if (listId) {
        const { error } = await supabase
          .from("shopping_lists")
          .update({ items: updatedItems as any })
          .eq("id", listId);
        if (error) console.error("Failed to update shopping list:", error.message);
      } else {
        const { data: inserted, error } = await supabase
          .from("shopping_lists")
          .insert({
            user_id: user.id,
            items: updatedItems as any,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Failed to create shopping list:", error.message);
        } else if (inserted) {
          setListId(inserted.id);
        }
      }
    } catch (err) {
      console.error("Shopping list save error:", err);
    }

    setSaving(false);
  }

  // ── Generate from Meal Plan ─────────────────────────────────────────────────

  async function handleGenerate() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load current week's meal plan
    const { start, end } = getWeekDates();
    const { data: planData } = await supabase
      .from("meal_plans")
      .select("plan_data")
      .eq("user_id", user.id)
      .eq("week_start_date", start)
      .eq("week_end_date", end)
      .maybeSingle();

    if (!planData || !planData.plan_data) {
      setToast("No meal plan found for this week");
      return;
    }

    // Extract recipe IDs from plan
    const plan = planData.plan_data as Record<string, Record<string, string | null>>;
    const recipeCounts: Record<string, number> = {};

    for (const day of Object.values(plan)) {
      for (const id of Object.values(day)) {
        if (id) {
          recipeCounts[id] = (recipeCounts[id] || 0) + 1;
        }
      }
    }

    const recipeIds = Object.keys(recipeCounts);
    if (recipeIds.length === 0) {
      setToast("Your meal plan is empty. Add recipes first.");
      return;
    }

    // Load recipe ingredients from Supabase
    const { data: recipesData, error: recipesErr } = await supabase
      .from("recipes")
      .select(`
        id,
        recipe_ingredients (
          name,
          quantity,
          unit
        )
      `)
      .in("id", recipeIds);

    if (recipesErr || !recipesData || recipesData.length === 0) {
      setToast("Could not load recipe ingredients");
      return;
    }

    // Aggregate ingredients
    const ingredientMap: Record<string, { qty: number; unit: string }> = {};

    for (const recipe of recipesData) {
      const count = recipeCounts[recipe.id] || 1;
      for (const ing of (recipe.recipe_ingredients || [])) {
        const key = ing.name.toLowerCase();
        if (ingredientMap[key]) {
          ingredientMap[key].qty += (ing.quantity || 0) * count;
        } else {
          ingredientMap[key] = { qty: (ing.quantity || 0) * count, unit: ing.unit || "" };
        }
      }
    }

    // Convert to ShoppingItem array
    const generated: ShoppingItem[] = Object.entries(ingredientMap)
      .map(([name, { qty, unit }]) => ({
        id: crypto.randomUUID(),
        ingredientName: name.charAt(0).toUpperCase() + name.slice(1),
        category: "General",
        quantity: Math.round(qty * 100) / 100,
        unit,
        purchased: false,
      }))
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));

    setItems(generated);
    setHasMealPlan(true);
    await saveItems(generated);
    setToast("Shopping list generated from meal plan!");
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleClear() {
    setItems([]);
    await saveItems([]);
    setToast("Shopping list cleared");
  }

  async function handleResetPurchased() {
    const updated = items.map((i) => ({ ...i, purchased: false }));
    setItems(updated);
    await saveItems(updated);
    setToast("All items marked as pending");
  }

  async function togglePurchased(id: string) {
    const updated = items.map((i) => (i.id === id ? { ...i, purchased: !i.purchased } : i));
    setItems(updated);
    await saveItems(updated);
  }

  async function deleteItem(id: string) {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    await saveItems(updated);
  }

  function handleExportCSV() {
    if (items.length === 0) {
      setToast("No items to export");
      return;
    }
    const header = "Ingredient,Category,Quantity,Unit,Status\n";
    const rows = items.map((i) =>
      `"${i.ingredientName}","${i.category}",${i.quantity},"${i.unit}","${i.purchased ? "Purchased" : "Pending"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopping-list.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast("CSV exported!");
  }

  function handleExportPDF() {
    setToast("PDF export coming soon!");
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchesFilter = filter === "all" || (filter === "pending" && !i.purchased) || (filter === "purchased" && i.purchased);
      const matchesCategory = categoryFilter === "All" || i.category === categoryFilter;
      const matchesSearch = !search || i.ingredientName.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [items, filter, categoryFilter, search]);

  const totalItems = items.length;
  const purchasedItems = items.filter((i) => i.purchased).length;
  const remainingItems = totalItems - purchasedItems;

  const statusFilters: { label: string; value: FilterMode }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Purchased", value: "purchased" },
  ];

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-400">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Shopping List</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Auto-generated from your weekly meal plan recipes.
              {saving && <span className="ml-2 text-xs text-zinc-400">(Saving...)</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleGenerate} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.28a.75.75 0 0 0-.75.75v3.955a.75.75 0 0 0 1.5 0v-2.134l.235.234A7 7 0 0 0 17 10a.75.75 0 0 0-1.5 0c0 .51-.07 1.003-.188 1.424ZM4.688 8.576a5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h3.952a.75.75 0 0 0 .75-.75V3.216a.75.75 0 0 0-1.5 0v2.134l-.235-.234A7 7 0 0 0 3 10a.75.75 0 0 0 1.5 0c0-.51.07-1.003.188-1.424Z" clipRule="evenodd" />
              </svg>
              Generate List
            </button>
            <button type="button" onClick={handleResetPurchased} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
              Reset Status
            </button>
            <button type="button" onClick={handleClear} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
              Clear List
            </button>
          </div>
        </div>

        {!hasMealPlan && items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Dashboard Cards ── */}
            <div className="grid gap-3 grid-cols-3">
              <StatCard label="Total Items" value={totalItems} />
              <StatCard label="Purchased" value={purchasedItems} color="text-emerald-600" />
              <StatCard label="Remaining" value={remainingItems} color="text-amber-600" />
            </div>

            {/* ── Filters & Search ── */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-56">
                <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input
                  type="search"
                  placeholder="Search ingredients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search ingredients"
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>

              {/* Status filter */}
              <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                {statusFilters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                      filter === f.value ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              {categories.length > 1 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Export buttons */}
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={handleExportPDF} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  PDF
                </button>
                <button type="button" onClick={handleExportCSV} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  CSV
                </button>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Ingredient</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Category</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Quantity</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Unit</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">
                        {items.length === 0
                          ? "No items. Click \"Generate List\" to create from your meal plan."
                          : "No items match your current filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className={[
                          "border-b border-zinc-50 transition-colors",
                          item.purchased ? "bg-zinc-50" : "hover:bg-zinc-25",
                        ].join(" ")}
                      >
                        <td className="px-5 py-3">
                          <span className={[
                            "text-sm font-medium",
                            item.purchased ? "text-zinc-400 line-through" : "text-zinc-900",
                          ].join(" ")}>
                            {item.ingredientName}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={item.purchased ? "text-zinc-400" : "text-zinc-700"}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={[
                            "inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium",
                            item.purchased ? "text-zinc-400" : "text-zinc-600",
                          ].join(" ")}>
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {item.purchased ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                              </svg>
                              Purchased
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => togglePurchased(item.id)}
                              className={[
                                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                                item.purchased
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                              ].join(" ")}
                            >
                              {item.purchased ? "Unmark" : "Mark Purchased"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItem(item.id)}
                              aria-label={`Delete ${item.ingredientName}`}
                              className="rounded-md px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={dismissToast} />}
    </>
  );
}
