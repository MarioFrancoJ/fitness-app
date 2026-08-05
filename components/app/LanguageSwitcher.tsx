"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import { setLocaleCookie } from "@/lib/i18n/actions";

const labels: Record<Locale, string> = {
  en: "EN",
  es: "ES",
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSwitch(locale: Locale) {
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocaleCookie(locale, pathname);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5"
    >
      {locales.map((locale) => {
        const active = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => handleSwitch(locale)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={`Switch to ${locale === "en" ? "English" : "Spanish"}`}
            className={[
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              "disabled:pointer-events-none disabled:opacity-50",
              active
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900",
            ].join(" ")}
          >
            {labels[locale]}
          </button>
        );
      })}
    </div>
  );
}
