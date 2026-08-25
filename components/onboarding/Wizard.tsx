"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import StepCard from "./StepCard";
import StepButtons from "./StepButtons";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

// ── Shared profile state ──────────────────────────────────────────────────────

export interface UserProfile {
  // Step 2
  goal: string;
  // Step 3
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  height: string;  // cm
  weight: string;  // kg
  // Step 4
  activityLevel: "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Athlete" | "";
}

const INITIAL_PROFILE: UserProfile = {
  goal: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  activityLevel: "",
};

const TOTAL_STEPS = 4;

// ── Save profile to Supabase ──────────────────────────────────────────────────

async function saveProfileToSupabase(profile: UserProfile) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const dateOfBirth = profile.age
    ? new Date(new Date().getFullYear() - parseInt(profile.age, 10), 0, 1).toISOString().split("T")[0]
    : null;

  await supabase
    .from("users")
    .update({
      fitness_goal: profile.goal || null,
      gender: profile.gender || null,
      height_cm: profile.height ? parseFloat(profile.height) : null,
      weight_kg: profile.weight ? parseFloat(profile.weight) : null,
      activity_level: profile.activityLevel || null,
      date_of_birth: dateOfBirth,
    })
    .eq("id", user.id);
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

const onboardingFeatures = [
  { icon: "🏋", label: "Personalized Workouts" },
  { icon: "📏", label: "Body Measurements" },
  { icon: "🍽", label: "Nutrition Plan" },
  { icon: "📅", label: "Training Schedule" },
];

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <StepCard
      title="Your Fitness Journey Starts Now"
      subtitle="We'll build a personalized fitness plan based on your goals, body measurements, nutrition preferences and training schedule."
    >
      {/* Feature cards */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {onboardingFeatures.map((feature) => (
          <div
            key={feature.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
          >
            <span className="text-xl" aria-hidden="true">{feature.icon}</span>
            <span className="text-sm font-medium text-zinc-700">{feature.label}</span>
          </div>
        ))}
      </div>

      {/* Setup time */}
      <p className="mb-6 flex items-center gap-2 text-xs text-zinc-400">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8.5-3a.75.75 0 0 0-1.5 0v3c0 .414.336.75.75.75H10a.75.75 0 0 0 0-1.5H8.5V5Z" clipRule="evenodd" />
        </svg>
        Estimated setup time: Less than 2 minutes
      </p>

      <StepButtons onNext={onNext} nextLabel="Continue" />
    </StepCard>
  );
}


// ── Step 2 — Fitness Goal ─────────────────────────────────────────────────────

const goalOptions = [
  { icon: "🔥", label: "Lose Fat", value: "Lose Fat" },
  { icon: "💪", label: "Build Muscle", value: "Build Muscle" },
  { icon: "⚖️", label: "Maintain Weight", value: "Maintain Weight" },
  { icon: "🏃", label: "Improve Performance", value: "Improve Performance" },
  { icon: "🤸", label: "Calisthenics Skills", value: "Calisthenics Skills" },
];

