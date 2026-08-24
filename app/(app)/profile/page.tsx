"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PersonalInfo {
  fullName: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  height: string;
  activityLevel: string;
  fitnessGoal: string;
}

interface WeightInfo {
  currentWeight: string;
  goalWeight: string;
  startingWeight: string;
}

interface BodyMeasurements {
  neck: string;
  chest: string;
  waist: string;
  hips: string;
  leftArm: string;
  rightArm: string;
  leftThigh: string;
  rightThigh: string;
  leftCalf: string;
  rightCalf: string;
}

interface MeasurementRecord {
  id: string;
  date: string;
  weight: string;
  measurements: BodyMeasurements;
}

interface ProfileData {
  personalInfo: PersonalInfo;
  weight: WeightInfo;
  measurements: BodyMeasurements;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFILE_KEY = "fitnessapp_user";
const HISTORY_KEY = "fitnessapp_measurement_history";

const GENDERS = ["Male", "Female", "Other"];
const ACTIVITY_LEVELS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Athlete"];
const FITNESS_GOALS = ["Lose Fat", "Build Muscle", "Maintain Weight", "Improve Performance", "Calisthenics Skills"];

const EMPTY_PERSONAL: PersonalInfo = {
  fullName: "",
  email: "",
  gender: "",
  dateOfBirth: "",
  height: "",
  activityLevel: "",
  fitnessGoal: "",
};

const EMPTY_WEIGHT: WeightInfo = {
  currentWeight: "",
  goalWeight: "",
  startingWeight: "",
};

const EMPTY_MEASUREMENTS: BodyMeasurements = {
  neck: "",
  chest: "",
  waist: "",
  hips: "",
  leftArm: "",
  rightArm: "",
  leftThigh: "",
  rightThigh: "",
  leftCalf: "",
  rightCalf: "",
};

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        personalInfo: {
          fullName: data.fullName || data.name || "",
          email: data.email || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          height: data.height?.toString() || "",
          activityLevel: data.activityLevel || "",
          fitnessGoal: data.fitnessGoal || data.goal || "",
        },
        weight: {
          currentWeight: data.currentWeight?.toString() || data.weight?.toString() || "",
          goalWeight: data.goalWeight?.toString() || "",
          startingWeight: data.startingWeight?.toString() || "",
        },
        measurements: {
          neck: data.measurements?.neck?.toString() || "",
          chest: data.measurements?.chest?.toString() || "",
          waist: data.measurements?.waist?.toString() || "",
          hips: data.measurements?.hips?.toString() || "",
          leftArm: data.measurements?.leftArm?.toString() || "",
          rightArm: data.measurements?.rightArm?.toString() || "",
          leftThigh: data.measurements?.leftThigh?.toString() || "",
          rightThigh: data.measurements?.rightThigh?.toString() || "",
          leftCalf: data.measurements?.leftCalf?.toString() || "",
          rightCalf: data.measurements?.rightCalf?.toString() || "",
        },
      };
    }
  } catch {}
  return { personalInfo: EMPTY_PERSONAL, weight: EMPTY_WEIGHT, measurements: EMPTY_MEASUREMENTS };
}

function saveProfileData(data: ProfileData) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        ...existing,
        fullName: data.personalInfo.fullName,
        name: data.personalInfo.fullName,
        email: data.personalInfo.email,
        gender: data.personalInfo.gender,
        dateOfBirth: data.personalInfo.dateOfBirth,
        height: data.personalInfo.height ? parseFloat(data.personalInfo.height) : null,
        activityLevel: data.personalInfo.activityLevel,
        fitnessGoal: data.personalInfo.fitnessGoal,
        goal: data.personalInfo.fitnessGoal,
        currentWeight: data.weight.currentWeight ? parseFloat(data.weight.currentWeight) : null,
        weight: data.weight.currentWeight ? parseFloat(data.weight.currentWeight) : null,
        goalWeight: data.weight.goalWeight ? parseFloat(data.weight.goalWeight) : null,
        startingWeight: data.weight.startingWeight ? parseFloat(data.weight.startingWeight) : null,
        measurements: data.measurements,
      })
    );
  } catch {}
}

