"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import EventModal, { type CalendarEvent, type EventFormData } from "@/components/calendar/EventModal";
import PageLoader from "@/components/ui/PageLoader";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getMonthStartPadding(year: number, month: number): number {
  const firstDay = new Date(year, month, 1).getDay();
  return firstDay === 0 ? 6 : firstDay - 1; // Monday = 0
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function buildTimestamp(date: string, time: string, allDay: boolean): string {
  if (allDay) return `${date}T00:00:00`;
  return `${date}T${time}:00`;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TYPE_ICONS: Record<string, string> = {
  custom: "📌",
  workout: "💪",
  meal: "🍽️",
  measurement: "📏",
  goal: "🎯",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Load Events ───────────────────────────────────────────────────────────

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, title, description, event_type, start_date, end_date, all_day, color")
      .order("start_date", { ascending: true });

    if (!error && data) {
      setEvents(data as CalendarEvent[]);
    }
    setLoading(false);
  }

  // ── CRUD Operations ───────────────────────────────────────────────────────

  async function handleCreateEvent(formData: EventFormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = buildTimestamp(formData.start_date, formData.start_time, formData.all_day);
    const endDate = formData.end_date
      ? buildTimestamp(formData.end_date, formData.end_time, formData.all_day)
      : null;

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_type: formData.event_type,
        start_date: startDate,
        end_date: endDate,
        all_day: formData.all_day,
        color: formData.color,
      })
      .select("id, title, description, event_type, start_date, end_date, all_day, color")
      .single();

    if (error) {
      showToast("Error creating event: " + error.message, "error");
      return;
    }

    if (data) {
      setEvents((prev) => [...prev, data as CalendarEvent].sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ));
      showToast("Event created successfully", "success");
    }
  }

  async function handleUpdateEvent(formData: EventFormData) {
    if (!editingEvent) return;
    const supabase = createClient();

    const startDate = buildTimestamp(formData.start_date, formData.start_time, formData.all_day);
    const endDate = formData.end_date
      ? buildTimestamp(formData.end_date, formData.end_time, formData.all_day)
      : null;

    const { data, error } = await supabase
      .from("calendar_events")
      .update({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        event_type: formData.event_type,
        start_date: startDate,
        end_date: endDate,
        all_day: formData.all_day,
        color: formData.color,
      })
      .eq("id", editingEvent.id)
      .select("id, title, description, event_type, start_date, end_date, all_day, color")
      .single();

    if (error) {
      showToast("Error updating event: " + error.message, "error");
      return;
    }

    if (data) {
      setEvents((prev) =>
        prev.map((e) => (e.id === data.id ? (data as CalendarEvent) : e))
          .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      );
      showToast("Event updated successfully", "success");
    }
  }

  async function handleDeleteEvent() {
    if (!editingEvent) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", editingEvent.id);

    if (error) {
      showToast("Error deleting event: " + error.message, "error");
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
    showToast("Event deleted", "success");
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }

  // ── Modal handlers ────────────────────────────────────────────────────────

  function openCreateModal() {
    setEditingEvent(null);
    setModalMode("create");
    setModalOpen(true);
  }

  function openEditModal(event: CalendarEvent) {
    setEditingEvent(event);
    setModalMode("edit");
    setModalOpen(true);
  }

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingEvent(null);
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const padding = useMemo(() => getMonthStartPadding(year, month), [year, month]);
  const today = useMemo(() => new Date(), []);

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((e) => isSameDay(new Date(e.start_date), selectedDate));
  }, [events, selectedDate]);

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter((e) => isSameDay(new Date(e.start_date), day));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageLoader text="Loading calendar..." />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Schedule workouts, meals, and track your fitness journey.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          + New Event
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-3 shadow-sm">
        <button type="button" onClick={prevMonth} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Previous month">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900">
            {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button type="button" onClick={goToday} className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200">
            Today
          </button>
        </div>

        <button type="button" onClick={nextMonth} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" aria-label="Next month">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
        </button>
      </div>

      {/* Calendar grid + sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-400">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Padding */}
            {Array.from({ length: padding }).map((_, i) => (
              <div key={`pad-${i}`} className="h-20 rounded-lg" />
            ))}

            {/* Days */}
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={[
                    "flex h-20 flex-col items-start rounded-lg border p-1.5 text-left transition-colors",
                    isSelected
                      ? "border-zinc-900 bg-zinc-50"
                      : isToday
                      ? "border-blue-200 bg-blue-50/50"
                      : "border-transparent hover:border-zinc-200 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-zinc-900 text-white" : "text-zinc-700",
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </span>
                  {/* Event dots */}
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: ev.color || "#6b7280" }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-zinc-400">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: selected day events */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              {selectedDate ? formatDate(selectedDate) : "Select a day"}
            </h3>
            {selectedDate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                + Add
              </button>
            )}
          </div>

          {!selectedDate ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-zinc-400">Click a day to see events</p>
            </div>
          ) : eventsForSelectedDate.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <span className="text-2xl">📅</span>
              <p className="text-sm text-zinc-400">No events this day</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-1 text-xs font-medium text-zinc-900 hover:underline"
              >
                Create one →
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {eventsForSelectedDate.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => openEditModal(event)}
                    className="flex w-full items-start gap-3 rounded-lg border border-zinc-100 p-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: event.color || "#6b7280" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 truncate">{event.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {TYPE_ICONS[event.event_type] || "📌"} {event.event_type}
                        {!event.all_day && ` · ${formatTime(event.start_date)}`}
                        {event.all_day && " · All day"}
                      </p>
                      {event.description && (
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{event.description}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">Upcoming Events</h3>
        {events.filter((e) => new Date(e.start_date) >= today).length === 0 ? (
          <div className="flex h-24 items-center justify-center">
            <p className="text-sm text-zinc-400">No upcoming events. Create one to get started!</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {events
              .filter((e) => new Date(e.start_date) >= today)
              .slice(0, 5)
              .map((event) => (
                <li key={event.id} className="flex items-center gap-3 py-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color || "#6b7280" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">{event.title}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {!event.all_day && ` at ${formatTime(event.start_date)}`}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-300">
                    {TYPE_ICONS[event.event_type] || "📌"}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={modalMode === "create" ? handleCreateEvent : handleUpdateEvent}
        onDelete={modalMode === "edit" ? handleDeleteEvent : undefined}
        event={editingEvent}
        mode={modalMode}
      />

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-lg",
            toast.type === "success" ? "border-emerald-200 bg-white" : "border-red-200 bg-white",
          ].join(" ")}
        >
          <span className={`text-sm font-medium ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
            {toast.type === "success" ? "✓" : "✗"} {toast.message}
          </span>
        </div>
      )}
    </div>
  );
}
