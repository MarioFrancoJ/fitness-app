"use client";

import { useState, type FormEvent } from "react";

type FeedbackType = "Bug Report" | "Feature Request" | "General Feedback";

interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  priority: string;
  submittedAt: string;
}

const FEEDBACK_KEY = "fitnessapp_feedback";
const TYPES: FeedbackType[] = ["Bug Report", "Feature Request", "General Feedback"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

function saveFeedback(entry: FeedbackEntry) {
  try {
    const all = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
    all.unshift(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
  } catch {}
}

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("General Feedback");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    saveFeedback({ id: crypto.randomUUID(), type, title: title.trim(), description: description.trim(), priority, submittedAt: new Date().toISOString() });
    setSubmitted(true);
  }

  function handleReset() {
    setTitle(""); setDescription(""); setType("General Feedback"); setPriority("Medium"); setSubmitted(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Feedback</h1>
        <p className="mt-1 text-sm text-zinc-500">Help us improve by reporting bugs, requesting features, or sharing your thoughts.</p>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-emerald-600" aria-hidden="true">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="mb-1 text-base font-semibold text-emerald-900">Thank you!</p>
          <p className="mb-6 text-sm text-emerald-700">Your feedback has been submitted and will be reviewed by our team.</p>
          <button type="button" onClick={handleReset} className="rounded-lg border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Feedback Type</label>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={["rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                      type === t ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
                    ].join(" ")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-title" className="text-sm font-medium text-zinc-700">Title *</label>
              <input id="fb-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder={type === "Bug Report" ? "Describe the bug briefly" : type === "Feature Request" ? "What feature would you like?" : "What's on your mind?"}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fb-desc" className="text-sm font-medium text-zinc-700">Description</label>
              <textarea id="fb-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                placeholder="Provide more details..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>

            {/* Priority (for bugs) */}
            {type === "Bug Report" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fb-priority" className="text-sm font-medium text-zinc-700">Severity</label>
                <select id="fb-priority" value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2">
              Submit Feedback
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
