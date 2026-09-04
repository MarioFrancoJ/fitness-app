"use client";

import Link from "next/link";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import LanguageMenu from "@/components/i18n/LanguageMenu";
import Logo from "@/components/ui/Logo";

export default function Navbar() {
  const { dict, locale } = useDictionary();
  const nav = dict.nav;
  const common = dict.common;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo — full Movive lockup (isologo) linking to the top of the page */}
        <a href="#hero" aria-label={common.appName} className="flex items-center">
          <Logo variant="isologo" className="h-7" priority alt={common.appName} />
        </a>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {nav.features}
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {nav.pricing}
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {nav.faq}
          </a>
        </nav>

        {/* CTA buttons — order: Log In · Get Started (dominant) · language (utility, last) */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 md:block"
          >
            {common.login}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            {common.getStarted}
          </Link>
          {/* Language: secondary utility, least visual weight, sits at the far right */}
          <div className="border-l border-zinc-200 pl-3">
            <LanguageMenu currentLocale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
