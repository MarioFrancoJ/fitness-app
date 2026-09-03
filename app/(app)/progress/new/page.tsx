"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

export default function NewProgressPage() {
  const router = useRouter();
  const { dict } = useDictionary();
  const t = dict.progress.new;

  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [hips, setHips] = useState("");
  const [neck, setNeck] = useState("");
  const [leftArm, setLeftArm] = useState("");
  const [rightArm, setRightArm] = useState("");
  const [leftLeg, setLeftLeg] = useState("");
  const [rightLeg, setRightLeg] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const w = parseFloat(weight);
    if (!weight.trim() || isNaN(w)) { setError(t.errorWeightRequired); return; }
    if (w < 20 || w > 500) { setError(t.errorWeightRange); return; }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError(dict.common.errorNotAuthenticated); setIsSubmitting(false); return; }

      const today = new Date().toISOString().slice(0, 10);

      // Insert weight entry — check the returned error (Supabase does not throw)
      const { error: weightError } = await supabase
        .from("weight_entries")
        .insert({ user_id: user.id, date: today, weight_kg: w, notes: notes.trim() || null });

      if (weightError) {
        console.error("Failed to save weight entry:", weightError);
        setError(t.errorSaveWeight.replace("{msg}", String(weightError.message)));
        setIsSubmitting(false);
        return;
      }

      // Insert measurement entry (if any measurement provided)
      const hasMeasurements = waist || chest || hips || neck || leftArm || rightArm || leftLeg || rightLeg;
      if (hasMeasurements) {
        const { error: measurementError } = await supabase
          .from("measurement_entries")
          .insert({
            user_id: user.id,
            date: today,
            weight_kg: w,
            neck_cm: parseFloat(neck) || null,
            chest_cm: parseFloat(chest) || null,
            waist_cm: parseFloat(waist) || null,
            hips_cm: parseFloat(hips) || null,
            left_arm_cm: parseFloat(leftArm) || null,
            right_arm_cm: parseFloat(rightArm) || null,
            left_thigh_cm: parseFloat(leftLeg) || null,
            right_thigh_cm: parseFloat(rightLeg) || null,
          });

        if (measurementError) {
          console.error("Failed to save measurement entry:", measurementError);
          setError(t.errorSaveMeasurements.replace("{msg}", String(measurementError.message)));
          setIsSubmitting(false);
          return;
        }
      }

      router.push("/progress");
    } catch (err) {
      console.error("Unexpected error saving measurement:", err);
      setError(dict.common.errorSaveGeneric);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/progress" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">{t.backToProgress}</Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        {error && (<div className="rounded-lg bg-red-50 px-4 py-3" role="alert"><p className="text-sm font-medium text-red-700">{error}</p></div>)}

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t.weight}</p>
          <div className="w-48">
            <Input id="weight" type="number" label={t.weightKg} placeholder={t.weightPlaceholder} step={0.1} min={20} max={500} value={weight} onChange={(e) => { setWeight(e.target.value); if (error) setError(""); }} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t.bodyMeasurementsCm}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input id="waist" type="number" label={t.waist} placeholder="80" step={0.1} value={waist} onChange={(e) => setWaist(e.target.value)} />
            <Input id="chest" type="number" label={t.chest} placeholder="100" step={0.1} value={chest} onChange={(e) => setChest(e.target.value)} />
            <Input id="hips" type="number" label={t.hips} placeholder="95" step={0.1} value={hips} onChange={(e) => setHips(e.target.value)} />
            <Input id="neck" type="number" label={t.neck} placeholder="38" step={0.1} value={neck} onChange={(e) => setNeck(e.target.value)} />
            <Input id="leftArm" type="number" label={t.leftArm} placeholder="35" step={0.1} value={leftArm} onChange={(e) => setLeftArm(e.target.value)} />
            <Input id="rightArm" type="number" label={t.rightArm} placeholder="35" step={0.1} value={rightArm} onChange={(e) => setRightArm(e.target.value)} />
            <Input id="leftLeg" type="number" label={t.leftLeg} placeholder="55" step={0.1} value={leftLeg} onChange={(e) => setLeftLeg(e.target.value)} />
            <Input id="rightLeg" type="number" label={t.rightLeg} placeholder="55" step={0.1} value={rightLeg} onChange={(e) => setRightLeg(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t.additional}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="bodyFat" type="number" label={t.bodyFatPct} placeholder={t.bodyFatPlaceholder} step={0.1} min={1} max={60} value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-sm font-medium text-zinc-700">{t.notes}</label>
              <textarea id="notes" rows={3} placeholder={t.notesPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? dict.common.saving : t.save}</Button>
          <Link href="/progress" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">{dict.common.cancel}</Link>
        </div>
      </form>
    </div>
  );
}
