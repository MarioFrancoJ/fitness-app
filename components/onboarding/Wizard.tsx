"use client";

import { useState } from "react";
import ProgressBar from "./ProgressBar";
import StepCard from "./StepCard";
import StepButtons from "./StepButtons";
import Input from "@/components/ui/Input";

// ── Shared profile state ──────────────────────────────────────────────────────

export interface UserProfile {
  // Step 3
  age: string;
  height: string;  // cm
  weight: string;  // kg
  // Step 4
  experienceLevel: "Beginner" | "Intermediate" | "Advanced" | "";
  trainingDays: number | null;
  trainingLocation: "Gym" | "Home" | "Calisthenics" | "";
}

const INITIAL_PROFILE: UserProfile = {
  age: "",
  height: "",
  weight: "",
  experienceLevel: "",
  trainingDays: null,
  trainingLocation: "",
};

const TOTAL_STEPS = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

function mergeToLocalStorage(partial: Record<string, unknown>) {
  try {
    const stored = localStorage.getItem("fitnessapp_user");
    const existing = stored ? JSON.parse(stored) : {};
    localStorage.setItem("fitnessapp_user", JSON.stringify({ ...existing, ...partial }));
  } catch {
    // localStorage unavailable — continue
  }
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <StepCard
      title="Welcome! 👋"
      subtitle="Let's personalize your fitness journey. This will only take a couple of minutes."
    >
      <div className="mb-6 flex h-32 items-center justify-center rounded-xl bg-zinc-50">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12" aria-hidden="true">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
            <path d="M16 28c1.5-3 4-5 8-5s6.5 2 8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="20" r="2" fill="currentColor" />
            <circle cx="30" cy="20" r="2" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium">Ready to get started</span>
        </div>
      </div>
      <StepButtons onNext={onNext} nextLabel="Continue" />
    </StepCard>
  );
}

// ── Step 2 (placeholder) ──────────────────────────────────────────────────────

