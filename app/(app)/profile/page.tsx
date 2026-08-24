"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PersonalInfo {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
  activityLevel: string;
}

interface Measurements {
  neck: string;
  chest: string;
  leftArm: string;
  rightArm: string;
  waist: string;
  hips: string;
  leftThigh: string;
  rightThigh: string;
  leftCalf: string;
  rightCalf: string;
}

interface MeasurementRecord {
  id: string;
  date: string;
  weight: string;
  measurements: Measurements;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const USER_KEY = "fitnessapp_user";
const HISTORY_KEY = "fitnessapp_measurement_history";

function loadProfile(): PersonalInfo {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        name: data.name || "",
        age: data.age?.toString() || "",
        gender: data.gender || "",
        height: data.height?.toString() || "",
        weight: data.weight?.toString() || "",
        goal: data.goal || "",
        activityLevel: data.activityLevel || "",
      };
    }
  } catch {}
  return { name: "", age: "", gender: "", height: "", weight: "", goal: "", activityLevel: "" };
}

function saveProfile(info: PersonalInfo) {
  try {
    const stored = localStorage.getItem(USER_KEY);
    const existing = stored ? JSON.parse(stored) : {};
    localStorage.setItem(USER_KEY, JSON.stringify({
      ...existing,
      name: info.name,
      age: info.age ? parseInt(info.age, 10) : null,
      gender: info.gender,
      height: info.height ? parseFloat(info.height) : null,
      weight: info.weight ? parseFloat(info.weight) : null,
      goal: info.goal,
      activityLevel: info.activityLevel,
    }));
  } catch {}
}

