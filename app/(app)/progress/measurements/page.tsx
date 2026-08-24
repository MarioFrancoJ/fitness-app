"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Measurement {
  id: string;
  date: string;
  neck: string;
  chest: string;
  waist: string;
  hips: string;
  arm: string;
  thigh: string;
}

const STORAGE_KEY = "fitnessapp_measurements";

function loadMeasurements(): Measurement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMeasurements(data: Measurement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [form, setForm] = useState({
    neck: "",
    chest: "",
    waist: "",
    hips: "",
    arm: "",
    thigh: "",
  });

  useEffect(() => {
    setMeasurements(loadMeasurements());
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Require at least one field filled
    const hasValue = Object.values(form).some((v) => v.trim() !== "");
    if (!hasValue) return;

    const entry: Measurement = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      ...form,
    };

    const updated = [entry, ...measurements];
    setMeasurements(updated);
    saveMeasurements(updated);
    setForm({ neck: "", chest: "", waist: "", hips: "", arm: "", thigh: "" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Body Measurements
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Track your body measurements over time. All values in centimeters.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="mb-4 text-sm font-semibold text-zinc-700">
          New Measurement
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input id="neck" type="number" label="Neck (cm)" placeholder="e.g. 38" step={0.1} value={form.neck} onChange={handleChange} />
          <Input id="chest" type="number" label="Chest (cm)" placeholder="e.g. 100" step={0.1} value={form.chest} onChange={handleChange} />
          <Input id="waist" type="number" label="Waist (cm)" placeholder="e.g. 80" step={0.1} value={form.waist} onChange={handleChange} />
          <Input id="hips" type="number" label="Hips (cm)" placeholder="e.g. 95" step={0.1} value={form.hips} onChange={handleChange} />
          <Input id="arm" type="number" label="Arm (cm)" placeholder="e.g. 35" step={0.1} value={form.arm} onChange={handleChange} />
          <Input id="thigh" type="number" label="Thigh (cm)" placeholder="e.g. 55" step={0.1} value={form.thigh} onChange={handleChange} />
        </div>
        <div className="mt-5">
          <Button type="submit">Save Measurement</Button>
        </div>
      </form>

      {/* History table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-700">History</p>
        </div>

        {measurements.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">No measurements recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Date</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Neck</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Chest</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Waist</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Hips</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Arm</th>
                  <th className="px-5 py-3 font-semibold text-zinc-700">Thigh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 font-medium text-zinc-900">{m.date}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.neck || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.chest || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.waist || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.hips || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.arm || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600">{m.thigh || "—"}</td>
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
