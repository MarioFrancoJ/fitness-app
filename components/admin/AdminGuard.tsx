"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

/**
 * Admin role protection (UI-level fallback).
 * Primary protection is handled by middleware.ts.
 * Verifies role from public.users table via Supabase client.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Fetch role from public.users
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && ADMIN_ROLES.includes(profile.role)) {
        setAuthorized(true);
      } else {
        router.replace("/dashboard");
      }
    }

    checkAdmin();
  }, [router]);

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Verificando permisos...</p>
      </div>
    );
  }

  return <>{children}</>;
}
