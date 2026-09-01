"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  category: "workout" | "exercise" | "recipe";
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  workout: { label: "Workouts", icon: "💪", color: "bg-blue-50 text-blue-700" },
  exercise: { label: "Exercises", icon: "🏋️", color: "bg-amber-50 text-amber-700" },
  recipe: { label: "Recipes", icon: "🥗", color: "bg-emerald-50 text-emerald-700" },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 10);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handleClick); };
  }, [open, onClose]);

  // Debounced search
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const search = `%${q.trim()}%`;

      const [workouts, exercises, recipes] = await Promise.all([
        supabase.from("workouts").select("id, name, goal").ilike("name", search).eq("is_template", false).limit(5),
        supabase.from("exercises").select("id, name, muscle_group").ilike("name", search).limit(5),
        supabase.from("recipes").select("id, name, goal").ilike("name", search).limit(5),
      ]);

      const items: SearchResult[] = [];

      if (workouts.data) {
        for (const w of workouts.data) {
          items.push({ id: w.id, title: w.name, subtitle: w.goal || "Workout", href: `/workouts/${w.id}`, category: "workout" });
        }
      }
      if (exercises.data) {
        for (const e of exercises.data) {
          items.push({ id: e.id, title: e.name, subtitle: e.muscle_group || "Exercise", href: `/training/exercises/${e.id}`, category: "exercise" });
        }
      }
      if (recipes.data) {
        for (const r of recipes.data) {
          items.push({ id: r.id, title: r.name, subtitle: r.goal || "Recipe", href: `/nutrition/recipes/${r.id}`, category: "recipe" });
        }
      }

      setResults(items);
      setLoading(false);
    }, 300);
  }, []);

  if (!open) return null;

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <div ref={panelRef} className="absolute left-0 right-0 top-full z-50 mx-4 mt-2 max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl sm:left-auto sm:right-auto sm:mx-0 sm:w-96">
      {/* Search input */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { handleSearch(e.target.value); setSelectedIndex(-1); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, -1)); }
            else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
              e.preventDefault();
              window.location.href = results[selectedIndex].href;
              onClose();
            }
          }}
          placeholder="Search workouts, exercises, recipes..."
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setResults([]); }} className="text-zinc-400 hover:text-zinc-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        )}
      </div>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-400">No results found for &quot;{query}&quot;</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="py-2">
            {(() => {
              let flatIndex = -1;
              return Object.entries(grouped).map(([category, items]) => {
                const meta = CATEGORY_META[category];
                return (
                  <div key={category}>
                    <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {meta.icon} {meta.label}
                    </p>
                    {items.map((item) => {
                      flatIndex++;
                      const isSelected = flatIndex === selectedIndex;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onClose}
                          className={["flex items-center gap-3 px-4 py-2.5 transition-colors", isSelected ? "bg-zinc-100" : "hover:bg-zinc-50"].join(" ")}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                            <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                            {meta.label.slice(0, -1)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {!loading && query.length < 2 && (
          <div className="py-6 text-center">
            <p className="text-xs text-zinc-400">Type at least 2 characters to search</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-zinc-100 px-4 py-2">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span><kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 font-mono">↵</kbd> open</span>
          <span><kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
