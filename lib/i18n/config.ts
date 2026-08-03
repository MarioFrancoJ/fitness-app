// Supported locales and default locale configuration.
// Add new locales here to extend language support.

export const locales = ['en', 'es'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/**
 * Returns true if the given string is a supported locale.
 */
export function isValidLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
