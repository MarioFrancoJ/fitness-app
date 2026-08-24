import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI — Admin" };

export default function AIPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">AI</h1>
      <p className="text-sm text-zinc-500">Manage AI assistant configuration and usage.</p>
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
        <span className="text-sm text-zinc-400">AI management coming soon</span>
      </div>
    </div>
  );
}
