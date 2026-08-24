"use client";

import { useState, useEffect, useCallback } from "react";
import { loadPreferences, savePreferences, type NotificationPreferences, type ReminderFrequency } from "@/lib/notifications";

const FREQUENCIES: ReminderFrequency[] = ["Daily", "Weekly", "Monthly", "Never"];

function Toggle({ enabled, onToggle, label, description }: { enabled: boolean; onToggle: () => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-400">{description}</p>
      </div>
      <button type="button" onClick={onToggle} aria-label={`Toggle ${label}`}
        className={["relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          enabled ? "bg-zinc-900" : "bg-zinc-200",
        ].join(" ")}>
        <span className={["inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-0",
        ].join(" ")} />
      </button>
    </div>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    setPrefs(loadPreferences());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); }
  }, [toast, dismissToast]);

  function toggle(key: keyof Omit<NotificationPreferences, "reminderFrequency">) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    savePreferences(updated);
  }

  function setFrequency(freq: ReminderFrequency) {
    if (!prefs) return;
    const updated = { ...prefs, reminderFrequency: freq };
    setPrefs(updated);
    savePreferences(updated);
  }

  function handleSave() {
    if (!prefs) return;
    savePreferences(prefs);
    setToast("Preferences saved!");
  }

  if (!hydrated || !prefs) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Notification Preferences</h1>
          <p className="mt-1 text-sm text-zinc-500">Choose which notifications you want to receive.</p>
        </div>

        {/* Toggles */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Notification Types</p>
          <div className="flex flex-col gap-3">
            <Toggle enabled={prefs.workoutReminders} onToggle={() => toggle("workoutReminders")} label="Workout Reminders" description="Reminders about scheduled workouts and inactivity" />
            <Toggle enabled={prefs.nutritionReminders} onToggle={() => toggle("nutritionReminders")} label="Nutrition Reminders" description="Reminders to log meals and reach macro goals" />
            <Toggle enabled={prefs.progressReminders} onToggle={() => toggle("progressReminders")} label="Progress Reminders" description="Reminders to update weight and measurements" />
            <Toggle enabled={prefs.achievementNotifications} onToggle={() => toggle("achievementNotifications")} label="Achievement Notifications" description="Celebrate milestones and streaks" />
            <Toggle enabled={prefs.recommendationNotifications} onToggle={() => toggle("recommendationNotifications")} label="Recommendation Notifications" description="New personalized recommendations" />
            <Toggle enabled={prefs.subscriptionNotifications} onToggle={() => toggle("subscriptionNotifications")} label="Subscription Notifications" description="Trial ending, renewal, and billing alerts" />
          </div>
        </div>

        {/* Frequency */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Reminder Frequency</p>
          <div className="flex gap-2">
            {FREQUENCIES.map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)}
                className={["rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                  prefs.reminderFrequency === f ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
                ].join(" ")}>
                {f}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-400">Controls how often reminder notifications are generated.</p>
        </div>

        {/* Future channels */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-zinc-700">Delivery Channels</p>
          <p className="text-xs text-zinc-400 mb-4">Additional delivery methods will be available in future updates.</p>
          <div className="flex flex-col gap-2">
            {[{ label: "In-App", enabled: true }, { label: "Email", enabled: false }, { label: "Push Notifications", enabled: false }, { label: "SMS", enabled: false }, { label: "WhatsApp", enabled: false }].map((ch) => (
              <div key={ch.label} className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-700">{ch.label}</span>
                {ch.enabled ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400">Coming Soon</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={handleSave}
          className="w-fit rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
          Save Preferences
        </button>
      </div>

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