function Step2Placeholder({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <StepCard title="Step 2" subtitle="Coming soon — this step hasn't been built yet.">
      <StepButtons onNext={onNext} onBack={onBack} nextLabel="Continue" />
    </StepCard>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────

interface Step3Errors { age?: string; height?: string; weight?: string }

function validateStep3(p: UserProfile): Step3Errors {
  const errors: Step3Errors = {};
  const age = parseInt(p.age, 10);
  if (!p.age.trim()) errors.age = "Age is required.";
  else if (isNaN(age) || age < 10 || age > 120) errors.age = "Enter a valid age between 10 and 120.";

  const height = parseFloat(p.height);
  if (!p.height.trim()) errors.height = "Height is required.";
  else if (isNaN(height) || height < 50 || height > 300) errors.height = "Enter a valid height between 50 and 300 cm.";

  const weight = parseFloat(p.weight);
  if (!p.weight.trim()) errors.weight = "Weight is required.";
  else if (isNaN(weight) || weight < 20 || weight > 500) errors.weight = "Enter a valid weight between 20 and 500 kg.";

  return errors;
}

function Step3({
  profile, onChange, onNext, onBack,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Step3Errors>({});

  function handleNext() {
    const errs = validateStep3(profile);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    mergeToLocalStorage({
      age: parseInt(profile.age, 10),
      height: parseFloat(profile.height),
      weight: parseFloat(profile.weight),
    });
    onNext();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target;
    onChange(id as keyof UserProfile, value);
    if (errors[id as keyof Step3Errors]) setErrors((p) => ({ ...p, [id]: undefined }));
  }

  return (
    <StepCard title="Your body metrics" subtitle="We'll use this to calculate your personalised targets.">
      <div className="flex flex-col gap-5">
        <Input id="age" type="number" label="Age" placeholder="e.g. 28"
          min={10} max={120} value={profile.age} onChange={handleChange} error={errors.age} />
        <Input id="height" type="number" label="Height (cm)" placeholder="e.g. 175"
          min={50} max={300} step={0.1} value={profile.height} onChange={handleChange} error={errors.height} />
        <Input id="weight" type="number" label="Weight (kg)" placeholder="e.g. 72"
          min={20} max={500} step={0.1} value={profile.weight} onChange={handleChange} error={errors.weight} />
      </div>
      <StepButtons onNext={handleNext} onBack={onBack} nextLabel="Continue" />
    </StepCard>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────────

type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";
type TrainingLocation = "Gym" | "Home" | "Calisthenics";

interface Step4Errors {
  experienceLevel?: string;
  trainingDays?: string;
  trainingLocation?: string;
}

function validateStep4(p: UserProfile): Step4Errors {
  const errors: Step4Errors = {};
  if (!p.experienceLevel) errors.experienceLevel = "Please select your experience level.";
  if (p.trainingDays === null) errors.trainingDays = "Please select your training days per week.";
  if (!p.trainingLocation) errors.trainingLocation = "Please select your training location.";
  return errors;
}

// Reusable pill-select row
function PillGroup<T extends string>({
  options, value, onChange, error,
}: {
  options: T[];
  value: T | "";
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            className={[
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
              value === opt
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
            ].join(" ")}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
}

// Day-count selector (1–7)
function DaySelector({ value, onChange, error }: {
  value: number | null;
  onChange: (n: number) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={[
              "h-9 w-9 rounded-lg border text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
              value === n
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
}

function Step4({
  profile, onProfileChange, onNext, onBack,
}: {
  profile: UserProfile;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Step4Errors>({});

  function handleNext() {
    const errs = validateStep4(profile);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    mergeToLocalStorage({
      experienceLevel: profile.experienceLevel,
      trainingDays: profile.trainingDays,
      trainingLocation: profile.trainingLocation,
    });
    onNext();
  }

  return (
    <StepCard title="Training preferences" subtitle="Tell us how you like to train.">
      <div className="flex flex-col gap-6">
        {/* Experience level */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Experience Level</span>
          <PillGroup<ExperienceLevel>
            options={["Beginner", "Intermediate", "Advanced"]}
            value={profile.experienceLevel}
            onChange={(v) => {
              onProfileChange("experienceLevel", v);
              setErrors((p) => ({ ...p, experienceLevel: undefined }));
            }}
            error={errors.experienceLevel}
          />
        </div>

        {/* Training days */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Training Days per Week</span>
          <DaySelector
            value={profile.trainingDays}
            onChange={(n) => {
              onProfileChange("trainingDays", n);
              setErrors((p) => ({ ...p, trainingDays: undefined }));
            }}
            error={errors.trainingDays}
          />
        </div>

        {/* Training location */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Training Location</span>
          <PillGroup<TrainingLocation>
            options={["Gym", "Home", "Calisthenics"]}
            value={profile.trainingLocation}
            onChange={(v) => {
              onProfileChange("trainingLocation", v);
              setErrors((p) => ({ ...p, trainingLocation: undefined }));
            }}
            error={errors.trainingLocation}
          />
        </div>
      </div>

      <StepButtons onNext={handleNext} onBack={onBack} nextLabel="Continue" />
    </StepCard>
  );
}

// ── Step 5 placeholder ────────────────────────────────────────────────────────

function Step5Placeholder({ onBack }: { onBack: () => void }) {
  return (
    <StepCard title="Step 5" subtitle="Coming soon — this step hasn't been built yet.">
      <StepButtons onBack={onBack} />
    </StepCard>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);

  function goNext() { setStep((s) => s + 1); }
  function goBack() { setStep((s) => Math.max(s - 1, 1)); }

  function handleChange(field: keyof UserProfile, value: string | number | null) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  // Adapter so Step 3's string-only onChange stays compatible
  function handleStringChange(field: keyof UserProfile, value: string) {
    handleChange(field, value);
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {step === 1 && <Step1 onNext={goNext} />}
      {step === 2 && <Step2Placeholder onNext={goNext} onBack={goBack} />}
      {step === 3 && (
        <Step3 profile={profile} onChange={handleStringChange} onNext={goNext} onBack={goBack} />
      )}
      {step === 4 && (
        <Step4 profile={profile} onProfileChange={handleChange} onNext={goNext} onBack={goBack} />
      )}
      {step === 5 && <Step5Placeholder onBack={goBack} />}
    </div>
  );
}
