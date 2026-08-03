import { defaultLocale, isValidLocale, type Locale } from './config'

/**
 * Resolve the active locale from a URL pathname segment.
 *
 * When the app routes via /[locale]/... segments, call this with
 * the first path segment to get a validated Locale.
 *
 * Falls back to the default locale for unknown or missing values.
 *
 * @example
 * // From a page component params:
 * const locale = getLocaleFromSegment(params.locale)
 */
export function getLocaleFromSegment(segment: string | undefined): Locale {
  if (segment && isValidLocale(segment)) {
    return segment
  }
  return defaultLocale
}

/**
 * Resolve the active locale from an Accept-Language header string.
 *
 * Parses the quality values (q=) and returns the first supported locale
 * that appears in the header. Falls back to the default locale.
 *
 * @example
 * const locale = getLocaleFromHeader(request.headers.get('accept-language'))
 */
export function getLocaleFromHeader(header: string | null): Locale {
  if (!header) return defaultLocale

  // Parse "en-US,en;q=0.9,es;q=0.8" → ['en-US', 'en', 'es']
  const preferred = header
    .split(',')
    .map((entry) => {
      const [tag, q] = entry.trim().split(';q=')
      return { tag: tag.trim(), q: q ? parseFloat(q) : 1.0 }
    })
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag.split('-')[0].toLowerCase()) // e.g. "en-US" → "en"

  for (const lang of preferred) {
    if (isValidLocale(lang)) return lang
  }

  return defaultLocale
}
