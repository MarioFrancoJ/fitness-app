import type { Metadata } from "next";

export const metadata: Metadata = { title: "Progress — Admin" };

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Progress</h1>
      <p className="text-sm text-zinc-500">Monitor user progress and transformations.</p>
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
        <span className="text-sm text-zinc-400">Progress overview coming soon</span>
      </div>
    </div>
  );
}
