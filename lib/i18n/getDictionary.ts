import type { Locale } from './config'
import en from '@/messages/en.json'

// Import both message files statically so they are bundled at build time.
// Using dynamic import keeps the function async-compatible and lets Next.js
// code-split each locale's JSON.
const dictionaries = {
  en: () => import('@/messages/en.json').then((m) => m.default),
  es: () => import('@/messages/es.json').then((m) => m.default),
} satisfies Record<Locale, () => Promise<unknown>>

/**
 * Load the translation dictionary for the given locale.
 * Call this in Server Components and pass the result down as a prop.
 *
 * @example
 * const dict = await getDictionary(locale)
 * return <Navbar dict={dict.common} />
 */
export async function getDictionary(locale: Locale) {
  const loader = dictionaries[locale]
  return loader() as Promise<Dictionary>
}

// ─── Type derived from the English message file (source of truth) ─────────────
//
// The Dictionary type mirrors the exact shape of messages/en.json. Because it is
// derived from the JSON itself, it never drifts out of sync as keys are added or
// removed. All locale files must share this identical structure.

export type Dictionary = typeof en
