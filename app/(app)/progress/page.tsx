"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  waist: string;
  chest: string;
  hips: string;
  neck: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
  bodyFat: string;
  notes: string;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitnessapp_progress";

function loadEntries(): ProgressEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const currentWeight = entries.length > 0 ? entries[0].weight : null;
  const previousWeight = entries.length > 1 ? entries[1].weight : null;
  const weightChange = currentWeight !== null && previousWeight !== null
    ? currentWeight - previousWeight
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Progress Tracking</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track your body measurements and monitor changes over time.
          </p>
        </div>
        <Link href="/progress/new">
          <Button type="button">+ Add Measurement</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Current Weight</p>
          <p className="text-2xl font-bold text-zinc-900">
            {currentWeight !== null ? `${currentWeight} kg` : "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Weight Change</p>
          <p className={`text-2xl font-bold ${weightChange !== null && weightChange < 0 ? "text-emerald-600" : weightChange !== null && weightChange > 0 ? "text-red-600" : "text-zinc-900"}`}>
            {weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "—"}
          </p>
          {weightChange !== null && (
            <p className="text-xs text-zinc-400">vs previous entry</p>
          )}
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Total Entries</p>
          <p className="text-2xl font-bold text-zinc-900">{entries.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-700">Measurement History</p>
        </div>

        {entries.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 px-6">
            <p className="text-sm text-zinc-400">No measurements recorded yet.</p>
            <Link href="/progress/new">
              <Button type="button" variant="outline">Add your first measurement</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Date</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Weight</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Waist</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Chest</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Body Fat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{entry.date}</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.weight} kg</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.waist || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.chest || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{entry.bodyFat ? `${entry.bodyFat}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
