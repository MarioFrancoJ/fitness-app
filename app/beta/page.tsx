"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import PublicLanguageSwitcher from "@/components/i18n/PublicLanguageSwitcher";

type BetaDict = ReturnType<typeof useDictionary>["dict"]["auth"]["beta"];

const GOALS = ["Lose Fat", "Build Muscle", "Maintain Weight", "Improve Performance", "General Fitness"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Athlete"];

// Display label for a goal value (value stays the logic/DB key).
function goalLabel(goal: string, t: BetaDict): string {
  switch (goal) {
    case "Lose Fat": return t.goalLoseFat;
    case "Build Muscle": return t.goalBuildMuscle;
    case "Maintain Weight": return t.goalMaintainWeight;
    case "Improve Performance": return t.goalImprovePerformance;
    case "General Fitness": return t.goalGeneralFitness;
    default: return goal;
  }
}

// Display label for an experience-level value (value stays the logic/DB key).
function levelLabel(level: string, t: BetaDict): string {
  switch (level) {
    case "Beginner": return t.levelBeginner;
    case "Intermediate": return t.levelIntermediate;
    case "Advanced": return t.levelAdvanced;
    case "Athlete": return t.levelAthlete;
    default: return level;
  }
}

export default function BetaPage() {
  const { dict } = useDictionary();
  const t = dict.auth.beta;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("General Fitness");
  const [level, setLevel] = useState("Beginner");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(247);

  useEffect(() => {
    async function loadCount() {
      const supabase = createClient();
      const { count } = await supabase.from("beta_registrations").select("id", { count: "exact", head: true });
      setWaitlistCount((count || 0) + 247);
    }
    loadCount();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("beta_registrations").insert({
        name: name.trim(),
        email: email.trim(),
        fitness_goal: goal,
        experience_level: level,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to register:", err);
    }
    setSaving(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="absolute right-4 top-4">
        <PublicLanguageSwitcher />
      </div>
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block rounded-full bg-zinc-900 px-4 py-1 text-xs font-bold text-white">{t.badge}</span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-zinc-500">{t.waitlistCount.split("{n}")[0]}<strong className="text-zinc-900">{waitlistCount}</strong>{t.waitlistCount.split("{n}")[1]}</p>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mb-4 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-emerald-600" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <h2 className="text-lg font-bold text-emerald-900">{t.submittedTitle}</h2>
            <p className="mt-2 text-sm text-emerald-700">{t.submittedDesc}</p>
            <Link href="/" className="mt-6 inline-block rounded-lg border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">{t.backToHome}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5"><label htmlFor="beta-name" className="text-sm font-medium text-zinc-700">{t.fieldFullName}</label><input id="beta-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.fieldFullNamePlaceholder} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="beta-email" className="text-sm font-medium text-zinc-700">{t.fieldEmail}</label><input id="beta-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t.fieldEmailPlaceholder} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="beta-goal" className="text-sm font-medium text-zinc-700">{t.fieldFitnessGoal}</label><select id="beta-goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{GOALS.map((g) => <option key={g} value={g}>{goalLabel(g, t)}</option>)}</select></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="beta-level" className="text-sm font-medium text-zinc-700">{t.fieldExperienceLevel}</label><select id="beta-level" value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{LEVELS.map((l) => <option key={l} value={l}>{levelLabel(l, t)}</option>)}</select></div>
              <button type="submit" disabled={saving} className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2">
                {saving ? t.registering : t.submitButton}
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-zinc-400">{t.consentNote}</p>
          </form>
        )}
      </div>
    </div>
  );
}
