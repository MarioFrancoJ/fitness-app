"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

const STORAGE_KEY = "fitnessapp_weight_logs";

function loadWeightLogs(): WeightEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWeightLogs(data: WeightEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    setLogs(loadWeightLogs());
  }, []);

  const currentWeight = logs.length > 0 ? logs[0].weight : null;
  const startingWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;
  const difference =
    currentWeight !== null && startingWeight !== null
      ? currentWeight - startingWeight
      : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsed = parseFloat(weight);
    if (!weight.trim() || isNaN(parsed) || parsed < 20 || parsed > 500) {
      setError("Enter a valid weight between 20 and 500 kg.");
      return;
    }

    setError("");

    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      weight: parsed,
    };

    const updated = [entry, ...logs];
    setLogs(updated);
    saveWeightLogs(updated);
    setWeight("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Weight Tracker
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Log your body weight and track changes over time.
        </p>
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
          <p className="text-xs font-medium text-zinc-400">Starting Weight</p>
          <p className="text-2xl font-bold text-zinc-900">
            {startingWeight !== null ? `${startingWeight} kg` : "—"}
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Difference</p>
          <p
            className={`text-2xl font-bold ${
              difference !== null && difference < 0
                ? "text-emerald-600"
                : difference !== null && difference > 0
                ? "text-red-600"
                : "text-zinc-900"
            }`}
          >
            {difference !== null
              ? `${difference > 0 ? "+" : ""}${difference.toFixed(1)} kg`
              : "—"}
          </p>
        </div>
      </div>

      {/* Log form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-700">Log Weight</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Input
              id="weight"
              type="number"
              label="Weight (kg)"
              placeholder="e.g. 75.4"
              step={0.1}
              min={20}
              max={500}
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                if (error) setError("");
              }}
              error={error}
            />
          </div>
          <div className="w-40">
            <Input
              id="date"
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit">Save</Button>
        </div>
      </form>

      {/* History table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-700">
            History ({logs.length} entries)
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">No weight entries yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Date</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Weight</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.map((entry, i) => {
                  const prev = logs[i + 1];
                  const change = prev
                    ? entry.weight - prev.weight
                    : null;
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">
                        {entry.date}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">
                        {entry.weight} kg
                      </td>
                      <td className="px-5 py-3">
                        {change !== null ? (
                          <span
                            className={`text-xs font-medium ${
                              change < 0
                                ? "text-emerald-600"
                                : change > 0
                                ? "text-red-600"
                                : "text-zinc-400"
                            }`}
                          >
                            {change > 0 ? "+" : ""}
                            {change.toFixed(1)} kg
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
