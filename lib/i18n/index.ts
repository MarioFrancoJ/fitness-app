// Public API for the i18n module.
// Import from '@/lib/i18n' rather than individual files.

export { locales, defaultLocale, isValidLocale } from './config'
export type { Locale } from './config'

export { getDictionary } from './getDictionary'
export type { Dictionary } from './getDictionary'

export { DictionaryProvider, useDictionary } from './DictionaryProvider'

export { getLocaleFromSegment, getLocaleFromHeader } from './getLocale'
