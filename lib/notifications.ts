// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "Workout Reminder"
  | "Nutrition Reminder"
  | "Meal Planner Reminder"
  | "Progress Check-In"
  | "Achievement"
  | "Recommendation"
  | "Subscription"
  | "System";

export type NotificationPriority = "Low" | "Medium" | "High" | "Critical";
export type NotificationStatus = "Unread" | "Read" | "Archived";
export type ReminderFrequency = "Daily" | "Weekly" | "Monthly" | "Never";

// Future delivery channels
export type DeliveryChannel = "in_app" | "email" | "push" | "sms" | "whatsapp";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt: string | null;
  actionUrl: string | null;
}

export interface NotificationPreferences {
  workoutReminders: boolean;
  nutritionReminders: boolean;
  progressReminders: boolean;
  achievementNotifications: boolean;
  recommendationNotifications: boolean;
  subscriptionNotifications: boolean;
  reminderFrequency: ReminderFrequency;
}

// Future integration interfaces
export interface DeliveryConfig {
  channel: DeliveryChannel;
  enabled: boolean;
  config: Record<string, string>;
}

export interface NotificationStats {
  totalSent: number;
  unreadCount: number;
  readRate: number;
  archivedRate: number;
  byType: Record<NotificationType, number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const NOTIFICATION_TYPES: NotificationType[] = [
  "Workout Reminder", "Nutrition Reminder", "Meal Planner Reminder",
  "Progress Check-In", "Achievement", "Recommendation", "Subscription", "System",
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  workoutReminders: true,
  nutritionReminders: true,
  progressReminders: true,
  achievementNotifications: true,
  recommendationNotifications: true,
  subscriptionNotifications: true,
  reminderFrequency: "Daily",
};

// ── Storage ───────────────────────────────────────────────────────────────────

const NOTIFICATIONS_KEY = "fitnessapp_notifications";
const PREFERENCES_KEY = "fitnessapp_notification_preferences";

export function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: Notification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export function addNotification(notification: Omit<Notification, "id" | "userId" | "status" | "createdAt" | "readAt">): Notification {
  const all = loadNotifications();
  const item: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    userId: "current-user",
    status: "Unread",
    createdAt: new Date().toISOString(),
    readAt: null,
  };
  saveNotifications([item, ...all]);
  return item;
}

export function markAsRead(id: string) {
  const all = loadNotifications();
  saveNotifications(all.map((n) => (n.id === id ? { ...n, status: "Read" as NotificationStatus, readAt: new Date().toISOString() } : n)));
}

export function markAsUnread(id: string) {
  const all = loadNotifications();
  saveNotifications(all.map((n) => (n.id === id ? { ...n, status: "Unread" as NotificationStatus, readAt: null } : n)));
}

export function archiveNotification(id: string) {
  const all = loadNotifications();
  saveNotifications(all.map((n) => (n.id === id ? { ...n, status: "Archived" as NotificationStatus } : n)));
}

export function deleteNotification(id: string) {
  saveNotifications(loadNotifications().filter((n) => n.id !== id));
}

export function markAllAsRead() {
  const all = loadNotifications();
  const now = new Date().toISOString();
  saveNotifications(all.map((n) => (n.status === "Unread" ? { ...n, status: "Read" as NotificationStatus, readAt: now } : n)));
}

export function getUnreadCount(): number {
  return loadNotifications().filter((n) => n.status === "Unread").length;
}

// ── Preferences ───────────────────────────────────────────────────────────────

export function loadPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: NotificationPreferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

// ── Reminder Generator ────────────────────────────────────────────────────────

export function generateReminders() {
  const prefs = loadPreferences();
  const existing = loadNotifications();
  const today = new Date().toISOString().slice(0, 10);

  // Avoid duplicate reminders for today
  const todayNotifs = existing.filter((n) => n.createdAt.startsWith(today));
  const generated: Omit<Notification, "id" | "userId" | "status" | "createdAt" | "readAt">[] = [];

  // ── Workout Reminders ──────────────────────────────────────────────────
  if (prefs.workoutReminders) {
    try {
      const sessions = JSON.parse(localStorage.getItem("fitnessapp_training_sessions") || "[]");
      const completed = sessions.filter((s: { status: string }) => s.status === "Completed");
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 3);
      const recentSessions = completed.filter((s: { date: string }) => new Date(s.date) >= weekAgo);

      if (recentSessions.length === 0 && !todayNotifs.some((n) => n.type === "Workout Reminder")) {
        generated.push({
          type: "Workout Reminder",
          title: "Time to Train!",
          message: "You haven't logged a workout in 3 days. A short session helps maintain your progress.",
          priority: "Medium",
          actionUrl: "/training/start",
        });
      }
    } catch {}
  }

  // ── Nutrition Reminders ────────────────────────────────────────────────
  if (prefs.nutritionReminders) {
    try {
      const meals = JSON.parse(localStorage.getItem("fitnessapp_nutrition_meals") || "[]");
      const todayMeals = meals.filter((m: { date: string }) => m.date === today);

      if (todayMeals.length === 0 && !todayNotifs.some((n) => n.type === "Nutrition Reminder")) {
        generated.push({
          type: "Nutrition Reminder",
          title: "Log Your Meals",
          message: "You haven't logged any meals today. Tracking keeps you accountable.",
          priority: "Low",
          actionUrl: "/nutrition",
        });
      }
    } catch {}
  }

  // ── Progress Reminders ─────────────────────────────────────────────────
  if (prefs.progressReminders) {
    try {
      const history = JSON.parse(localStorage.getItem("fitnessapp_measurement_history") || "[]");
      if (history.length > 0) {
        const lastDate = history[0]?.date;
        if (lastDate) {
          const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince >= 7 && !todayNotifs.some((n) => n.type === "Progress Check-In")) {
            generated.push({
              type: "Progress Check-In",
              title: "Update Your Measurements",
              message: `It's been ${daysSince} days since your last measurement update. Track your progress!`,
              priority: "Low",
              actionUrl: "/profile",
            });
          }
        }
      }
    } catch {}
  }

  // ── Subscription Reminders ─────────────────────────────────────────────
  if (prefs.subscriptionNotifications) {
    try {
      const sub = JSON.parse(localStorage.getItem("fitnessapp_subscription") || "{}");
      if (sub.status === "Trial" && sub.expirationDate) {
        const daysLeft = Math.floor((new Date(sub.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft >= 0 && !todayNotifs.some((n) => n.type === "Subscription")) {
          generated.push({
            type: "Subscription",
            title: "Trial Ending Soon",
            message: `Your premium trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Upgrade to keep all features.`,
            priority: "High",
            actionUrl: "/subscription",
          });
        }
      }
    } catch {}
  }

  // Save generated
  for (const notif of generated) {
    addNotification(notif);
  }

  return generated.length;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getNotificationStats(): NotificationStats {
  const all = loadNotifications();
  const total = all.length;
  const unread = all.filter((n) => n.status === "Unread").length;
  const read = all.filter((n) => n.status === "Read").length;
  const archived = all.filter((n) => n.status === "Archived").length;

  const byType = {} as Record<NotificationType, number>;
  for (const t of NOTIFICATION_TYPES) byType[t] = 0;
  for (const n of all) byType[n.type] = (byType[n.type] || 0) + 1;

  return {
    totalSent: total,
    unreadCount: unread,
    readRate: total > 0 ? Math.round((read / total) * 100) : 0,
    archivedRate: total > 0 ? Math.round((archived / total) * 100) : 0,
    byType,
  };
}
