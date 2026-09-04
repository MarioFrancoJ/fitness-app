"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "./ProgressBar";
import StepCard from "./StepCard";
import StepButtons from "./StepButtons";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import PublicLanguageSwitcher from "@/components/i18n/PublicLanguageSwitcher";

type OnboardingDict = ReturnType<typeof useDictionary>["dict"]["auth"]["onboarding"];

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

function Step1({ t, onNext }: { t: OnboardingDict; onNext: () => void }) {
  const onboardingFeatures = [
    { icon: "🏋", label: t.featurePersonalizedWorkouts },
    { icon: "📏", label: t.featureBodyMeasurements },
    { icon: "🍽", label: t.featureNutritionPlan },
    { icon: "📅", label: t.featureTrainingSchedule },
  ];

  return (
    <StepCard
      title={t.step1Title}
      subtitle={t.step1Subtitle}
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
        {t.setupTime}
      </p>

      <StepButtons onNext={onNext} nextLabel={t.continue} />
    </StepCard>
  );
}


// ── Step 2 — Fitness Goal ─────────────────────────────────────────────────────

function Step2({
  t,
  profile,
  onProfileChange,
  onNext,
  onBack,
}: {
  t: OnboardingDict;
  profile: UserProfile;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");

  const goalOptions = [
    { icon: "🔥", label: t.goalLoseFat, value: "Lose Fat" },
    { icon: "💪", label: t.goalBuildMuscle, value: "Build Muscle" },
    { icon: "⚖️", label: t.goalMaintainWeight, value: "Maintain Weight" },
    { icon: "🏃", label: t.goalImprovePerformance, value: "Improve Performance" },
    { icon: "🤸", label: t.goalCalisthenics, value: "Calisthenics Skills" },
  ];

  function handleNext() {
    if (!profile.goal) {
      setError(t.step2Error);
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
      title={t.step2Title}
      subtitle={t.step2Subtitle}
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
                  ? "border-primary bg-primary text-white"
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

      <StepButtons onNext={handleNext} onBack={onBack} nextLabel={t.continue} backLabel={t.back} />
    </StepCard>
  );
}

// ── Step 3 — Body Info ─────────────────────────────────────────────────────────

type Gender = "Male" | "Female" | "Other";

interface Step3Errors { age?: string; gender?: string; height?: string; weight?: string }

function validateStep3(p: UserProfile, t: OnboardingDict): Step3Errors {
  const errors: Step3Errors = {};

  const age = parseInt(p.age, 10);
  if (!p.age.trim()) errors.age = t.errorAgeRequired;
  else if (isNaN(age) || age < 10 || age > 120) errors.age = t.errorAgeInvalid;

  if (!p.gender) errors.gender = t.errorGenderRequired;

  const height = parseFloat(p.height);
  if (!p.height.trim()) errors.height = t.errorHeightRequired;
  else if (isNaN(height) || height < 50 || height > 300) errors.height = t.errorHeightInvalid;

  const weight = parseFloat(p.weight);
  if (!p.weight.trim()) errors.weight = t.errorWeightRequired;
  else if (isNaN(weight) || weight < 20 || weight > 500) errors.weight = t.errorWeightInvalid;

  return errors;
}

function genderLabel(g: Gender, t: OnboardingDict): string {
  switch (g) {
    case "Male": return t.genderMale;
    case "Female": return t.genderFemale;
    case "Other": return t.genderOther;
    default: return g;
  }
}

function Step3({
  t, profile, onChange, onProfileChange, onNext, onBack,
}: {
  t: OnboardingDict;
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Step3Errors>({});

  function handleNext() {
    const errs = validateStep3(profile, t);
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
      title={t.step3Title}
      subtitle={t.step3Subtitle}
    >
      <div className="flex flex-col gap-5">
        {/* Age */}
        <Input id="age" type="number" label={t.fieldAge} placeholder={t.fieldAgePlaceholder}
          min={10} max={120} value={profile.age} onChange={handleChange} error={errors.age} />

        {/* Gender */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">{t.fieldGender}</span>
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
                    ? "border-primary bg-primary text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
                ].join(" ")}
              >
                {genderLabel(g, t)}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-xs text-red-500" role="alert">{errors.gender}</p>}
        </div>

        {/* Height */}
        <Input id="height" type="number" label={t.fieldHeight} placeholder={t.fieldHeightPlaceholder}
          min={50} max={300} step={0.1} value={profile.height} onChange={handleChange} error={errors.height} />

        {/* Weight */}
        <Input id="weight" type="number" label={t.fieldWeight} placeholder={t.fieldWeightPlaceholder}
          min={20} max={500} step={0.1} value={profile.weight} onChange={handleChange} error={errors.weight} />
      </div>

      <StepButtons onNext={handleNext} onBack={onBack} nextLabel={t.continue} backLabel={t.back} />
    </StepCard>
  );
}

// ── Step 4 — Activity Level ────────────────────────────────────────────────────

type ActivityLevel = "Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Athlete";

function Step4({
  t,
  profile,
  onProfileChange,
  onFinish,
  onBack,
}: {
  t: OnboardingDict;
  profile: UserProfile;
  onProfileChange: (field: keyof UserProfile, value: string | number | null) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");

  const activityOptions: { value: ActivityLevel; icon: string; label: string; description: string }[] = [
    { value: "Sedentary",         icon: "🪑", label: t.activitySedentary,         description: t.activitySedentaryDesc },
    { value: "Lightly Active",    icon: "🚶", label: t.activityLightlyActive,     description: t.activityLightlyActiveDesc },
    { value: "Moderately Active", icon: "🏃", label: t.activityModeratelyActive,  description: t.activityModeratelyActiveDesc },
    { value: "Very Active",       icon: "🏋", label: t.activityVeryActive,        description: t.activityVeryActiveDesc },
    { value: "Athlete",           icon: "⚡", label: t.activityAthlete,           description: t.activityAthleteDesc },
  ];

  function handleFinish() {
    if (!profile.activityLevel) {
      setError(t.step4Error);
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
      title={t.step4Title}
      subtitle={t.step4Subtitle}
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
                  ? "border-primary bg-primary text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50",
              ].join(" ")}
            >
              <span className="text-xl" aria-hidden="true">{option.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{option.label}</span>
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

      <StepButtons onNext={handleFinish} onBack={onBack} nextLabel={t.finishSetup} backLabel={t.back} />
    </StepCard>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function Wizard() {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.auth.onboarding;
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1">
          <ProgressBar
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            stepLabel={t.stepProgress
              .replace("{current}", String(step))
              .replace("{total}", String(TOTAL_STEPS))}
            progressLabel={t.progressLabel}
          />
        </div>
        <PublicLanguageSwitcher />
      </div>

      {step === 1 && <Step1 t={t} onNext={goNext} />}
      {step === 2 && (
        <Step2 t={t} profile={profile} onProfileChange={handleChange} onNext={goNext} onBack={goBack} />
      )}
      {step === 3 && (
        <Step3 t={t} profile={profile} onChange={handleStringChange} onProfileChange={handleChange} onNext={goNext} onBack={goBack} />
      )}
      {step === 4 && (
        <Step4 t={t} profile={profile} onProfileChange={handleChange} onFinish={handleFinish} onBack={goBack} />
      )}
    </div>
  );
}
