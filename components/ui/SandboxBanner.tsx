"use client";

import { useSandbox } from "@/contexts/SandboxContext";

/**
 * Sticky banner displayed when sandbox mode is active.
 * Shows a clear visual indicator that data won't affect real metrics.
 */
export default function SandboxBanner() {
  const { isSandbox, isSuperAdmin, toggleSandbox } = useSandbox();

  if (!isSandbox) return null;

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm">
      <span className="inline-flex items-center gap-1.5">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
        Sandbox Mode Active
      </span>
      <span className="hidden sm:inline text-amber-100">
        — Changes made here do not affect your real account data
      </span>
      {isSuperAdmin && (
        <button
          type="button"
          onClick={toggleSandbox}
          className="ml-2 rounded-md bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          Exit Sandbox
        </button>
      )}
    </div>
  );
}
