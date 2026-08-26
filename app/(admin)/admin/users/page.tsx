"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
type UserStatus = "Active" | "Suspended" | "Deleted";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
}

const ROLES: UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];
const STATUSES: ("All" | UserStatus)[] = ["All", "Active", "Suspended", "Deleted"];

function statusBadge(s: UserStatus): string {
  switch (s) {
    case "Active": return "bg-emerald-50 text-emerald-700";
    case "Suspended": return "bg-amber-50 text-amber-700";
    case "Deleted": return "bg-red-50 text-red-700";
  }
}

function roleBadge(r: UserRole): string {
  switch (r) {
    case "SUPER_ADMIN": return "bg-purple-50 text-purple-700";
    case "ADMIN": return "bg-blue-50 text-blue-700";
    case "USER": return "bg-zinc-100 text-zinc-700";
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("USER");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("id, name, email, role, status, created_at, last_login_at")
        .order("created_at", { ascending: false });
      if (data) setUsers(data as UserRow[]);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  async function handleStatusChange(id: string, status: UserStatus) {
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ status }).eq("id", id);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
      setToast(`User ${status === "Suspended" ? "suspended" : status === "Active" ? "activated" : "deleted"}`);
    }
  }

  function handleEditStart(user: UserRow) {
    setEditingId(user.id); setEditName(user.name); setEditRole(user.role);
  }

  async function handleEditSave() {
    if (!editingId) return;
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ name: editName, role: editRole }).eq("id", editingId);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, name: editName, role: editRole } : u)));
      setToast("User updated");
    }
    setEditingId(null);
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">User Management</h1><p className="mt-1 text-sm text-zinc-500">{users.length} users · {users.filter((u) => u.status === "Active").length} active</p></div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64"><svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg><input type="search" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" /></div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "All" | UserRole)} aria-label="Filter by role" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"><option value="All">All Roles</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "All" | UserStatus)} aria-label="Filter by status" className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}</select>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50"><tr><th className="px-5 py-3 font-semibold text-zinc-700">Name</th><th className="px-5 py-3 font-semibold text-zinc-700">Email</th><th className="px-5 py-3 font-semibold text-zinc-700">Role</th><th className="px-5 py-3 font-semibold text-zinc-700">Status</th><th className="px-5 py-3 font-semibold text-zinc-700">Registered</th><th className="px-5 py-3 font-semibold text-zinc-700">Last Active</th><th className="px-5 py-3 font-semibold text-zinc-700">Actions</th></tr></thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-zinc-400">No users found.</td></tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3 font-medium text-zinc-900">{editingId === user.id ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 w-32 rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-300" /> : user.name}</td>
                      <td className="px-5 py-3 text-zinc-600">{user.email}</td>
                      <td className="px-5 py-3">{editingId === user.id ? <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="h-7 rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-300">{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select> : <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge(user.role)}`}>{user.role}</span>}</td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(user.status)}`}>{user.status}</span></td>
                      <td className="px-5 py-3 text-zinc-500">{user.created_at.slice(0, 10)}</td>
                      <td className="px-5 py-3 text-zinc-500">{user.last_login_at?.slice(0, 10) || "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {editingId === user.id ? (
                            <><button type="button" onClick={handleEditSave} className="text-xs font-medium text-emerald-600 hover:text-emerald-800">Save</button><button type="button" onClick={() => setEditingId(null)} className="text-xs font-medium text-zinc-400 hover:text-zinc-700">Cancel</button></>
                          ) : (
                            <>
                              <button type="button" onClick={() => handleEditStart(user)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Edit</button>
                              {user.status === "Active" && <button type="button" onClick={() => handleStatusChange(user.id, "Suspended")} className="text-xs font-medium text-amber-600 hover:text-amber-800">Suspend</button>}
                              {user.status === "Suspended" && <button type="button" onClick={() => handleStatusChange(user.id, "Active")} className="text-xs font-medium text-emerald-600 hover:text-emerald-800">Activate</button>}
                              {user.status !== "Deleted" && <button type="button" onClick={() => handleStatusChange(user.id, "Deleted")} className="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && (<div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg"><p className="text-sm font-medium text-zinc-800">{toast}</p></div>)}
    </>
  );
}
