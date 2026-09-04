"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { setLocaleCookie } from "@/lib/i18n/actions";

/**
 * Compact, scalable language switcher: a globe + the current locale code and a
 * caret, opening a dropdown that lists every supported locale. Designed as a
 * secondary "utility" control (small, low-contrast) so it never competes with
 * primary CTAs. Scales to any number of locales (renders from `locales`), so it
 * makes no EN/ES-only assumption.
 *
 * Behavior is unchanged from the previous switcher: persist the choice via
 * setLocaleCookie + router.refresh. Only presentation/scalability differ.
 */

// Full names for accessible labels + dropdown rows. Codes fall back to the
// uppercased locale when a name isn't listed, so adding a locale still works.
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  es: "Español",
};

function localeName(locale: string): string {
  return LOCALE_NAMES[locale] ?? locale.toUpperCase();
}

// Flag SVGs live in /public/icons. Falls back to null for locales without one
// (the label/code still identifies the language), keeping this scalable.
const LOCALE_FLAGS: Record<string, string> = {
  en: "/icons/english.svg",
  es: "/icons/spanish.svg",
};

function localeFlag(locale: string): string | null {
  return LOCALE_FLAGS[locale] ?? null;
}

interface LanguageMenuProps {
  currentLocale: Locale;
}

export default function LanguageMenu({ currentLocale }: LanguageMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleSwitch(locale: Locale) {
    setOpen(false);
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocaleCookie(locale, pathname);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Language: ${localeName(currentLocale)}. Change language`}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:opacity-50"
      >
        {/* Flag of the active language (auto-updates when the locale changes) */}
        {localeFlag(currentLocale) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localeFlag(currentLocale) as string} alt="" aria-hidden="true" className="h-4 w-4 rounded-full object-cover" />
        ) : (
          // Fallback globe for locales without a flag asset
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
            <circle cx="10" cy="10" r="7.25" />
            <path d="M2.75 10h14.5M10 2.75c2 2.2 2 12.3 0 14.5M10 2.75c-2 2.2-2 12.3 0 14.5" strokeLinecap="round" />
          </svg>
        )}
        <span className="uppercase">{currentLocale}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select language"
          className="absolute right-0 top-full z-50 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {locales.map((locale) => {
            const active = locale === currentLocale;
            return (
              <button
                key={locale}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => handleSwitch(locale)}
                disabled={isPending}
                className={[
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                  active ? "font-semibold text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  {localeFlag(locale) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={localeFlag(locale) as string} alt="" aria-hidden="true" className="h-4 w-4 rounded-full object-cover" />
                  )}
                  {localeName(locale)}
                </span>
                <span className="text-xs font-medium uppercase text-zinc-400">{locale}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
