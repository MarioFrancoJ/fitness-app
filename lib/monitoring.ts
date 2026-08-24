// ── Monitoring & Analytics Architecture ────────────────────────────────────────
// Prepared for: Sentry, PostHog, Google Analytics
// Do NOT connect yet — interfaces only

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventType = "page_view" | "action" | "error" | "performance";

export interface TrackingEvent {
  id: string;
  type: EventType;
  name: string;
  properties: Record<string, unknown>;
  timestamp: string;
  userId: string | null;
}

export interface ErrorEvent {
  id: string;
  message: string;
  stack: string | null;
  url: string;
  timestamp: string;
  userId: string | null;
  severity: "low" | "medium" | "high" | "critical";
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count";
  timestamp: string;
}

// Future provider interfaces
export interface MonitoringProvider {
  name: "sentry" | "posthog" | "google_analytics";
  enabled: boolean;
  dsn: string | null;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const EVENTS_KEY = "fitnessapp_tracking_events";
const ERRORS_KEY = "fitnessapp_error_log";

export function logEvent(type: EventType, name: string, properties: Record<string, unknown> = {}) {
  try {
    const events = loadEvents();
    const event: TrackingEvent = {
      id: crypto.randomUUID(),
      type,
      name,
      properties,
      timestamp: new Date().toISOString(),
      userId: "current-user",
    };
    events.unshift(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, 200)));
  } catch {}
}

export function logError(message: string, stack: string | null = null, severity: ErrorEvent["severity"] = "medium") {
  try {
    const errors = loadErrors();
    const error: ErrorEvent = {
      id: crypto.randomUUID(),
      message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : "",
      timestamp: new Date().toISOString(),
      userId: "current-user",
      severity,
    };
    errors.unshift(error);
    localStorage.setItem(ERRORS_KEY, JSON.stringify(errors.slice(0, 100)));
  } catch {}
}

export function loadEvents(): TrackingEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function loadErrors(): ErrorEvent[] {
  try {
    const raw = localStorage.getItem(ERRORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getMonitoringStats() {
  const events = loadEvents();
  const errors = loadErrors();
  const today = new Date().toISOString().slice(0, 10);

  return {
    totalEvents: events.length,
    todayEvents: events.filter((e) => e.timestamp.startsWith(today)).length,
    totalErrors: errors.length,
    todayErrors: errors.filter((e) => e.timestamp.startsWith(today)).length,
    criticalErrors: errors.filter((e) => e.severity === "critical").length,
  };
}
