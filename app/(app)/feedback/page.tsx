"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

type FeedbackDict = ReturnType<typeof useDictionary>["dict"]["feedback"];

type FeedbackType = "Bug Report" | "Feature Request" | "General Feedback";

const TYPES: FeedbackType[] = ["Bug Report", "Feature Request", "General Feedback"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

// Localized display label for a feedback-type value (value stays the logic key).
function typeLabel(value: FeedbackType, t: FeedbackDict): string {
  switch (value) {
    case "Bug Report":      return t.typeBugReport;
    case "Feature Request": return t.typeFeatureRequest;
    case "General Feedback": return t.typeGeneralFeedback;
  }
}

// Localized display label for a priority/severity value (value stays the logic key).
function priorityLabel(value: string, t: FeedbackDict): string {
  switch (value) {
    case "Low":      return t.priorityLow;
    case "Medium":   return t.priorityMedium;
    case "High":     return t.priorityHigh;
    case "Critical": return t.priorityCritical;
    default:         return value;
  }
}

export default function FeedbackPage() {
  const { dict } = useDictionary();
  const t = dict.feedback;
  const [type, setType] = useState<FeedbackType>("General Feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("feedback").insert({
        user_id: user?.id || null,
        type,
        title: title.trim(),
        description: description.trim() || null,
        priority: type === "Bug Report" ? (priority as "Low" | "Medium" | "High" | "Critical") : null,
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
    setSaving(false);
  }

  function handleReset() {
    setTitle(""); setDescription(""); setType("General Feedback"); setPriority("Medium"); setSubmitted(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-brand bg-success-light py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-light">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-success" aria-hidden="true">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="mb-1 text-base font-semibold text-success">{t.submittedThankYou}</p>
          <p className="mb-6 text-sm text-success">{t.submittedDesc}</p>
          <button type="button" onClick={handleReset} className="rounded-lg border border-border-brand px-5 py-2 text-sm font-semibold text-success hover:bg-success-light">
            {t.submitAnother}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">{t.fieldFeedbackType}</label>
              <div className="flex gap-2">
                {TYPES.map((ft) => (
                  <button key={ft} type="button" onClick={() => setType(ft)}
                    className={["rounded-lg px-4 py-2 text-xs font-semibold transition-colors", type === ft ? "bg-primary text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"].join(" ")}>
                    {typeLabel(ft, t)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-title" className="text-sm font-medium text-zinc-700">{t.fieldTitle}</label>
              <input id="fb-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder={type === "Bug Report" ? t.titlePlaceholderBug : type === "Feature Request" ? t.titlePlaceholderFeature : t.titlePlaceholderGeneral}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-desc" className="text-sm font-medium text-zinc-700">{t.fieldDescription}</label>
              <textarea id="fb-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={t.fieldDescriptionPlaceholder}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>

            {type === "Bug Report" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fb-priority" className="text-sm font-medium text-zinc-700">{t.fieldSeverity}</label>
                <select id="fb-priority" value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel(p, t)}</option>)}
                </select>
              </div>
            )}

            <button type="submit" disabled={saving} className="mt-2 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              {saving ? t.submitting : t.submitButton}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
