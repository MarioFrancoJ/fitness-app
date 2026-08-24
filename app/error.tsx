"use client";

import { useEffect } from "react";
import { logError } from "@/lib/monitoring";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError(error.message, error.stack || null, "critical");
  }, [error]);

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center px-6 py-20">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-10 w-10 text-red-500" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">500 — Server Error</h1>
      <p className="mb-6 text-center text-sm text-zinc-500 max-w-md">
        Something went wrong on our end. Our team has been notified. Please try again.
      </p>
      <button type="button" onClick={reset}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
        Try Again
      </button>
      {error.digest && <p className="mt-4 text-xs text-zinc-400">Error ID: {error.digest}</p>}
    </div>
  );
}
