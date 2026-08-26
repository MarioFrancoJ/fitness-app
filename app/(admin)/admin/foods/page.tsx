"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageLoader from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = "Workout Reminder" | "Nutrition Reminder" | "Meal Planner Reminder" | "Progress Check-In" | "Achievement" | "Recommendation" | "Subscription" | "System";
type NotificationPriority = "Low" | "Medium" | "High" | "Critical";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
}

const NOTIFICATION_TYPES: NotificationType[] = ["Workout Reminder", "Nutrition Reminder", "Meal Planner Reminder", "Progress Check-In", "Achievement", "Recommendation", "Subscription", "System"];
const PRIORITIES: NotificationPriority[] = ["Low", "Medium", "High", "Critical"];

function priorityBadge(p: string): string {
  switch (p) {
    case "Critical": return "bg-red-100 text-red-700";
    case "High": return "bg-orange-100 text-orange-700";
    case "Medium": return "bg-amber-100 text-amber-700";
    default: return "bg-emerald-100 text-emerald-700";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const { success: showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formType, setFormType] = useState<NotificationType>("System");
  const [formPriority, setFormPriority] = useState<NotificationPriority>("Medium");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, message, priority, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data: inserted, error } = await supabase
        .from("notifications")
        .insert({ user_id: user.id, type: formType, title: formTitle.trim(), message: formMessage.trim(), priority: formPriority })
        .select("id, type, title, message, priority, status, created_at")
        .single();

      if (!error && inserted) {
        setNotifications((prev) => [inserted, ...prev]);
        setFormTitle(""); setFormMessage(""); setShowForm(false);
        showToast("Notification broadcast sent");
      }
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDeleteTarget(null);
  }

  // Stats
  const totalSent = notifications.length;
  const unreadCount = notifications.filter((n) => n.status === "Unread").length;
  const readCount = notifications.filter((n) => n.status === "Read").length;
  const readRate = totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Notification Management</h1>
            <p className="mt-1 text-sm text-zinc-500">Create and manage platform notifications.</p>
          </div>
          <Button type="button" onClick={() => setShowForm(true)}>+ Broadcast</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-900">{totalSent}</p><p className="text-xs text-zinc-400">Total Sent</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-blue-600">{unreadCount}</p><p className="text-xs text-zinc-400">Unread</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-emerald-600">{readRate}%</p><p className="text-xs text-zinc-400">Read Rate</p></div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-500">{notifications.filter((n) => n.status === "Archived").length}</p><p className="text-xs text-zinc-400">Archived</p></div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-700">Create System Notification</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col gap-1.5"><label htmlFor="notif-title" className="text-sm font-medium text-zinc-700">Title</label><input id="notif-title" type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Notification title" required className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
              <div className="sm:col-span-2 flex flex-col gap-1.5"><label htmlFor="notif-msg" className="text-sm font-medium text-zinc-700">Message</label><textarea id="notif-msg" value={formMessage} onChange={(e) => setFormMessage(e.target.value)} placeholder="Notification content" rows={3} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="notif-type" className="text-sm font-medium text-zinc-700">Type</label><select id="notif-type" value={formType} onChange={(e) => setFormType(e.target.value as NotificationType)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{NOTIFICATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="flex flex-col gap-1.5"><label htmlFor="notif-pri" className="text-sm font-medium text-zinc-700">Priority</label><select id="notif-pri" value={formPriority} onChange={(e) => setFormPriority(e.target.value as NotificationPriority)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            </div>
            <div className="mt-4 flex gap-3"><Button type="submit">Send Notification</Button><button type="button" onClick={() => setShowForm(false)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">Cancel</button></div>
          </form>
        )}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-3"><p className="text-sm font-semibold text-zinc-700">Recent Notifications ({notifications.length})</p></div>
          {notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center"><p className="text-sm text-zinc-400">No notifications yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50"><tr><th className="px-5 py-2 text-xs font-semibold text-zinc-400">Title</th><th className="px-5 py-2 text-xs font-semibold text-zinc-400">Type</th><th className="px-5 py-2 text-xs font-semibold text-zinc-400">Priority</th><th className="px-5 py-2 text-xs font-semibold text-zinc-400">Status</th><th className="px-5 py-2 text-xs font-semibold text-zinc-400">Actions</th></tr></thead>
                <tbody className="divide-y divide-zinc-50">
                  {notifications.slice(0, 20).map((n) => (
                    <tr key={n.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-2 font-medium text-zinc-900 truncate max-w-[200px]">{n.title}</td>
                      <td className="px-5 py-2 text-zinc-500 text-xs">{n.type}</td>
                      <td className="px-5 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityBadge(n.priority)}`}>{n.priority}</span></td>
                      <td className="px-5 py-2 text-xs text-zinc-500">{n.status}</td>
                      <td className="px-5 py-2"><button type="button" onClick={() => setDeleteTarget(n.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>


      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete notification?"
        description="This notification will be permanently removed."
        onConfirm={() => { if (deleteTarget) handleDelete(deleteTarget); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
