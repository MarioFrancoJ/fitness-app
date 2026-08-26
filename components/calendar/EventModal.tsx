"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  color: string | null;
}

export interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  all_day: boolean;
  color: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  event?: CalendarEvent | null;
  mode: "create" | "edit";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "custom", label: "Custom", icon: "📌" },
  { value: "workout", label: "Workout", icon: "💪" },
  { value: "meal", label: "Meal", icon: "🍽️" },
  { value: "measurement", label: "Measurement", icon: "📏" },
  { value: "goal", label: "Goal", icon: "🎯" },
];

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateInput(isoString: string | null): string {
  if (!isoString) return new Date().toISOString().split("T")[0];
  return isoString.split("T")[0];
}

function toTimeInput(isoString: string | null): string {
  if (!isoString) return "09:00";
  const date = new Date(isoString);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EventModal({ isOpen, onClose, onSave, onDelete, event, mode }: EventModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState<EventFormData>({
    title: "",
    description: "",
    event_type: "custom",
    start_date: new Date().toISOString().split("T")[0],
    start_time: "09:00",
    end_date: new Date().toISOString().split("T")[0],
    end_time: "10:00",
    all_day: false,
    color: "#3b82f6",
  });

  // Populate form when editing
  useEffect(() => {
    if (event && mode === "edit") {
      setForm({
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        start_date: toDateInput(event.start_date),
        start_time: toTimeInput(event.start_date),
        end_date: toDateInput(event.end_date),
        end_time: toTimeInput(event.end_date),
        all_day: event.all_day,
        color: event.color || "#3b82f6",
      });
    } else if (mode === "create") {
      setForm({
        title: "",
        description: "",
        event_type: "custom",
        start_date: new Date().toISOString().split("T")[0],
        start_time: "09:00",
        end_date: new Date().toISOString().split("T")[0],
        end_time: "10:00",
        all_day: false,
        color: "#3b82f6",
      });
    }
    setConfirmDelete(false);
  }, [event, mode, isOpen]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">
            {mode === "create" ? "New Event" : "Edit Event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-title" className="text-sm font-medium text-zinc-700">Title *</label>
            <input
              id="event-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Leg Day, Meal Prep Sunday"
              required
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="event-desc" className="text-sm font-medium text-zinc-700">Description</label>
            <textarea
              id="event-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional details..."
              rows={2}
              className="rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          {/* Event Type + Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-type" className="text-sm font-medium text-zinc-700">Type</label>
              <select
                id="event-type"
                value={form.event_type}
                onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
                className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Color</label>
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c.value }))}
                    aria-label={c.label}
                    className={[
                      "h-7 w-7 rounded-full transition-transform",
                      form.color === c.value ? "scale-125 ring-2 ring-offset-2 ring-zinc-400" : "hover:scale-110",
                    ].join(" ")}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* All day toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.all_day}
              onChange={(e) => setForm((p) => ({ ...p, all_day: e.target.checked }))}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <span className="text-sm text-zinc-700">All day event</span>
          </label>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="start-date" className="text-sm font-medium text-zinc-700">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                required
                className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {!form.all_day && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="start-time" className="text-sm font-medium text-zinc-700">Start Time</label>
                <input
                  id="start-time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="end-date" className="text-sm font-medium text-zinc-700">End Date</label>
              <input
                id="end-date"
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>

            {!form.all_day && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="end-time" className="text-sm font-medium text-zinc-700">End Time</label>
                <input
                  id="end-time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-between">
            <div>
              {mode === "edit" && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className={[
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    confirmDelete
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "text-red-600 hover:bg-red-50",
                  ].join(" ")}
                >
                  {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
