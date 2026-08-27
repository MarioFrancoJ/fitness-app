"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SandboxContextValue {
  /** Whether sandbox mode is currently active */
  isSandbox: boolean;
  /** Whether the current user has SUPER_ADMIN role (can toggle sandbox) */
  isSuperAdmin: boolean;
  /** User's role */
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  /** Toggle sandbox mode on/off (persists to DB) */
  toggleSandbox: () => Promise<void>;
  /** Loading state */
  loading: boolean;
}

const SandboxContext = createContext<SandboxContextValue>({
  isSandbox: false,
  isSuperAdmin: false,
  role: "USER",
  toggleSandbox: async () => {},
  loading: true,
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [isSandbox, setIsSandbox] = useState(false);
  const [role, setRole] = useState<"USER" | "ADMIN" | "SUPER_ADMIN">("USER");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserState() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("users")
        .select("role, sandbox_mode")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRole(profile.role as "USER" | "ADMIN" | "SUPER_ADMIN");
        setIsSandbox(profile.sandbox_mode ?? false);
      }

      setLoading(false);
    }

    loadUserState();
  }, []);

  const toggleSandbox = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newValue = !isSandbox;

    const { error } = await supabase
      .from("users")
      .update({ sandbox_mode: newValue })
      .eq("id", user.id);

    if (!error) {
      setIsSandbox(newValue);
    }
  }, [isSandbox]);

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <SandboxContext.Provider value={{ isSandbox, isSuperAdmin, role, toggleSandbox, loading }}>
      {children}
    </SandboxContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSandbox(): SandboxContextValue {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error("useSandbox must be used within a SandboxProvider");
  }
  return context;
}
