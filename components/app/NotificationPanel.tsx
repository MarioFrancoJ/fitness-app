"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  loadNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeIcon(t: NotificationType): string {
  switch (t) {
    case "Workout Reminder":       return "💪";
    case "Nutrition Reminder":     return "🥗";
    case "Meal Planner Reminder":  return "📋";
    case "Progress Check-In":      return "📈";
    case "Achievement":            return "🏆";
    case "Recommendation":         return "💡";
    case "Subscription":           return "⭐";
    case "System":                 return "🔔";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const notifications = loadNotifications();
  const unread = notifications.filter((n) => n.status === "Unread");
  const recent = notifications.slice(0, 8); // Show max 8 in panel

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    // Delay to avoid the bell click from immediately closing
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleMarkAllRead() {
    markAllAsRead();
    onUnreadCountChange(0);
  }

  function handleNotificationClick(notification: Notification) {
    if (notification.status === "Unread") {
      markAsRead(notification.id);
      onUnreadCountChange(Math.max(0, unread.length - 1));
    }
    onClose();
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Notifications</h2>
          {unread.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {unread.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="mb-2 text-2xl">🔔</span>
            <p className="text-sm text-zinc-400">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {recent.map((notification) => (
              <li key={notification.id}>
                {notification.actionUrl ? (
                  <Link
                    href={notification.actionUrl}
                    onClick={() => handleNotificationClick(notification)}
                    className={[
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-zinc-50",
                      notification.status === "Unread" ? "bg-blue-50/40" : "",
                    ].join(" ")}
                  >
                    <NotificationContent notification={notification} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={[
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50",
                      notification.status === "Unread" ? "bg-blue-50/40" : "",
                    ].join(" ")}
                  >
                    <NotificationContent notification={notification} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
}

// ── Notification Item Content ─────────────────────────────────────────────────

function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <>
      {/* Icon */}
      <span className="mt-0.5 text-lg" aria-hidden="true">
        {typeIcon(notification.type)}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={[
              "text-sm leading-tight",
              notification.status === "Unread"
                ? "font-semibold text-zinc-900"
                : "font-medium text-zinc-600",
            ].join(" ")}
          >
            {notification.title}
          </p>
          {notification.status === "Unread" && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-zinc-300">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </>
  );
}
