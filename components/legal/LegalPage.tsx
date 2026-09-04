"use client";

import Link from "next/link";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

type LegalDoc = "privacy" | "terms" | "cookies";

/**
 * Shared renderer for the legal pages (Privacy, Terms, Cookies).
 * Content is fully translated (EN/ES) and read from the `legal` dictionary,
 * so the same component renders any of the three documents. Uses the landing
 * design system (zinc palette, Geist type, max-w container) and is responsive.
 */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  const { dict, locale } = useDictionary();
  const legal = dict.legal;
  const content = legal[doc];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Simple header consistent with the landing navbar */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-80"
          >
            {dict.common.appName}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            {legal.backToHome}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {legal.lastUpdated}: {legal.updatedDate}
          </p>
          <p className="mt-6 text-base leading-relaxed text-zinc-600">
            {content.intro}
          </p>

          <div className="mt-10 flex flex-col gap-8">
            {content.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {section.heading}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-zinc-600">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Cross-links between legal docs */}
          <nav className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-100 pt-8 text-sm">
            {(
              [
                ["privacy", "/privacy", legal.privacy.title],
                ["terms", "/terms", legal.terms.title],
                ["cookies", "/cookies", legal.cookies.title],
              ] as const
            ).map(([key, href, label]) => (
              <Link
                key={key}
                href={href}
                aria-current={key === doc ? "page" : undefined}
                className={
                  key === doc
                    ? "font-semibold text-zinc-900"
                    : "text-zinc-500 transition-colors hover:text-zinc-900"
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </article>
      </main>

      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto max-w-3xl px-6 text-xs text-zinc-400">
          {dict.footer.copyright.replace("{year}", String(new Date().getFullYear()))}
          <span className="sr-only"> ({locale})</span>
        </div>
      </footer>
    </div>
  );
}
