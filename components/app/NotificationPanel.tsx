"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  action_url: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeIcon(t: string): string {
  switch (t) {
    case "Workout Reminder":       return "💪";
    case "Nutrition Reminder":     return "🥗";
    case "Meal Planner Reminder":  return "📋";
    case "Progress Check-In":      return "📈";
    case "Achievement":            return "🏆";
    case "Recommendation":         return "💡";
    case "Subscription":           return "⭐";
    case "System":                 return "🔔";
    default:                       return "🔔";
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

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, message, status, action_url, created_at")
        .eq("user_id", user.id)
        .neq("status", "Archived")
        .order("created_at", { ascending: false })
        .limit(8);

      if (data) setNotifications(data);
    }
    load();
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    const timer = setTimeout(() => { document.addEventListener("mousedown", handleClickOutside); }, 10);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handleClickOutside); };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unread = notifications.filter((n) => n.status === "Unread");

  async function handleMarkAllRead() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ status: "Read", read_at: new Date().toISOString() }).eq("user_id", user.id).eq("status", "Unread");
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "Read" })));
    onUnreadCountChange(0);
  }

  async function handleNotificationClick(notification: NotificationItem) {
    if (notification.status === "Unread") {
      const supabase = createClient();
      await supabase.from("notifications").update({ status: "Read", read_at: new Date().toISOString() }).eq("id", notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, status: "Read" } : n)));
      onUnreadCountChange(Math.max(0, unread.length - 1));
    }
    onClose();
  }

  return (
    <div ref={panelRef} role="dialog" aria-label="Notifications" className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Notifications</h2>
          {unread.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{unread.length}</span>
          )}
        </div>
        {unread.length > 0 && (
          <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="mb-2 text-2xl">🔔</span>
            <p className="text-sm text-zinc-400">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {notifications.map((notification) => (
              <li key={notification.id}>
                {notification.action_url ? (
                  <Link href={notification.action_url} onClick={() => handleNotificationClick(notification)}
                    className={["flex gap-3 px-4 py-3 transition-colors hover:bg-zinc-50", notification.status === "Unread" ? "bg-blue-50/40" : ""].join(" ")}>
                    <span className="mt-0.5 text-lg" aria-hidden="true">{typeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={["text-sm leading-tight", notification.status === "Unread" ? "font-semibold text-zinc-900" : "font-medium text-zinc-600"].join(" ")}>{notification.title}</p>
                        {notification.status === "Unread" && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{notification.message}</p>
                      <p className="mt-1 text-xs text-zinc-300">{timeAgo(notification.created_at)}</p>
                    </div>
                  </Link>
                ) : (
                  <button type="button" onClick={() => handleNotificationClick(notification)}
                    className={["flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50", notification.status === "Unread" ? "bg-blue-50/40" : ""].join(" ")}>
                    <span className="mt-0.5 text-lg" aria-hidden="true">{typeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={["text-sm leading-tight", notification.status === "Unread" ? "font-semibold text-zinc-900" : "font-medium text-zinc-600"].join(" ")}>{notification.title}</p>
                        {notification.status === "Unread" && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-2">{notification.message}</p>
                      <p className="mt-1 text-xs text-zinc-300">{timeAgo(notification.created_at)}</p>
                    </div>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-4 py-2.5">
        <Link href="/notifications" onClick={onClose} className="block text-center text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900">
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
