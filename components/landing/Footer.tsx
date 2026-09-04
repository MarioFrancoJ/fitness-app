"use client";

import Link from "next/link";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

export default function Footer() {
  const { dict } = useDictionary();
  const f = dict.footer;

  // Every link resolves to a real destination (hash section or an existing
  // route). Removed dead entries: News/Changelog, Blog, Careers, Contact.
  const footerLinks = [
    {
      heading: f.columns.product,
      links: [
        { label: f.links.features, href: "#features" },
        { label: f.links.pricing, href: "#pricing" },
        { label: f.links.faq, href: "#faq" },
      ],
    },
    {
      heading: f.columns.company,
      links: [
        { label: f.links.about, href: "#hero" },
      ],
    },
    {
      heading: f.columns.legal,
      links: [
        { label: f.links.privacyPolicy, href: "/privacy" },
        { label: f.links.termsOfService, href: "/terms" },
        { label: f.links.cookiePolicy, href: "/cookies" },
      ],
    },
  ];

  return (
    <footer className="border-t border-zinc-100 bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span className="text-lg font-semibold tracking-tight text-zinc-900">
              {dict.common.appName}
            </span>
            <p className="text-sm leading-relaxed text-zinc-400">
              {f.tagline}
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-8 text-xs text-zinc-400 sm:flex-row">
          <p>{f.copyright.replace("{year}", String(new Date().getFullYear()))}</p>
          <p>{f.builtWith}</p>
        </div>
      </div>
    </footer>
  );
}
