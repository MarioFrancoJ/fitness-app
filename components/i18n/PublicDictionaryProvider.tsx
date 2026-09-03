"use client";

import { DictionaryProvider } from "@/lib/i18n/DictionaryProvider";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";

interface PublicDictionaryProviderProps {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}

/**
 * Client-side dictionary provider for the public (unauthenticated) experience.
 *
 * Mounted at the root layout so that landing, auth, beta and onboarding pages
 * can consume `useDictionary()`. The authenticated `(app)` and `(admin)` layouts
 * mount their own `DictionaryProvider` deeper in the tree; React context uses the
 * nearest provider, so the inner one wins there — this outer provider only serves
 * routes that are NOT wrapped by those layouts.
 */
export default function PublicDictionaryProvider({
  locale,
  dict,
  children,
}: PublicDictionaryProviderProps) {
  return (
    <DictionaryProvider dict={dict} locale={locale}>
      {children}
    </DictionaryProvider>
  );
}
