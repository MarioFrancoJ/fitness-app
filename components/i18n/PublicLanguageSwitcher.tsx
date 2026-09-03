"use client";

import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import LanguageSwitcher from "@/components/app/LanguageSwitcher";

/**
 * Language switcher for public pages. Reads the active locale from the
 * dictionary context (provided at the root layout), so it works anywhere in
 * the public tree without threading the locale through as a prop.
 */
export default function PublicLanguageSwitcher() {
  const { locale } = useDictionary();
  return <LanguageSwitcher currentLocale={locale} />;
}
