"use client";

/**
 * Login Page
 *
 * Uses the LoginForm component which handles:
 * - Email/password sign in via Supabase
 * - Google OAuth sign in via Supabase
 *
 * Wrapped in Suspense for useSearchParams compatibility with Next.js static generation.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

// ── Inner component (reads search params — needs Suspense) ────────────────────

function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const callbackError = searchParams.get("error");

  return (
    <LoginForm redirectTo={redirectTo} callbackError={callbackError} />
  );
}

// ── Page export (Suspense boundary for static generation) ─────────────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