function Step2({
  profile,
  onProfileChange,
  onNext,
  onBack,
}: {
  profile: UserProfile;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");

  function handleNext() {
    if (!profile.goal) {
      setError("Please select a fitness goal.");
      return;
    }
    setError("");
    onNext();
  }

  function handleSelect(value: string) {
    onProfileChange("goal", value);
    if (error) setError("");
  }

  return (
    <StepCard
      title="What is your primary fitness goal?"
      subtitle="We'll use your goal to personalize your workouts, nutrition and recommendations."
    >
      <div className="mb-6 flex flex-col gap-2.5">
        {goalOptions.map((option) => {
          const selected = profile.goal === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              aria-pressed={selected}
              className={[
                "flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50",
              ].join(" ")}
            >
              <span className="text-xl" aria-hidden="true">{option.icon}</span>
              <span className="text-sm font-semibold">{option.label}</span>
              {selected && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-5 w-5" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 text-xs text-red-500" role="alert">{error}</p>
      )}

      <StepButtons onNext={handleNext} onBack={onBack} nextLabel="Continue" />
    </StepCard>
  );
}

// ── Step 3 — Body Info ─────────────────────────────────────────────────────────

type Gender = "Male" | "Female" | "Other";

interface Step3Errors { age?: string; gender?: string; height?: string; weight?: string }

function validateStep3(p: UserProfile): Step3Errors {
  const errors: Step3Errors = {};

  const age = parseInt(p.age, 10);
  if (!p.age.trim()) errors.age = "Age is required.";
  else if (isNaN(age) || age < 10 || age > 120) errors.age = "Enter a valid age between 10 and 120.";

  if (!p.gender) errors.gender = "Please select your gender.";

  const height = parseFloat(p.height);
  if (!p.height.trim()) errors.height = "Height is required.";
  else if (isNaN(height) || height < 50 || height > 300) errors.height = "Enter a valid height between 50 and 300 cm.";

  const weight = parseFloat(p.weight);
  if (!p.weight.trim()) errors.weight = "Weight is required.";
  else if (isNaN(weight) || weight < 20 || weight > 500) errors.weight = "Enter a valid weight between 20 and 500 kg.";

  return errors;
}

function Step3({
  profile, onChange, onProfileChange, onNext, onBack,
}: {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Step3Errors>({});

  function handleNext() {
    const errs = validateStep3(profile);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onNext();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, value } = e.target;
    onChange(id as keyof UserProfile, value);
    if (errors[id as keyof Step3Errors]) setErrors((p) => ({ ...p, [id]: undefined }));
  }

  function handleGender(value: Gender) {
    onProfileChange("gender", value);
    if (errors.gender) setErrors((p) => ({ ...p, gender: undefined }));
  }

  return (
    <StepCard
      title="Tell us about your body"
      subtitle="We'll use this information to estimate your calories and macros."
    >
      <div className="flex flex-col gap-5">
        {/* Age */}
        <Input id="age" type="number" label="Age" placeholder="e.g. 28"
          min={10} max={120} value={profile.age} onChange={handleChange} error={errors.age} />

        {/* Gender */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Gender</span>
          <div className="flex gap-2">
            {(["Male", "Female", "Other"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleGender(g)}
                aria-pressed={profile.gender === g}
                className={[
                  "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                  profile.gender === g
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
                ].join(" ")}
              >
                {g}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-xs text-red-500" role="alert">{errors.gender}</p>}
        </div>

        {/* Height */}
        <Input id="height" type="number" label="Height (cm)" placeholder="e.g. 175"
          min={50} max={300} step={0.1} value={profile.height} onChange={handleChange} error={errors.height} />

        {/* Weight */}
        <Input id="weight" type="number" label="Weight (kg)" placeholder="e.g. 72"
          min={20} max={500} step={0.1} value={profile.weight} onChange={handleChange} error={errors.weight} />
      </div>

      <StepButtons onNext={handleNext} onBack={onBack} nextLabel="Continue" />
    </StepCard>
  );
}

// ── Step 4 — Activity Level ────────────────────────────────────────────────────

type ActivityLevel = "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Athlete";

const activityOptions: { value: ActivityLevel; icon: string; description: string }[] = [
  { value: "Sedentary",         icon: "🪑", description: "Little or no exercise" },
  { value: "Lightly Active",    icon: "🚶", description: "Light exercise 1–3 days/week" },
  { value: "Moderately Active", icon: "🏃", description: "Moderate exercise 3–5 days/week" },
  { value: "Very Active",       icon: "🏋", description: "Hard exercise 6–7 days/week" },
  { value: "Athlete",           icon: "⚡", description: "Professional or twice-daily training" },
];

function Step4({
  profile,
  onProfileChange,
  onFinish,
  onBack,
}: {
  profile: UserProfile;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");

  function handleFinish() {
    if (!profile.activityLevel) {
      setError("Please select your activity level.");
      return;
    }
    setError("");
    saveProfileToSupabase(profile);
    onFinish();
  }

  function handleSelect(value: ActivityLevel) {
    onProfileChange("activityLevel", value);
    if (error) setError("");
  }

  return (
    <StepCard
      title="How active are you?"
      subtitle="This helps us estimate your daily calorie needs."
    >
      <div className="mb-6 flex flex-col gap-2.5">
        {activityOptions.map((option) => {
          const selected = profile.activityLevel === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              aria-pressed={selected}
              className={[
                "flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300",
                selected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50",
              ].join(" ")}
            >
              <span className="text-xl" aria-hidden="true">{option.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{option.value}</span>
                <span className={`text-xs ${selected ? "text-zinc-300" : "text-zinc-400"}`}>
                  {option.description}
                </span>
              </div>
              {selected && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="ml-auto h-5 w-5 shrink-0" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 text-xs text-red-500" role="alert">{error}</p>
      )}

      <StepButtons onNext={handleFinish} onBack={onBack} nextLabel="Finish Setup" />
    </StepCard>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);

  function goNext() { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); }
  function goBack() { setStep((s) => Math.max(s - 1, 1)); }

  function handleChange(field: keyof UserProfile, value: string | number | null) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleStringChange(field: keyof UserProfile, value: string) {
    handleChange(field, value);
  }

  function handleFinish() {
    router.push("/dashboard");
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {step === 1 && <Step1 onNext={goNext} />}
      {step === 2 && (
        <Step2 profile={profile} onProfileChange={handleChange} onNext={goNext} onBack={goBack} />
      )}
      {step === 3 && (
        <Step3 profile={profile} onChange={handleStringChange} onProfileChange={handleChange} onNext={goNext} onBack={goBack} />
      )}
      {step === 4 && (
        <Step4 profile={profile} onProfileChange={handleChange} onFinish={handleFinish} onBack={goBack} />
      )}
    </div>
  );
}
