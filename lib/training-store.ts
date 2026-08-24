import type { WorkoutSession, PersonalRecord } from "@/data/training-sessions";

const SESSIONS_KEY = "fitnessapp_training_sessions";
const ACTIVE_KEY = "fitnessapp_active_session";

// ── Sessions ──────────────────────────────────────────────────────────────────

export function loadSessions(): WorkoutSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: WorkoutSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function addSession(session: WorkoutSession) {
  const all = loadSessions();
  saveSessions([session, ...all]);
}

export function updateSession(id: string, data: Partial<WorkoutSession>) {
  const all = loadSessions();
  saveSessions(all.map((s) => (s.id === id ? { ...s, ...data } : s)));
}

export function getSessionById(id: string): WorkoutSession | undefined {
  return loadSessions().find((s) => s.id === id);
}

// ── Active session ────────────────────────────────────────────────────────────

export function getActiveSession(): WorkoutSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: WorkoutSession | null) {
  if (session) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

// ── Personal Records ──────────────────────────────────────────────────────────

export function computePersonalRecords(): PersonalRecord[] {
  const sessions = loadSessions().filter((s) => s.status === "Completed");
  const map = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const exLog of session.exerciseLogs) {
      const existing = map.get(exLog.exerciseId);
      let highestWeight = existing?.highestWeight ?? 0;
      let mostReps = existing?.mostReps ?? 0;
      let prDate = existing?.date ?? session.date;

      for (const set of exLog.sets) {
        if (set.completed) {
          if (set.completedWeight > highestWeight) {
            highestWeight = set.completedWeight;
            prDate = session.date;
          }
          if (set.completedReps > mostReps) {
            mostReps = set.completedReps;
          }
        }
      }

      map.set(exLog.exerciseId, {
        exerciseId: exLog.exerciseId,
        exerciseName: exLog.exerciseName,
        highestWeight,
        mostReps,
        date: prDate,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.highestWeight - a.highestWeight);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getTrainingStats() {
  const sessions = loadSessions().filter((s) => s.status === "Completed");
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const thisWeek = sessions.filter((s) => new Date(s.date) >= weekAgo);
  const totalTime = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const lastWorkout = sessions.length > 0 ? sessions[0] : null;

  // Streak: count consecutive days with sessions going backwards from today
  let streak = 0;
  const daySet = new Set(sessions.map((s) => s.date));
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    workoutsThisWeek: thisWeek.length,
    currentStreak: streak,
    lastWorkout,
    totalTrainingTime: totalTime,
    totalSessions: sessions.length,
  };
}
