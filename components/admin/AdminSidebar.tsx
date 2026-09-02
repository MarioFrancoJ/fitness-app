"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Inline icons ──────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
    </svg>
  );
}

function IconDumbbell() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M6 3a1 1 0 0 1 1 1v1h6V4a1 1 0 1 1 2 0v1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2v1a1 1 0 1 1-2 0v-1H7v1a1 1 0 1 1-2 0v-1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2V4a1 1 0 0 1 1-1Zm1 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H7Z" clipRule="evenodd" />
    </svg>
  );
}

function IconBeaker() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1a1 1 0 0 0 0 2h.5v4.036a1 1 0 0 1-.293.707l-4.5 4.5A3 3 0 0 0 5.829 17h8.342a3 3 0 0 0 2.122-5.121l-4.5-4.5A1 1 0 0 1 11.5 7.036V3H12a1 1 0 1 0 0-2H8Z" clipRule="evenodd" />
    </svg>
  );
}

function IconApple() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10 2c-1.5 0-2.5 1-3 2-.5-1-1.5-2-3-2C2 2 1 4 1 6c0 5 5 10 9 12 4-2 9-7 9-12 0-2-1-4-3-4-1.5 0-2.5 1-3 2-.5-1-1.5-2-3-2Z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06V3.94a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.34A.75.75 0 0 0 2 4.06v11.12a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" clipRule="evenodd" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6Z" clipRule="evenodd" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5v-3.379a3 3 0 0 0-.879-2.121l-3.12-3.121a3 3 0 0 0-1.402-.791 2.252 2.252 0 0 1 1.913-1.576A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-.25Z" clipRule="evenodd" />
      <path d="M3.5 6A1.5 1.5 0 0 0 2 7.5v9A1.5 1.5 0 0 0 3.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L8.44 6.44A1.5 1.5 0 0 0 7.378 6H3.5Z" />
    </svg>
  );
}

function IconTrendUp() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M12 7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9.414l-5.293 5.293a1 1 0 0 1-1.414 0L7 12.414l-3.293 3.293a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0L10 12.586 14.586 8H13a1 1 0 0 1-1-1Z" clipRule="evenodd" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10 1l2.5 6.5L19 10l-6.5 2.5L10 19l-2.5-6.5L1 10l6.5-2.5L10 1Z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.97.342 1.409.58l1.27-.802a1 1 0 0 1 1.197.144l.96.96a1 1 0 0 1 .145 1.197l-.802 1.27c.238.44.436.912.58 1.409l1.473.294A1 1 0 0 1 19 9.32v1.36a1 1 0 0 1-.804.98l-1.473.295a6.96 6.96 0 0 1-.58 1.409l.802 1.27a1 1 0 0 1-.144 1.197l-.96.96a1 1 0 0 1-1.197.145l-1.27-.802a6.96 6.96 0 0 1-1.409.58l-.294 1.473A1 1 0 0 1 10.68 19H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.96 6.96 0 0 1-1.409-.58l-1.27.802a1 1 0 0 1-1.197-.144l-.96-.96a1 1 0 0 1-.145-1.197l.802-1.27a6.96 6.96 0 0 1-.58-1.409L1.804 11.68A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.97.58-1.409l-.802-1.27a1 1 0 0 1 .144-1.197l.96-.96A1 1 0 0 1 5.356 3.064l1.27.802c.44-.238.912-.436 1.409-.58L8.34 1.804ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Dashboard",     href: "/admin",               icon: <IconGrid /> },
  { label: "Users",         href: "/admin/users",         icon: <IconUsers /> },
  { label: "Exercises",     href: "/admin/exercises",     icon: <IconDumbbell /> },
  { label: "Ingredients",   href: "/admin/ingredients",   icon: <IconBeaker /> },
  { label: "Foods",         href: "/admin/foods",         icon: <IconApple /> },
  { label: "Recipes",       href: "/admin/recipes",       icon: <IconBook /> },
  { label: "Sync Images",   href: "/admin/recipes/sync-images", icon: <IconImage /> },
  { label: "Meal Plans",    href: "/admin/meal-plans",    icon: <IconCalendar /> },
  { label: "Workout Plans", href: "/admin/workout-plans", icon: <IconClipboard /> },
  { label: "Progress",      href: "/admin/progress",      icon: <IconTrendUp /> },
  { label: "AI",            href: "/admin/ai",            icon: <IconSpark /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    // "/admin/recipes" has a dedicated sub-route ("/sync-images") with its own
    // nav item, so match it exactly to avoid highlighting both entries.
    if (href === "/admin/recipes") return pathname === "/admin/recipes";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-zinc-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-100 px-5">
        <span className="text-base font-bold tracking-tight text-zinc-900">
          Admin
        </span>
        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
          Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
            ].join(" ")}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="border-t border-zinc-100 px-3 py-4">
        <Link
          href="/admin/settings"
          className={[
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive("/admin/settings")
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
          ].join(" ")}
          aria-current={isActive("/admin/settings") ? "page" : undefined}
        >
          <IconSettings />
          Settings
        </Link>
      </div>
    </aside>
  );
}
