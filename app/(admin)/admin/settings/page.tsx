import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Admin" };

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h1>
      <p className="text-sm text-zinc-500">Platform-wide configuration.</p>
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
        <span className="text-sm text-zinc-400">Admin settings coming soon</span>
      </div>
    </div>
  );
}
