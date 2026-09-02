"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "@/components/ui/NavIcon";

// ── Icons ─────────────────────────────────────────────────────────────────────
// Custom brand icons live in /public/icons. NavIcon masks them so they inherit
// currentColor (grey inactive → white active/hover), keeping the exact size
// (h-4 w-4), spacing, and state behavior of the previous inline icons.

function IconGrid() { return <NavIcon name="dashboard.svg" />; }
function IconDumbbell() { return <NavIcon name="training.svg" />; }
function IconHammer() { return <NavIcon name="workout-builder.svg" />; }
function IconExercises() { return <NavIcon name="exercises.svg" />; }
function IconTemplates() { return <NavIcon name="templates.svg" />; }
function IconCalendar() { return <NavIcon name="calendar.svg" />; }
function IconClock() { return <NavIcon name="history.svg" />; }
function IconPlay() { return <NavIcon name="start-workout.svg" />; }
function IconLeaf() { return <NavIcon name="nutrition.svg" />; }
function IconMeal() { return <NavIcon name="meal.svg" />; }
function IconBook() { return <NavIcon name="recipes.svg" />; }
function IconCart() { return <NavIcon name="shopping-list.svg" />; }
function IconTrendUp() { return <NavIcon name="progress.svg" />; }
function IconOverview() { return <NavIcon name="overview.svg" />; }
function IconCamera() { return <NavIcon name="photo.svg" />; }
function IconRuler() { return <NavIcon name="measurements.svg" />; }
function IconScale() { return <NavIcon name="weight.svg" />; }
function IconSpark() { return <NavIcon name="AI.svg" />; }
function IconAiChat() { return <NavIcon name="ai-chat.svg" />; }
function IconAiCoach() { return <NavIcon name="ai-coach.svg" />; }
function IconStar() { return <NavIcon name="recommendations.svg" />; }
function IconUser() { return <NavIcon name="account.svg" />; }
function IconProfile() { return <NavIcon name="profile.svg" />; }
function IconSubscription() { return <NavIcon name="subscription.svg" />; }
function IconChevron({ open }: { open: boolean }) { return <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`} aria-hidden="true"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>; }
function IconCollapse() { return <NavIcon name="collapsed-menu.svg" />; }
function IconExpand() { return <NavIcon name="expanded-menu.svg" />; }

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem { label: string; href: string; icon: React.ReactNode; }
interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  matchPrefixes: string[];
}

const NAV_SECTIONS: NavSection[] = [
  { id: "training", label: "Training", icon: <IconDumbbell />, matchPrefixes: ["/workouts", "/training"], items: [
    { label: "Start Workout", href: "/training/start", icon: <IconPlay /> },
    { label: "Workouts", href: "/workouts", icon: <IconDumbbell /> },
    { label: "Workout Builder", href: "/training/workout-builder", icon: <IconHammer /> },
    { label: "Exercises", href: "/training/exercises", icon: <IconExercises /> },
    { label: "Templates", href: "/training/templates", icon: <IconTemplates /> },
    { label: "History", href: "/training/history", icon: <IconClock /> },
  ]},
  { id: "nutrition", label: "Nutrition", icon: <IconLeaf />, matchPrefixes: ["/nutrition"], items: [
    { label: "Meals", href: "/nutrition", icon: <IconMeal /> },
    { label: "Recipes", href: "/nutrition/recipes", icon: <IconBook /> },
    { label: "Shopping List", href: "/nutrition/shopping-list", icon: <IconCart /> },
  ]},
  { id: "progress", label: "Progress", icon: <IconTrendUp />, matchPrefixes: ["/progress"], items: [
    { label: "Overview", href: "/progress", icon: <IconOverview /> },
    { label: "Weight", href: "/progress/weight", icon: <IconScale /> },
    { label: "Measurements", href: "/progress/measurements", icon: <IconRuler /> },
    { label: "Photos", href: "/progress/photos", icon: <IconCamera /> },
  ]},
  { id: "ai", label: "AI", icon: <IconSpark />, matchPrefixes: ["/ai", "/ai-coach", "/recommendations", "/notifications"], items: [
    { label: "AI Chat", href: "/ai/chat", icon: <IconAiChat /> },
    { label: "AI Coach", href: "/ai-coach", icon: <IconAiCoach /> },
    { label: "Recommendations", href: "/recommendations", icon: <IconStar /> },
  ]},
  { id: "account", label: "Account", icon: <IconUser />, matchPrefixes: ["/profile", "/subscription", "/settings"], items: [
    { label: "Profile", href: "/profile", icon: <IconProfile /> },
    { label: "Subscription", href: "/subscription", icon: <IconSubscription /> },
  ]},
];

const STORAGE_KEY = "sidebar-collapsed";
const CALENDAR_HREF = "/calendar";

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps { open?: boolean; onClose?: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [popoverId, setPopoverId] = useState<string | null>(null);
  // Anchor rect for the collapsed-mode flyout. The popover is rendered with
  // position:fixed (not absolute) so the nav's overflow-y-auto can't clip it.
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; left: number } | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load collapsed preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    setPopoverId(null);
  }

  // Active section detection
  const activeSectionId = useMemo(() => {
    if (pathname === "/dashboard") return null;
    for (const section of NAV_SECTIONS) {
      if (section.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) return section.id;
    }
    return null;
  }, [pathname]);

  const [expandedId, setExpandedId] = useState<string | null>(activeSectionId);
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      if (activeSectionId) setExpandedId(activeSectionId);
    }
  }, [pathname, activeSectionId]);

  const allHrefs = useMemo(() => NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href)), []);
  function isItemActive(href: string): boolean {
    if (pathname === href) return true;
    const hasChild = allHrefs.some((h) => h !== href && h.startsWith(href + "/"));
    if (hasChild) return false;
    return pathname.startsWith(href + "/");
  }

  // Calendar is a top-level cross-module timeline (not nested under Training).
  // It sits between Progress and AI in the sidebar order.
  const calendarActive = pathname === CALENDAR_HREF || pathname.startsWith(CALENDAR_HREF + "/");
  const sectionsBeforeCalendar = NAV_SECTIONS.filter((s) => ["training", "nutrition", "progress"].includes(s.id));
  const sectionsAfterCalendar = NAV_SECTIONS.filter((s) => ["ai", "account"].includes(s.id));
  function toggleSection(id: string) { setExpandedId((prev) => (prev === id ? null : id)); }
  const handleNavClick = () => { if (onClose) onClose(); setPopoverId(null); };

  // Popover handlers (collapsed mode). We measure the trigger button's on-screen
  // rect and position the flyout with fixed coords → immune to overflow clipping.
  function anchorFromElement(el: HTMLElement | null) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPopoverAnchor({ top: r.top, left: r.right + 8 });
  }
  function openPopover(id: string, el?: HTMLElement | null) {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    if (el) anchorFromElement(el);
    setPopoverId(id);
  }
  function togglePopover(id: string, el: HTMLElement | null) {
    setPopoverId((prev) => {
      if (prev === id) return null;
      anchorFromElement(el);
      return id;
    });
  }
  function scheduleClosePopover() {
    closeTimerRef.current = setTimeout(() => setPopoverId(null), 200);
  }
  function cancelClosePopover() {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
  }

  // Keyboard handler for popover
  function handlePopoverKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, sectionId: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      togglePopover(sectionId, e.currentTarget);
    } else if (e.key === "Escape") {
      setPopoverId(null);
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-100 bg-white transition-all duration-200 ease-in-out",
          "md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-[68px]" : "md:w-60",
          "w-60", // Mobile always full width
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-4">
          {collapsed ? (
            <Link href="/dashboard" onClick={handleNavClick} className="mx-auto text-base font-bold text-zinc-900 transition-opacity hover:opacity-80" title="Dashboard">
              F
            </Link>
          ) : (
            <Link href="/dashboard" onClick={handleNavClick} className="text-base font-bold tracking-tight text-zinc-900 transition-opacity hover:opacity-80">
              FitnessApp
            </Link>
          )}
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 md:hidden" aria-label="Close menu">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            title={collapsed ? "Dashboard" : undefined}
            className={[
              "flex items-center rounded-lg transition-colors",
              collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5 text-sm font-medium",
              pathname === "/dashboard" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            ].join(" ")}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <IconGrid />
            {!collapsed && "Dashboard"}
          </Link>

          {/* Sections */}
          <div className="mt-2 flex flex-col gap-0.5">
            {sectionsBeforeCalendar.map(renderSection)}

            {/* Calendar — top-level cross-module timeline */}
            <Link
              href={CALENDAR_HREF}
              onClick={handleNavClick}
              title={collapsed ? "Calendar" : undefined}
              className={[
                "flex items-center rounded-lg transition-colors",
                collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5 text-sm font-medium",
                calendarActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              ].join(" ")}
              aria-current={calendarActive ? "page" : undefined}
            >
              <IconCalendar />
              {!collapsed && "Calendar"}
            </Link>

            {sectionsAfterCalendar.map(renderSection)}
          </div>
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden border-t border-zinc-100 p-2 md:block">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IconExpand /> : <IconCollapse />}
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );

  // ── Section renderer (shared by before/after Calendar groups) ───────────────
  function renderSection(section: NavSection) {
    const isExpanded = expandedId === section.id;
    const isPopoverOpen = popoverId === section.id;
    const sectionActive = section.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));

    // ── COLLAPSED MODE ──
    if (collapsed) {
      return (
                  <div
                    key={section.id}
                    className="relative"
                    onMouseEnter={(e) => openPopover(section.id, e.currentTarget.querySelector("button"))}
                    onMouseLeave={scheduleClosePopover}
                  >
                    <button
                      type="button"
                      onClick={(e) => togglePopover(section.id, e.currentTarget)}
                      onKeyDown={(e) => handlePopoverKeyDown(e, section.id)}
                      title={section.label}
                      className={[
                        "flex w-full items-center justify-center rounded-lg p-2.5 transition-colors",
                        sectionActive ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                      ].join(" ")}
                      aria-haspopup="true"
                      aria-expanded={isPopoverOpen}
                    >
                      {section.icon}
                    </button>

                    {/* Popover — fixed position so the nav's overflow can't clip it */}
                    {isPopoverOpen && popoverAnchor && (
                      <div
                        className="fixed z-[60] w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                        style={{ top: popoverAnchor.top, left: popoverAnchor.left }}
                        onMouseEnter={cancelClosePopover}
                        onMouseLeave={scheduleClosePopover}
                        role="menu"
                      >
                        <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400">{section.label}</p>
                        {section.items.map((item) => {
                          const active = isItemActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleNavClick}
                              role="menuitem"
                              className={[
                                "flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors",
                                active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                              ].join(" ")}
                            >
                              {item.icon}
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── EXPANDED MODE ──
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      sectionActive && !isExpanded ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                    ].join(" ")}
                    aria-expanded={isExpanded}
                  >
                    {section.icon}
                    <span className="flex-1 text-left">{section.label}</span>
                    <IconChevron open={isExpanded} />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-zinc-100 pl-3">
                      {section.items.map((item) => {
                        const active = isItemActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavClick}
                            className={[
                              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                              active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                            ].join(" ")}
                            aria-current={active ? "page" : undefined}
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
  }
}
