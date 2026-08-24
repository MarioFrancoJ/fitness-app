"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import LanguageSwitcher from "./LanguageSwitcher";
import { getUnreadCount, generateReminders } from "@/lib/notifications";

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-zinc-400" aria-hidden="true">
      <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path fillRule="evenodd" d="M4 8a6 6 0 1 1 12 0c0 1.887.454 3.665 1.257 5.234a.75.75 0 0 1-.515 1.076 32.903 32.903 0 0 1-3.256.508 3.5 3.5 0 0 1-6.972 0 32.91 32.91 0 0 1-3.256-.508.75.75 0 0 1-.515-1.076A11.448 11.448 0 0 0 4 8Zm6 7.5a2 2 0 0 1-1.95-1.557 33.54 33.54 0 0 0 3.9 0A2 2 0 0 1 10 15.5Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TopbarProps {
  locale: Locale;
}

export default function Topbar({ locale }: TopbarProps) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    generateReminders();
    setUnread(getUnreadCount());
  }, []);

  function handleLogout() {
    localStorage.removeItem("fitnessapp_session");
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
          placeholder="Search..."
          aria-label="Search"
          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <LanguageSwitcher currentLocale={locale} />

        {/* Notifications */}
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <IconBell />
          {unread > 0 && (
            <span
              aria-label={`${unread} unread`}
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <button
          type="button"
          aria-label="User menu"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
        >
          AJ
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sign out"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
