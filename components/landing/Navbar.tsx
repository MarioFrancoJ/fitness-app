"use client";

import Link from "next/link";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import LanguageSwitcher from "@/components/app/LanguageSwitcher";

export default function Navbar() {
  const { dict, locale } = useDictionary();
  const nav = dict.nav;
  const common = dict.common;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          {common.appName}
        </span>

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

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 md:block"
          >
            {common.login}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            {common.getStarted}
          </Link>
        </div>
      </div>
    </header>
  );
}
