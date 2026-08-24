import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users — Admin" };

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Users</h1>
      <p className="text-sm text-zinc-500">Manage all registered users.</p>
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
        <span className="text-sm text-zinc-400">User management coming soon</span>
      </div>
    </div>
  );
}
