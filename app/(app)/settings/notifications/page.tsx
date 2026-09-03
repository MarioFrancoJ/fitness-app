"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

// ── Types ─────────────────────────────────────────────────────────────────────

type PrefsDict = ReturnType<typeof useDictionary>["dict"]["notifications"]["preferencesPage"];

type ReminderFrequency = "Daily" | "Weekly" | "Monthly" | "Never";

// Maps an enum frequency (logic key) to its localized display label.
function frequencyLabel(freq: ReminderFrequency, t: PrefsDict): string {
  switch (freq) {
    case "Daily":   return t.freqDaily;
    case "Weekly":  return t.freqWeekly;
    case "Monthly": return t.freqMonthly;
    case "Never":   return t.freqNever;
  }
}

interface NotificationPreferences {
  workoutReminders: boolean;
  nutritionReminders: boolean;
  progressReminders: boolean;
  achievementNotifications: boolean;
  recommendationNotifications: boolean;
  subscriptionNotifications: boolean;
  reminderFrequency: ReminderFrequency;
}

const FREQUENCIES: ReminderFrequency[] = ["Daily", "Weekly", "Monthly", "Never"];

// ── Toggle Component ──────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationPreferencesPage() {
  const { dict } = useDictionary();
  const t = dict.notifications.preferencesPage;
  const { success: showToast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // ── Load from Supabase ────────────────────────────────────────────────────

  useEffect(() => {
    async function loadPrefs() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("notification_preferences")
        .select("workout_reminders, nutrition_reminders, progress_reminders, achievement_notifications, recommendation_notifications, subscription_notifications, reminder_frequency")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setPrefs({
          workoutReminders: data.workout_reminders,
          nutritionReminders: data.nutrition_reminders,
          progressReminders: data.progress_reminders,
          achievementNotifications: data.achievement_notifications,
          recommendationNotifications: data.recommendation_notifications,
          subscriptionNotifications: data.subscription_notifications,
          reminderFrequency: data.reminder_frequency as ReminderFrequency,
        });
      } else {
        // No preferences yet — use defaults
        setPrefs({
          workoutReminders: true,
          nutritionReminders: true,
          progressReminders: true,
          achievementNotifications: true,
          recommendationNotifications: true,
          subscriptionNotifications: true,
          reminderFrequency: "Daily",
        });
      }

      setLoading(false);
    }

    loadPrefs();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggle(key: keyof Omit<NotificationPreferences, "reminderFrequency">) {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
  }

  function setFrequency(freq: ReminderFrequency) {
    if (!prefs) return;
    setPrefs({ ...prefs, reminderFrequency: freq });
  }

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          workout_reminders: prefs.workoutReminders,
          nutrition_reminders: prefs.nutritionReminders,
          progress_reminders: prefs.progressReminders,
          achievement_notifications: prefs.achievementNotifications,
          recommendation_notifications: prefs.recommendationNotifications,
          subscription_notifications: prefs.subscriptionNotifications,
          reminder_frequency: prefs.reminderFrequency,
        },
        { onConflict: "user_id" }
      );

    if (error) {
      showToast(t.toastError);
    } else {
      showToast(t.toastSaved);
    }

    setSaving(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageLoader text={t.loading} />
    );
  }

  if (!prefs) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
        </div>

        {/* Toggles */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t.typesHeading}</p>
          <div className="flex flex-col gap-3">
            <Toggle enabled={prefs.workoutReminders} onToggle={() => toggle("workoutReminders")} label={t.workoutRemindersLabel} description={t.workoutRemindersDesc} />
            <Toggle enabled={prefs.nutritionReminders} onToggle={() => toggle("nutritionReminders")} label={t.nutritionRemindersLabel} description={t.nutritionRemindersDesc} />
            <Toggle enabled={prefs.progressReminders} onToggle={() => toggle("progressReminders")} label={t.progressRemindersLabel} description={t.progressRemindersDesc} />
            <Toggle enabled={prefs.achievementNotifications} onToggle={() => toggle("achievementNotifications")} label={t.achievementLabel} description={t.achievementDesc} />
            <Toggle enabled={prefs.recommendationNotifications} onToggle={() => toggle("recommendationNotifications")} label={t.recommendationLabel} description={t.recommendationDesc} />
            <Toggle enabled={prefs.subscriptionNotifications} onToggle={() => toggle("subscriptionNotifications")} label={t.subscriptionLabel} description={t.subscriptionDesc} />
          </div>
        </div>

        {/* Frequency */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">{t.frequencyHeading}</p>
          <div className="flex gap-2">
            {FREQUENCIES.map((f) => (
              <button key={f} type="button" onClick={() => setFrequency(f)}
                className={["rounded-lg px-4 py-2 text-xs font-semibold transition-colors",
                  prefs.reminderFrequency === f ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
                ].join(" ")}>
                {frequencyLabel(f, t)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-400">{t.frequencyNote}</p>
        </div>

        {/* Future channels */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-zinc-700">{t.channelsHeading}</p>
          <p className="text-xs text-zinc-400 mb-4">{t.channelsNote}</p>
          <div className="flex flex-col gap-2">
            {[{ label: t.channelInApp, enabled: true }, { label: t.channelEmail, enabled: false }, { label: t.channelPush, enabled: false }, { label: t.channelSms, enabled: false }, { label: t.channelWhatsapp, enabled: false }].map((ch) => (
              <div key={ch.label} className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <span className="text-sm text-zinc-700">{ch.label}</span>
                {ch.enabled ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{t.channelActive}</span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-400">{t.channelComingSoon}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="button" onClick={handleSave} disabled={saving}
          className="w-fit rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:opacity-50">
          {saving ? dict.common.saving : t.savePreferences}
        </button>
      </div>
    </>
  );
}
