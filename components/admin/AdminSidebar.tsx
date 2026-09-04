"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "@/components/ui/NavIcon";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

// ── Icons ─────────────────────────────────────────────────────────────────────
// Custom brand icons from /public/icons, masked via NavIcon so they inherit
// currentColor (grey inactive → white active) at the same h-4 w-4 size.
// IconSettings keeps its inline gear (no matching brand icon in the set).

function IconGrid() { return <NavIcon name="dashboard.svg" />; }
function IconUsers() { return <NavIcon name="account.svg" />; }
function IconDumbbell() { return <NavIcon name="exercises.svg" />; }
function IconBeaker() { return <NavIcon name="meal.svg" />; }
function IconApple() { return <NavIcon name="nutrition.svg" />; }
function IconBook() { return <NavIcon name="recipes.svg" />; }
function IconImage() { return <NavIcon name="photo.svg" />; }
function IconCalendar() { return <NavIcon name="calendar.svg" />; }
function IconClipboard() { return <NavIcon name="templates.svg" />; }
function IconTrendUp() { return <NavIcon name="progress.svg" />; }
function IconSpark() { return <NavIcon name="AI.svg" />; }

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.97.342 1.409.58l1.27-.802a1 1 0 0 1 1.197.144l.96.96a1 1 0 0 1 .145 1.197l-.802 1.27c.238.44.436.912.58 1.409l1.473.294A1 1 0 0 1 19 9.32v1.36a1 1 0 0 1-.804.98l-1.473.295a6.96 6.96 0 0 1-.58 1.409l.802 1.27a1 1 0 0 1-.144 1.197l-.96.96a1 1 0 0 1-1.197.145l-1.27-.802a6.96 6.96 0 0 1-1.409.58l-.294 1.473A1 1 0 0 1 10.68 19H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.96 6.96 0 0 1-1.409-.58l-1.27.802a1 1 0 0 1-1.197-.144l-.96-.96a1 1 0 0 1-.145-1.197l.802-1.27a6.96 6.96 0 0 1-.58-1.409L1.804 11.68A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.97.58-1.409l-.802-1.27a1 1 0 0 1 .144-1.197l.96-.96A1 1 0 0 1 5.356 3.064l1.27.802c.44-.238.912-.436 1.409-.58L8.34 1.804ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

type AdminNavDict = {
  dashboard: string; users: string; exercises: string; ingredients: string;
  foods: string; recipes: string; syncImages: string; mealPlans: string;
  workoutPlans: string; progress: string; ai: string; settings: string;
};

function buildNavItems(n: AdminNavDict) {
  return [
    { label: n.dashboard,     href: "/admin",               icon: <IconGrid /> },
    { label: n.users,         href: "/admin/users",         icon: <IconUsers /> },
    { label: n.exercises,     href: "/admin/exercises",     icon: <IconDumbbell /> },
    { label: n.ingredients,   href: "/admin/ingredients",   icon: <IconBeaker /> },
    { label: n.foods,         href: "/admin/foods",         icon: <IconApple /> },
    { label: n.recipes,       href: "/admin/recipes",       icon: <IconBook /> },
    { label: n.syncImages,    href: "/admin/recipes/sync-images", icon: <IconImage /> },
    { label: n.mealPlans,     href: "/admin/meal-plans",    icon: <IconCalendar /> },
    { label: n.workoutPlans,  href: "/admin/workout-plans", icon: <IconClipboard /> },
    { label: n.progress,      href: "/admin/progress",      icon: <IconTrendUp /> },
    { label: n.ai,            href: "/admin/ai",            icon: <IconSpark /> },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const { dict } = useDictionary();
  const adminNav = dict.admin.nav;
  const navItems = buildNavItems(adminNav);
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
          {dict.admin.portalName}
        </span>
        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
          {dict.admin.portalBadge}
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
                ? "bg-primary text-white"
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
              ? "bg-primary text-white"
              : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
          ].join(" ")}
          aria-current={isActive("/admin/settings") ? "page" : undefined}
        >
          <IconSettings />
          {adminNav.settings}
        </Link>
      </div>
    </aside>
  );
}
