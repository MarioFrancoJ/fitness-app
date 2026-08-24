"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { exercises, type MuscleGroup, type Difficulty } from "@/data/exercises";

const MUSCLE_GROUPS: ("All" | MuscleGroup)[] = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];
const DIFFICULTIES: ("All" | Difficulty)[] = ["All", "Beginner", "Intermediate", "Advanced"];
const EQUIPMENT = ["All", "Barbell", "Dumbbell", "Bodyweight", "Cable", "Machine"] as const;

function difficultyColor(d: Difficulty) {
  switch (d) {
    case "Beginner":     return "bg-emerald-50 text-emerald-700";
    case "Intermediate": return "bg-amber-50 text-amber-700";
    case "Advanced":     return "bg-red-50 text-red-700";
  }
}

export default function AdminExercisesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("All");

  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = muscleFilter === "All" || ex.muscleGroup === muscleFilter;
    const matchesDifficulty = difficultyFilter === "All" || ex.difficulty === difficultyFilter;
    const matchesEquipment = equipmentFilter === "All" || ex.equipment === equipmentFilter;
    return matchesSearch && matchesMuscle && matchesDifficulty && matchesEquipment;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Exercises</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {filtered.length} exercise{filtered.length !== 1 ? "s" : ""} in catalogue
          </p>
        </div>
        <Button type="button" onClick={() => router.push("/admin/exercises/new")}>+ New Exercise</Button>
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

        {/* Muscle group */}
        <select
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
          aria-label="Filter by muscle group"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          {MUSCLE_GROUPS.map((m) => (
            <option key={m} value={m}>{m === "All" ? "All Muscles" : m}</option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          aria-label="Filter by difficulty"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d === "All" ? "All Levels" : d}</option>
          ))}
        </select>

        {/* Equipment */}
        <select
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
          aria-label="Filter by equipment"
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>{eq === "All" ? "All Equipment" : eq}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50">
            <tr>
              <th className="px-5 py-3 font-semibold text-zinc-700">Name</th>
              <th className="px-5 py-3 font-semibold text-zinc-700">Muscle Group</th>
              <th className="px-5 py-3 font-semibold text-zinc-700">Equipment</th>
              <th className="px-5 py-3 font-semibold text-zinc-700">Difficulty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-zinc-400">
                  No exercises found.
                </td>
              </tr>
            ) : (
              filtered.map((ex) => (
                <tr
                  key={ex.id}
                  onClick={() => router.push(`/admin/exercises/${ex.id}`)}
                  className="cursor-pointer transition-colors hover:bg-zinc-50"
                >
                  <td className="px-5 py-3 font-medium text-zinc-900">{ex.name}</td>
                  <td className="px-5 py-3 text-zinc-600">{ex.muscleGroup}</td>
                  <td className="px-5 py-3 text-zinc-600">{ex.equipment}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(ex.difficulty)}`}>
                      {ex.difficulty}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
