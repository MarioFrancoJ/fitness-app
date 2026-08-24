"use client";

import { useState } from "react";
import Link from "next/link";
import { exercises, type MuscleGroup, type Difficulty } from "@/data/exercises";

const MUSCLE_GROUPS: ("All" | MuscleGroup)[] = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
const DIFFICULTIES: ("All" | Difficulty)[] = ["All", "Beginner", "Intermediate", "Advanced"];

function difficultyColor(d: Difficulty) {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
  }
}

export default function ExercisesPage() {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<"All" | MuscleGroup>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | Difficulty>("All");

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = muscleFilter === "All" || ex.muscleGroup === muscleFilter;
    const matchesDifficulty = difficultyFilter === "All" || ex.difficulty === difficultyFilter;
    return matchesSearch && matchesMuscle && matchesDifficulty;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Exercises</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {filtered.length} exercise{filtered.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-64">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search exercises"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
        </div>

        {/* Muscle group filter */}
        <select
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value as "All" | MuscleGroup)}
          aria-label="Filter by muscle group"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>
              {m === "All" ? "All Muscles" : m}
            </option>
          ))}
        </select>

        {/* Difficulty filter */}
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as "All" | Difficulty)}
          aria-label="Filter by difficulty"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All Levels" : d}
            </option>
          ))}
        </select>
      </div>

      {/* Exercise cards */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
          <p className="text-sm text-zinc-400">No exercises match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((ex) => (
            <Link
              key={ex.id}
              href={`/training/exercises/${ex.id}`}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">{ex.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(ex.difficulty)}`}
                >
                  {ex.difficulty}
                </span>
              </div>

              <div className="mt-auto flex items-center gap-3 border-t border-zinc-100 pt-3">
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {ex.muscleGroup}
                </span>
                <span className="text-xs text-zinc-400">{ex.equipment}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
