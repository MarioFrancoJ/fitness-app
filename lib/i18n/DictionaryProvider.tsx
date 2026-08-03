'use client'

import { createContext, useContext } from 'react'
import type { Dictionary } from './getDictionary'
import type { Locale } from './config'

// ─── Context ──────────────────────────────────────────────────────────────────

type DictionaryContextValue = {
  dict: Dictionary
  locale: Locale
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

type DictionaryProviderProps = {
  dict: Dictionary
  locale: Locale
  children: React.ReactNode
}

/**
 * Wrap a layout or page in this provider to make the dictionary available
 * to all Client Components in the subtree via `useDictionary()`.
 *
 * The `dict` and `locale` values are fetched server-side and serialised
 * into the RSC payload — no client-side fetching is performed.
 *
 * @example
 * // In a Server Component layout:
 * const dict = await getDictionary(locale)
 * return (
 *   <DictionaryProvider dict={dict} locale={locale}>
 *     {children}
 *   </DictionaryProvider>
 * )
 */
export function DictionaryProvider({ dict, locale, children }: DictionaryProviderProps) {
  return (
    <DictionaryContext.Provider value={{ dict, locale }}>
      {children}
    </DictionaryContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the translation dictionary inside any Client Component.
 * Must be used within a `<DictionaryProvider>`.
 *
 * @example
 * 'use client'
 * import { useDictionary } from '@/lib/i18n/DictionaryProvider'
 *
 * export function LoginButton() {
 *   const { dict } = useDictionary()
 *   return <button>{dict.common.login}</button>
 * }
 */
export function useDictionary(): DictionaryContextValue {
  const ctx = useContext(DictionaryContext)
  if (!ctx) {
    throw new Error(
      'useDictionary must be used within a <DictionaryProvider>. ' +
        'Ensure your layout wraps its children with DictionaryProvider.',
    )
  }
  return ctx
}
