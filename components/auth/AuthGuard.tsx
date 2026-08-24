"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Frontend-only route protection.
 * Checks localStorage for fitnessapp_session.
 * Redirects to /login if no session exists.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const session = localStorage.getItem("fitnessapp_session");
      if (session) {
        setAuthorized(true);
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Loading state while checking
  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
