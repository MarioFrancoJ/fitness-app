"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── SVG icons (inline, no external library) ──────────────────────────────────

function IconDashboard() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10Zm8-6a1 1 0 0 1 1 1v4.586l2.707 2.707a1 1 0 0 1-1.414 1.414l-3-3A1 1 0 0 1 7 10V5a1 1 0 0 1 1-1Z" />
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
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

function IconLeaf() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M9.965 3.038C7.67 3.28 5.64 4.533 4.25 6.492a8.014 8.014 0 0 0-1.223 6.584c.194.8.96 1.284 1.746 1.07A7.95 7.95 0 0 0 7 13.5c1.18 0 2.3.256 3.31.713C10.86 15.48 12.15 16 13.5 16c1.657 0 3-.828 3-2.5C16.5 7.649 13.576 2.664 9.965 3.038Z" clipRule="evenodd" />
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

function IconCalendar() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6Z" clipRule="evenodd" />
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

// ── Nav items config ──────────────────────────────────────────────────────────

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: <IconDashboard /> },
  { label: "Workouts",  href: "/workouts",  icon: <IconDumbbell /> },
  { label: "Nutrition", href: "/nutrition", icon: <IconLeaf /> },
  { label: "Progress",  href: "/progress",  icon: <IconTrendUp /> },
  { label: "Calendar",  href: "/calendar",  icon: <IconCalendar /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-zinc-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-100 px-5">
        <span className="text-base font-bold tracking-tight text-zinc-900">
          FitnessApp
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="border-t border-zinc-100 px-3 py-4">
        <Link
          href="/settings"
          className={[
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
          ].join(" ")}
          aria-current={pathname === "/settings" ? "page" : undefined}
        >
          <IconSettings />
          Settings
        </Link>
      </div>
    </aside>
  );
}