function loadHistory(): MeasurementRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: MeasurementRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateNumeric(value: string, min: number, max: number): string | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  if (isNaN(n)) return "Must be a number";
  if (n < min) return `Min ${min}`;
  if (n > max) return `Max ${max}`;
  return undefined;
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg"
    >
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

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          {description && <p className="mt-0.5 text-xs text-zinc-400">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(EMPTY_PERSONAL);
  const [weight, setWeight] = useState<WeightInfo>(EMPTY_WEIGHT);
  const [measurements, setMeasurements] = useState<BodyMeasurements>(EMPTY_MEASUREMENTS);
  const [history, setHistory] = useState<MeasurementRecord[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const dismissToast = useCallback(() => setToast(null), []);

  // Hydrate
  useEffect(() => {
    const profile = loadProfile();
    setPersonalInfo(profile.personalInfo);
    setWeight(profile.weight);
    setMeasurements(profile.measurements);
    setHistory(loadHistory());
    setHydrated(true);
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Record<string, string | undefined> = {};
    e.height = validateNumeric(personalInfo.height, 50, 300);
    e.currentWeight = validateNumeric(weight.currentWeight, 20, 500);
    e.goalWeight = validateNumeric(weight.goalWeight, 20, 500);
    e.startingWeight = validateNumeric(weight.startingWeight, 20, 500);
    e.neck = validateNumeric(measurements.neck, 10, 100);
    e.chest = validateNumeric(measurements.chest, 30, 200);
    e.waist = validateNumeric(measurements.waist, 30, 200);
    e.hips = validateNumeric(measurements.hips, 30, 200);
    e.leftArm = validateNumeric(measurements.leftArm, 10, 100);
    e.rightArm = validateNumeric(measurements.rightArm, 10, 100);
    e.leftThigh = validateNumeric(measurements.leftThigh, 15, 120);
    e.rightThigh = validateNumeric(measurements.rightThigh, 15, 120);
    e.leftCalf = validateNumeric(measurements.leftCalf, 10, 80);
    e.rightCalf = validateNumeric(measurements.rightCalf, 10, 80);
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const data: ProfileData = { personalInfo, weight, measurements };
    saveProfileData(data);

    // Add measurement record to history
    const hasAnyMeasurement = Object.values(measurements).some((v) => v !== "");
    if (hasAnyMeasurement || weight.currentWeight) {
      const record: MeasurementRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        weight: weight.currentWeight,
        measurements: { ...measurements },
      };
      const updated = [record, ...history];
      setHistory(updated);
      saveHistory(updated);
    }

    setEditMode(false);
    setToast("Profile saved successfully!");
  }

  function handleCancel() {
    const profile = loadProfile();
    setPersonalInfo(profile.personalInfo);
    setWeight(profile.weight);
    setMeasurements(profile.measurements);
    setErrors({});
    setEditMode(false);
  }

  // ── Weight change indicator ────────────────────────────────────────────────

  const current = weight.currentWeight ? parseFloat(weight.currentWeight) : null;
  const starting = weight.startingWeight ? parseFloat(weight.startingWeight) : null;
  const goal = weight.goalWeight ? parseFloat(weight.goalWeight) : null;
  const weightChange = current !== null && starting !== null ? current - starting : null;

  if (!hydrated) return null;

  const disabled = !editMode;

  return (
    <>
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Profile</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your personal information and track body measurements.
            </p>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </>
            ) : (
              <Button type="button" onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            1. PERSONAL INFORMATION
        ═══════════════════════════════════════════════════════════════════════ */}
        <Section title="Personal Information" description="Basic info used across all modules.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="fullName"
              label="Full Name"
              value={personalInfo.fullName}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Alex Johnson"
              disabled={disabled}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, email: e.target.value }))}
              placeholder="alex@example.com"
              disabled
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="gender" className="text-sm font-medium text-zinc-700">Gender</label>
              <select
                id="gender"
                value={personalInfo.gender}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, gender: e.target.value }))}
                disabled={disabled}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Input
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              value={personalInfo.dateOfBirth}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, dateOfBirth: e.target.value }))}
              disabled={disabled}
            />
            <Input
              id="height"
              label="Height (cm)"
              type="number"
              value={personalInfo.height}
              onChange={(e) => setPersonalInfo((p) => ({ ...p, height: e.target.value }))}
              placeholder="175"
              step={0.1}
              min={50}
              max={300}
              disabled={disabled}
              error={errors.height}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="activityLevel" className="text-sm font-medium text-zinc-700">Activity Level</label>
              <select
                id="activityLevel"
                value={personalInfo.activityLevel}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, activityLevel: e.target.value }))}
                disabled={disabled}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select</option>
                {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fitnessGoal" className="text-sm font-medium text-zinc-700">Fitness Goal</label>
              <select
                id="fitnessGoal"
                value={personalInfo.fitnessGoal}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, fitnessGoal: e.target.value }))}
                disabled={disabled}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select</option>
                {FITNESS_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════════════
            2. WEIGHT MANAGEMENT
        ═══════════════════════════════════════════════════════════════════════ */}
        <Section title="Weight Management" description="Track your weight journey.">
          {/* Summary cards */}
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-400">Current</p>
              <p className="text-xl font-bold text-zinc-900">
                {current !== null ? `${current} kg` : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-400">Goal</p>
              <p className="text-xl font-bold text-zinc-900">
                {goal !== null ? `${goal} kg` : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-400">Starting</p>
              <p className="text-xl font-bold text-zinc-900">
                {starting !== null ? `${starting} kg` : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-400">Change</p>
              <p
                className={[
                  "text-xl font-bold",
                  weightChange !== null && weightChange < 0
                    ? "text-emerald-600"
                    : weightChange !== null && weightChange > 0
                    ? "text-red-500"
                    : "text-zinc-900",
                ].join(" ")}
              >
                {weightChange !== null
                  ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="currentWeight"
              label="Current Weight (kg)"
              type="number"
              value={weight.currentWeight}
              onChange={(e) => setWeight((w) => ({ ...w, currentWeight: e.target.value }))}
              placeholder="72"
              step={0.1}
              min={20}
              max={500}
              disabled={disabled}
              error={errors.currentWeight}
            />
            <Input
              id="goalWeight"
              label="Goal Weight (kg)"
              type="number"
              value={weight.goalWeight}
              onChange={(e) => setWeight((w) => ({ ...w, goalWeight: e.target.value }))}
              placeholder="68"
              step={0.1}
              min={20}
              max={500}
              disabled={disabled}
              error={errors.goalWeight}
            />
            <Input
              id="startingWeight"
              label="Starting Weight (kg)"
              type="number"
              value={weight.startingWeight}
              onChange={(e) => setWeight((w) => ({ ...w, startingWeight: e.target.value }))}
              placeholder="80"
              step={0.1}
              min={20}
              max={500}
              disabled={disabled}
              error={errors.startingWeight}
            />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════════════
            3. BODY MEASUREMENTS
        ═══════════════════════════════════════════════════════════════════════ */}
        <Section title="Body Measurements" description="All values in centimeters (cm).">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              id="neck" label="Neck" type="number" value={measurements.neck}
              onChange={(e) => setMeasurements((m) => ({ ...m, neck: e.target.value }))}
              placeholder="38" step={0.1} min={10} max={100} disabled={disabled} error={errors.neck}
            />
            <Input
              id="chest" label="Chest" type="number" value={measurements.chest}
              onChange={(e) => setMeasurements((m) => ({ ...m, chest: e.target.value }))}
              placeholder="100" step={0.1} min={30} max={200} disabled={disabled} error={errors.chest}
            />
            <Input
              id="waist" label="Waist" type="number" value={measurements.waist}
              onChange={(e) => setMeasurements((m) => ({ ...m, waist: e.target.value }))}
              placeholder="80" step={0.1} min={30} max={200} disabled={disabled} error={errors.waist}
            />
            <Input
              id="hips" label="Hips" type="number" value={measurements.hips}
              onChange={(e) => setMeasurements((m) => ({ ...m, hips: e.target.value }))}
              placeholder="95" step={0.1} min={30} max={200} disabled={disabled} error={errors.hips}
            />
            <Input
              id="leftArm" label="Left Arm" type="number" value={measurements.leftArm}
              onChange={(e) => setMeasurements((m) => ({ ...m, leftArm: e.target.value }))}
              placeholder="35" step={0.1} min={10} max={100} disabled={disabled} error={errors.leftArm}
            />
            <Input
              id="rightArm" label="Right Arm" type="number" value={measurements.rightArm}
              onChange={(e) => setMeasurements((m) => ({ ...m, rightArm: e.target.value }))}
              placeholder="35" step={0.1} min={10} max={100} disabled={disabled} error={errors.rightArm}
            />
            <Input
              id="leftThigh" label="Left Thigh" type="number" value={measurements.leftThigh}
              onChange={(e) => setMeasurements((m) => ({ ...m, leftThigh: e.target.value }))}
              placeholder="55" step={0.1} min={15} max={120} disabled={disabled} error={errors.leftThigh}
            />
            <Input
              id="rightThigh" label="Right Thigh" type="number" value={measurements.rightThigh}
              onChange={(e) => setMeasurements((m) => ({ ...m, rightThigh: e.target.value }))}
              placeholder="55" step={0.1} min={15} max={120} disabled={disabled} error={errors.rightThigh}
            />
            <Input
              id="leftCalf" label="Left Calf" type="number" value={measurements.leftCalf}
              onChange={(e) => setMeasurements((m) => ({ ...m, leftCalf: e.target.value }))}
              placeholder="38" step={0.1} min={10} max={80} disabled={disabled} error={errors.leftCalf}
            />
            <Input
              id="rightCalf" label="Right Calf" type="number" value={measurements.rightCalf}
              onChange={(e) => setMeasurements((m) => ({ ...m, rightCalf: e.target.value }))}
              placeholder="38" step={0.1} min={10} max={80} disabled={disabled} error={errors.rightCalf}
            />
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════════════
            4. PROGRESS PHOTOS
        ═══════════════════════════════════════════════════════════════════════ */}
        <Section title="Progress Photos" description="Upload front, side, and back photos to track visual progress.">
          <div className="grid gap-4 sm:grid-cols-3">
            {(["Front", "Side", "Back"] as const).map((angle) => (
              <div key={angle} className="flex flex-col items-center gap-3">
                {/* Placeholder image */}
                <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8" aria-hidden="true">
                      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.97-4.969a.75.75 0 0 0-1.06 0L2.5 11.06Zm12.22-4.81a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">{angle} Photo</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-500">{angle}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Photo upload functionality will be available in a future update.
          </p>
        </Section>
      </form>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. HISTORY
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <p className="text-sm font-semibold text-zinc-900">
            Measurement History
            <span className="ml-2 text-xs font-normal text-zinc-400">
              ({history.length} {history.length === 1 ? "record" : "records"})
            </span>
          </p>
        </div>

        {history.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-zinc-400">No measurements recorded yet. Save your profile to create the first record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Weight</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Neck</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Chest</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Waist</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Hips</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">L. Arm</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">R. Arm</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">L. Thigh</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">R. Thigh</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">L. Calf</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">R. Calf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{record.date}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.weight ? `${record.weight} kg` : "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.neck || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.chest || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.waist || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.hips || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.leftArm || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{record.measurements.rightArm || "—"}</td>
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

      {/* Toast */}
      {toast && <Toast message={toast} onClose={dismissToast} />}
    </>
  );
}