function loadHistory(): MeasurementRecord[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: MeasurementRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GOALS = ["Lose Fat", "Build Muscle", "Maintain Weight", "Improve Performance", "Calisthenics Skills"];
const ACTIVITY_LEVELS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Athlete"];
const GENDERS = ["Male", "Female", "Other"];

const EMPTY_MEASUREMENTS: Measurements = {
  neck: "", chest: "", leftArm: "", rightArm: "",
  waist: "", hips: "", leftThigh: "", rightThigh: "",
  leftCalf: "", rightCalf: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [info, setInfo] = useState<PersonalInfo>(loadProfile());
  const [measurements, setMeasurements] = useState<Measurements>(EMPTY_MEASUREMENTS);
  const [history, setHistory] = useState<MeasurementRecord[]>([]);
  const [profileSaved, setProfileSaved] = useState(false);
  const [measurementSaved, setMeasurementSaved] = useState(false);

  useEffect(() => {
    setInfo(loadProfile());
    setHistory(loadHistory());
  }, []);

  // ── Personal Info ─────────────────────────────────────────────────────────

  function handleInfoChange(field: keyof PersonalInfo, value: string) {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    saveProfile(info);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  // ── Measurements ──────────────────────────────────────────────────────────

  function handleMeasurementChange(field: keyof Measurements, value: string) {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveMeasurements(e: FormEvent) {
    e.preventDefault();

    const record: MeasurementRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      weight: info.weight,
      measurements: { ...measurements },
    };

    const updated = [record, ...history];
    setHistory(updated);
    saveHistory(updated);
    setMeasurements(EMPTY_MEASUREMENTS);
    setMeasurementSaved(true);
    setTimeout(() => setMeasurementSaved(false), 2000);
  }

  // ── Progress Summary ──────────────────────────────────────────────────────

  const currentWeight = info.weight ? parseFloat(info.weight) : null;
  const startingWeight = history.length > 0 && history[history.length - 1].weight
    ? parseFloat(history[history.length - 1].weight)
    : currentWeight;
  const difference = currentWeight !== null && startingWeight !== null
    ? currentWeight - startingWeight
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your personal information and track body measurements.</p>
      </div>

      {/* Progress Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Current Weight</p>
          <p className="text-2xl font-bold text-zinc-900">{currentWeight ? `${currentWeight} kg` : "—"}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Starting Weight</p>
          <p className="text-2xl font-bold text-zinc-900">{startingWeight ? `${startingWeight} kg` : "—"}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">Difference</p>
          <p className={`text-2xl font-bold ${difference !== null && difference < 0 ? "text-emerald-600" : difference !== null && difference > 0 ? "text-red-600" : "text-zinc-900"}`}>
            {difference !== null ? `${difference > 0 ? "+" : ""}${difference.toFixed(1)} kg` : "—"}
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <form onSubmit={handleSaveProfile} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-700">Personal Information</p>
          {profileSaved && <span className="text-xs font-medium text-emerald-600">✓ Saved</span>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input id="name" type="text" label="Full Name" value={info.name}
            onChange={(e) => handleInfoChange("name", e.target.value)} placeholder="Alex Johnson" />
          <Input id="age" type="number" label="Age" value={info.age}
            onChange={(e) => handleInfoChange("age", e.target.value)} placeholder="28" min={10} max={120} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="gender" className="text-sm font-medium text-zinc-700">Gender</label>
            <select id="gender" value={info.gender} onChange={(e) => handleInfoChange("gender", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
              <option value="">Select</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <Input id="height" type="number" label="Height (cm)" value={info.height}
            onChange={(e) => handleInfoChange("height", e.target.value)} placeholder="175" step={0.1} />
          <Input id="weight" type="number" label="Weight (kg)" value={info.weight}
            onChange={(e) => handleInfoChange("weight", e.target.value)} placeholder="72" step={0.1} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal" className="text-sm font-medium text-zinc-700">Goal</label>
            <select id="goal" value={info.goal} onChange={(e) => handleInfoChange("goal", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
              <option value="">Select</option>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="activityLevel" className="text-sm font-medium text-zinc-700">Activity Level</label>
            <select id="activityLevel" value={info.activityLevel} onChange={(e) => handleInfoChange("activityLevel", e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
              <option value="">Select</option>
              {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5">
          <Button type="submit">Save Profile</Button>
        </div>
      </form>

      {/* Body Measurements */}
      <form onSubmit={handleSaveMeasurements} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-700">Body Measurements (cm)</p>
          {measurementSaved && <span className="text-xs font-medium text-emerald-600">✓ Saved</span>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input id="neck" type="number" label="Neck" value={measurements.neck} step={0.1}
            onChange={(e) => handleMeasurementChange("neck", e.target.value)} placeholder="38" />
          <Input id="chest" type="number" label="Chest" value={measurements.chest} step={0.1}
            onChange={(e) => handleMeasurementChange("chest", e.target.value)} placeholder="100" />
          <Input id="leftArm" type="number" label="Left Arm" value={measurements.leftArm} step={0.1}
            onChange={(e) => handleMeasurementChange("leftArm", e.target.value)} placeholder="35" />
          <Input id="rightArm" type="number" label="Right Arm" value={measurements.rightArm} step={0.1}
            onChange={(e) => handleMeasurementChange("rightArm", e.target.value)} placeholder="35" />
          <Input id="waist" type="number" label="Waist" value={measurements.waist} step={0.1}
            onChange={(e) => handleMeasurementChange("waist", e.target.value)} placeholder="80" />
          <Input id="hips" type="number" label="Hips" value={measurements.hips} step={0.1}
            onChange={(e) => handleMeasurementChange("hips", e.target.value)} placeholder="95" />
          <Input id="leftThigh" type="number" label="Left Thigh" value={measurements.leftThigh} step={0.1}
            onChange={(e) => handleMeasurementChange("leftThigh", e.target.value)} placeholder="55" />
          <Input id="rightThigh" type="number" label="Right Thigh" value={measurements.rightThigh} step={0.1}
            onChange={(e) => handleMeasurementChange("rightThigh", e.target.value)} placeholder="55" />
          <Input id="leftCalf" type="number" label="Left Calf" value={measurements.leftCalf} step={0.1}
            onChange={(e) => handleMeasurementChange("leftCalf", e.target.value)} placeholder="38" />
          <Input id="rightCalf" type="number" label="Right Calf" value={measurements.rightCalf} step={0.1}
            onChange={(e) => handleMeasurementChange("rightCalf", e.target.value)} placeholder="38" />
        </div>
        <div className="mt-5">
          <Button type="submit">Save Measurements</Button>
        </div>
      </form>

      {/* Measurement History */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-700">Measurement History ({history.length} records)</p>
        </div>
        {history.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">No measurements recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Weight</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Neck</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Chest</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">L.Arm</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">R.Arm</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Waist</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">Hips</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">L.Thigh</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">R.Thigh</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">L.Calf</th>
                  <th className="px-4 py-3 font-semibold text-zinc-700">R.Calf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{record.date}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.weight || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.neck || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.chest || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.leftArm || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.rightArm || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.waist || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.hips || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.leftThigh || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.rightThigh || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.leftCalf || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.rightCalf || "—"}</td>
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
