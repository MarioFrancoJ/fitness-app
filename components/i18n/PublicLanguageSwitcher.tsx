"use client";

import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import LanguageMenu from "@/components/i18n/LanguageMenu";

/**
 * Language switcher for public pages. Reads the active locale from the
 * dictionary context (provided at the root layout), so it works anywhere in
 * the public tree without threading the locale through as a prop.
 *
 * Uses the shared LanguageMenu — the single, global Movive language selector
 * (globe/flag + code + dropdown, scalable to any number of locales).
 */
export default function PublicLanguageSwitcher() {
  const { locale } = useDictionary();
  return <LanguageMenu currentLocale={locale} />;
}
