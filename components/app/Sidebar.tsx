"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrid() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></svg>; }
function IconDumbbell() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M6 3a1 1 0 0 1 1 1v1h6V4a1 1 0 1 1 2 0v1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2v1a1 1 0 1 1-2 0v-1H7v1a1 1 0 1 1-2 0v-1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2V4a1 1 0 0 1 1-1Zm1 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H7Z" clipRule="evenodd" /></svg>; }
function IconHammer() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" /></svg>; }
function IconList() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.166a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>; }
function IconCalendar() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1Zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6Z" clipRule="evenodd" /></svg>; }
function IconLeaf() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M9.965 3.038C7.67 3.28 5.64 4.533 4.25 6.492a8.014 8.014 0 0 0-1.223 6.584c.194.8.96 1.284 1.746 1.07A7.95 7.95 0 0 0 7 13.5c1.18 0 2.3.256 3.31.713C10.86 15.48 12.15 16 13.5 16c1.657 0 3-.828 3-2.5C16.5 7.649 13.576 2.664 9.965 3.038Z" clipRule="evenodd" /></svg>; }
function IconBook() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06V3.94a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.34A.75.75 0 0 0 2 4.06v11.12a.75.75 0 0 0 .954.721A7.462 7.462 0 0 1 5 15.5c1.579 0 3.042.49 4.25 1.32V4.065Z" /></svg>; }
function IconCart() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.18 3H17.25a.75.75 0 0 1 .727.937l-2.5 10A.75.75 0 0 1 14.75 14.5H6.272l-.09.48a.25.25 0 0 0 .247.27H15.5a.75.75 0 0 1 0 1.5H6.43a1.75 1.75 0 0 1-1.733-1.51L3.154 3.257a.25.25 0 0 0-.248-.207H1.75A.75.75 0 0 1 1 2.25V1.75Z" /><path d="M6 17.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM15 17.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" /></svg>; }
function IconTrendUp() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M12 7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9.414l-5.293 5.293a1 1 0 0 1-1.414 0L7 12.414l-3.293 3.293a1 1 0 0 1-1.414-1.414l4-4a1 1 0 0 1 1.414 0L10 12.586 14.586 8H13a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>; }
function IconCamera() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm9 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>; }
function IconRuler() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M2 4.75A2.75 2.75 0 0 1 4.75 2h10.5A2.75 2.75 0 0 1 18 4.75v10.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25V4.75Zm4 0a.75.75 0 0 0-1.5 0v2a.75.75 0 0 0 1.5 0v-2Zm3 0a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Zm3 0a.75.75 0 0 0-1.5 0v2a.75.75 0 0 0 1.5 0v-2Zm3 0a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5Z" clipRule="evenodd" /></svg>; }
function IconSpark() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.06L5.05 4.11a.75.75 0 0 1 0-1.06ZM14.95 3.05a.75.75 0 0 1 0 1.06l-1.06 1.062a.75.75 0 0 1-1.062-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM3 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 10ZM14 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 14 10ZM10 14a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 14Z" /></svg>; }
function IconBell() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M4 8a6 6 0 1 1 12 0c0 1.887.454 3.665 1.257 5.234a.75.75 0 0 1-.515 1.076 32.903 32.903 0 0 1-3.256.508 3.5 3.5 0 0 1-6.972 0 32.91 32.91 0 0 1-3.256-.508.75.75 0 0 1-.515-1.076A11.448 11.448 0 0 0 4 8Z" clipRule="evenodd" /></svg>; }
function IconStar() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" /></svg>; }
function IconSettings() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.97.342 1.409.58l1.27-.802a1 1 0 0 1 1.197.144l.96.96a1 1 0 0 1 .145 1.197l-.802 1.27c.238.44.436.912.58 1.409l1.473.294A1 1 0 0 1 19 9.32v1.36a1 1 0 0 1-.804.98l-1.473.295a6.96 6.96 0 0 1-.58 1.409l.802 1.27a1 1 0 0 1-.144 1.197l-.96.96a1 1 0 0 1-1.197.145l-1.27-.802a6.96 6.96 0 0 1-1.409.58l-.294 1.473A1 1 0 0 1 10.68 19H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.96 6.96 0 0 1-1.409-.58l-1.27.802a1 1 0 0 1-1.197-.144l-.96-.96a1 1 0 0 1-.145-1.197l.802-1.27a6.96 6.96 0 0 1-.58-1.409L1.804 11.68A1 1 0 0 1 1 10.68V9.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.97.58-1.409l-.802-1.27a1 1 0 0 1 .144-1.197l.96-.96A1 1 0 0 1 5.356 3.064l1.27.802c.44-.238.912-.436 1.409-.58L8.34 1.804ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" /></svg>; }
function IconUser() { return <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>; }

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem { label: string; href: string; icon: React.ReactNode; }
interface NavGroup { title: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Training",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <IconGrid /> },
      { label: "Workouts", href: "/workouts", icon: <IconDumbbell /> },
      { label: "Workout Builder", href: "/training/workout-builder", icon: <IconHammer /> },
      { label: "Exercises", href: "/training/exercises", icon: <IconList /> },
      { label: "Templates", href: "/training/templates", icon: <IconList /> },
      { label: "Calendar", href: "/calendar", icon: <IconCalendar /> },
    ],
  },
  {
    title: "Nutrition",
    items: [
      { label: "Meals", href: "/nutrition", icon: <IconLeaf /> },
      { label: "Recipes", href: "/nutrition/recipes", icon: <IconBook /> },
      { label: "Shopping List", href: "/nutrition/shopping-list", icon: <IconCart /> },
    ],
  },
  {
    title: "Progress",
    items: [
      { label: "Overview", href: "/progress", icon: <IconTrendUp /> },
      { label: "Photos", href: "/progress/photos", icon: <IconCamera /> },
      { label: "Measurements", href: "/progress/measurements", icon: <IconRuler /> },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "AI Chat", href: "/ai/chat", icon: <IconSpark /> },
      { label: "AI Coach", href: "/ai-coach", icon: <IconSpark /> },
      { label: "Recommendations", href: "/recommendations", icon: <IconStar /> },
      { label: "Notifications", href: "/notifications", icon: <IconBell /> },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Subscription", href: "/subscription", icon: <IconStar /> },
      { label: "Profile", href: "/profile", icon: <IconUser /> },
      { label: "Settings", href: "/settings/notifications", icon: <IconSettings /> },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  // On route change, close mobile sidebar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleNavClick = () => { if (onClose) onClose(); };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-zinc-100 bg-white transition-transform duration-200 ease-in-out",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5">
          <span className="text-base font-bold tracking-tight text-zinc-900">FitnessApp</span>
          {/* Close button on mobile */}
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 md:hidden" aria-label="Close menu">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={[
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
