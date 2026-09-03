"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-zinc-400" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
  );
}

function roleBadgeColor(role: string) {
  switch (role) {
    case "SUPER_ADMIN": return "bg-purple-50 text-purple-700";
    case "ADMIN":       return "bg-blue-50 text-blue-700";
    default:            return "bg-zinc-100 text-zinc-700";
  }
}

export default function AdminTopbar() {
  const router = useRouter();
  const { dict } = useDictionary();
  const [role, setRole] = useState<string>("");
  const [name, setName] = useState<string>("AD");

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get role from public.users
      const { data: profile } = await supabase
        .from("users")
        .select("role, name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRole(profile.role || "");
        setName(profile.name?.charAt(0)?.toUpperCase() || "AD");
      }
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-100 bg-white px-6">
      {/* Search */}
      <div className="relative w-64">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <IconSearch />
        </span>
        <input
          type="search"
          placeholder={dict.admin.searchPlaceholder}
          aria-label={dict.admin.searchPlaceholder}
          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Current role badge */}
        {role && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeColor(role)}`}>
            {role.replace("_", " ")}
          </span>
        )}

        <Link
          href="/dashboard"
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          {dict.admin.backToApp}
        </Link>

        <button
          type="button"
          aria-label="Admin user"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white"
        >
          {name}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          {dict.common.logout}
        </button>
      </div>
    </header>
  );
}
