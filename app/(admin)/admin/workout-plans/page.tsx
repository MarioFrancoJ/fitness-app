"use client";

import { useState, useEffect } from "react";
import { loadTemplates, deleteTemplate, addTemplate } from "@/lib/workouts-store";
import { WORKOUT_GOALS, WORKOUT_DIFFICULTIES, type Workout, type WorkoutGoal, type WorkoutDifficulty } from "@/data/workouts";
import Button from "@/components/ui/Button";

function difficultyColor(d: WorkoutDifficulty): string {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
  }
}

export default function AdminWorkoutTemplatesPage() {
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState<"All" | WorkoutGoal>("All");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTemplates(loadTemplates());
    setHydrated(true);
  }, []);

  function refresh() { setTemplates(loadTemplates()); }

  function handleDelete(id: string) {
    deleteTemplate(id);
    refresh();
  }

  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesGoal = goalFilter === "All" || t.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Workout Templates</h1>
          <p className="mt-1 text-sm text-zinc-500">{templates.length} template{templates.length !== 1 ? "s" : ""} available</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input type="search" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search templates"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
        <select value={goalFilter} onChange={(e) => setGoalFilter(e.target.value as "All" | WorkoutGoal)} aria-label="Filter by goal"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
          <option value="All">All Goals</option>
          {WORKOUT_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 font-semibold text-zinc-700">Name</th>
                <th className="px-5 py-3 font-semibold text-zinc-700">Goal</th>
                <th className="px-5 py-3 font-semibold text-zinc-700">Difficulty</th>
                <th className="px-5 py-3 font-semibold text-zinc-700">Days</th>
                <th className="px-5 py-3 font-semibold text-zinc-700">Duration</th>
                <th className="px-5 py-3 font-semibold text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-400">No templates found.</td></tr>
              ) : (
                filtered.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-900">{tpl.name}</p>
                      <p className="text-xs text-zinc-400 line-clamp-1">{tpl.description}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{tpl.goal}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(tpl.difficulty)}`}>{tpl.difficulty}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{tpl.workoutDays.length}</td>
                    <td className="px-5 py-3 text-zinc-600">{tpl.duration} min</td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => handleDelete(tpl.id)} className="text-xs font-medium text-zinc-500 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
