"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

type FilterTab = "all" | "unread" | "archived";

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

function priorityDot(p: string): string {
  switch (p) {
    case "Critical": return "bg-red-500";
    case "High":     return "bg-orange-400";
    case "Medium":   return "bg-amber-400";
    default:         return "bg-zinc-300";
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { success: showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);


  async function loadNotifications() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data ?? []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ status: "Read", read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "Read", read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function handleMarkUnread(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ status: "Unread", read_at: null })
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "Unread", read_at: null } : n))
      );
    } catch (err) {
      console.error("Failed to mark as unread:", err);
    }
  }

  async function handleArchive(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ status: "Archived" })
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "Archived" } : n))
      );
      showToast("Archived");
    } catch (err) {
      console.error("Failed to archive notification:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Deleted");
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  async function handleMarkAllRead() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ status: "Read", read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("status", "Unread");
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.status === "Unread" ? { ...n, status: "Read", read_at: new Date().toISOString() } : n))
      );
      showToast("All marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  const filtered = useMemo(() => {
    switch (filter) {
      case "unread": return notifications.filter((n) => n.status === "Unread");
      case "archived": return notifications.filter((n) => n.status === "Archived");
      default: return notifications.filter((n) => n.status !== "Archived");
    }
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => n.status === "Unread").length;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Notifications</h1>
            <p className="mt-1 text-sm text-zinc-500">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/settings/notifications" className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
              Preferences
            </Link>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit">
          {([["all", "All"], ["unread", "Unread"], ["archived", "Archived"]] as [FilterTab, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={["rounded-md px-4 py-1.5 text-xs font-semibold transition-colors", filter === key ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>
              {label}{key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
            <p className="text-sm text-zinc-400">
              {filter === "unread" ? "No unread notifications." : filter === "archived" ? "No archived notifications." : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((notif) => (
              <div key={notif.id}
                className={["flex items-start gap-3 rounded-xl border p-4 transition-colors",
                  notif.status === "Unread" ? "border-zinc-200 bg-white shadow-sm" : "border-zinc-100 bg-zinc-50",
                ].join(" ")}>
                {/* Icon */}
                <span className="mt-0.5 text-lg shrink-0">{typeIcon(notif.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${priorityDot(notif.priority)}`} />
                    <p className={`text-sm font-semibold truncate ${notif.status === "Unread" ? "text-zinc-900" : "text-zinc-600"}`}>{notif.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{notif.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                    <span>{notif.type}</span>
                    <span>{timeAgo(notif.created_at)}</span>
                    {notif.action_url && (
                      <Link href={notif.action_url} className="font-medium text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
                        View
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  {notif.status === "Unread" ? (
                    <button type="button" onClick={() => handleMarkRead(notif.id)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100">Read</button>
                  ) : notif.status === "Read" ? (
                    <button type="button" onClick={() => handleMarkUnread(notif.id)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100">Unread</button>
                  ) : null}
                  {notif.status !== "Archived" && (
                    <button type="button" onClick={() => handleArchive(notif.id)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-100">Archive</button>
                  )}
                  <button type="button" onClick={() => handleDelete(notif.id)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
