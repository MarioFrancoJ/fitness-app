import type { Locale } from './config'

// Import both message files statically so they are bundled at build time.
// Using dynamic import with a ternary keeps the function async-compatible
// and prevents Next.js from tree-shaking the JSON files.
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

// ─── Type definition mirroring the shape of en.json ───────────────────────────

export type Dictionary = {
  common: {
    appName: string
    login: string
    getStarted: string
    startFree: string
    learnMore: string
  }
  nav: {
    features: string
    pricing: string
    faq: string
  }
  hero: {
    headline: string
    subtitle: string
    badge: string
    stats: {
      activeUsers: string
      workoutsLogged: string
      goalCompletion: string
    }
  }
  features: {
    eyebrow: string
    headline: string
    subtitle: string
    items: {
      workoutPrograms: { title: string; description: string }
      nutritionPlans: { title: string; description: string }
      progressTracking: { title: string; description: string }
      aiCoach: { title: string; description: string }
      mealPlanning: { title: string; description: string }
      analytics: { title: string; description: string }
    }
  }
  pricing: {
    eyebrow: string
    headline: string
    subtitle: string
    mostPopular: string
    plans: {
      basic: { name: string; price: string; period: string; description: string; cta: string }
      pro: { name: string; price: string; period: string; description: string; cta: string }
      elite: { name: string; price: string; period: string; description: string; cta: string }
    }
  }
  faq: {
    eyebrow: string
    headline: string
  }
  footer: {
    tagline: string
    copyright: string
    builtWith: string
    columns: {
      product: string
      company: string
      legal: string
    }
  }
}
