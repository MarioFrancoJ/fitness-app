"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

/**
 * Frontend-only admin role protection.
 * Checks fitnessapp_session for SUPER_ADMIN or ADMIN role.
 * Redirects USER role to /dashboard.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fitnessapp_session");
      if (!stored) {
        // No session — AuthGuard should have caught this, but just in case
        router.replace("/login");
        return;
      }

      const session = JSON.parse(stored);
      const role = session.role || "";

      if (ADMIN_ROLES.includes(role)) {
        setAuthorized(true);
      } else {
        // USER role — redirect to dashboard
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Loading state
  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Checking permissions...</p>
      </div>
    );
  }

  return <>{children}</>;
}
