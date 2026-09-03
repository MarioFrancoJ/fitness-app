import { describe, it, expect } from "vitest";
import { getDictionary } from "./getDictionary";
import { isValidLocale, defaultLocale, locales, type Locale } from "./config";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

// Mirrors the resolution used by getLocaleCookie(): a cookie value is only
// honored if it is a supported locale, otherwise fall back to the default.
function resolveLocale(cookieValue: string | undefined): Locale {
  return isValidLocale(cookieValue ?? "") ? (cookieValue as Locale) : defaultLocale;
}

// Recursively collect "path -> value" for every leaf string in a dictionary.
function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
    }
  } else if (typeof obj === "string") {
    out[prefix] = obj;
  }
  return out;
}

describe("i18n locale resolution", () => {
  it("supports exactly en and es", () => {
    expect([...locales]).toEqual(["en", "es"]);
  });

  it("honors a valid locale cookie", () => {
    expect(resolveLocale("es")).toBe("es");
    expect(resolveLocale("en")).toBe("en");
  });

  it("falls back to the default locale for missing/invalid cookies", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("")).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale("EN")).toBe("en"); // case-sensitive by design
  });
});

describe("getDictionary returns the correct language", () => {
  it("loads the English dictionary for 'en'", async () => {
    const dict = await getDictionary("en");
    expect(dict.nav.dashboard).toBe("Dashboard");
    expect(dict.common.save).toBe("Save");
  });

  it("loads the Spanish dictionary for 'es'", async () => {
    const dict = await getDictionary("es");
    expect(dict.common.save).toBe("Guardar");
    expect(dict.nav.sections.nutrition).toBe("Nutrición");
  });
});

describe("EN ↔ ES actually changes the visible copy", () => {
  it("switching locale changes the nutrition/recipes strings the user reported", async () => {
    const enDict = await getDictionary("en");
    const esDict = await getDictionary("es");

    // The exact strings from the user's screenshot.
    expect(enDict.nutrition.recipes.available).toBe("{n} recipes available");
    expect(esDict.nutrition.recipes.available).toBe("{n} recetas disponibles");

    expect(enDict.nutrition.recipes.searchPlaceholder).toBe("Search recipes...");
    expect(esDict.nutrition.recipes.searchPlaceholder).toBe("Buscar recetas...");

    expect(enDict.nutrition.recipes.view).toBe("View");
    expect(esDict.nutrition.recipes.view).toBe("Ver");

    expect(enDict.nutrition.recipes.addMealPlan).toBe("+ Meal Plan");
    expect(esDict.nutrition.recipes.addMealPlan).toBe("+ Plan de comidas");
  });

  it("public landing/auth copy differs between languages", async () => {
    const enDict = await getDictionary("en");
    const esDict = await getDictionary("es");

    expect(enDict.hero.headlinePrefix).not.toBe(esDict.hero.headlinePrefix);
    expect(enDict.auth.login.signInButton).toBe("Sign In");
    expect(esDict.auth.login.signInButton).toBe("Iniciar sesión");
  });

  it("the vast majority of leaf strings differ between EN and ES", async () => {
    const enFlat = flatten(await getDictionary("en"));
    const esFlat = flatten(await getDictionary("es"));

    const keys = Object.keys(enFlat);
    const identical = keys.filter((k) => enFlat[k] === esFlat[k]);

    // Some leaves are intentionally identical (brand, acronyms, token-only
    // strings, data examples). Everything else must be translated, so the
    // overlap has to stay small.
    expect(identical.length).toBeLessThan(keys.length * 0.05);
  });
});

describe("en.json and es.json stay structurally identical", () => {
  it("has the same set of keys in both files", () => {
    const enKeys = Object.keys(flatten(en)).sort();
    const esKeys = Object.keys(flatten(es)).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it("keeps interpolation tokens consistent across languages", () => {
    const enFlat = flatten(en);
    const esFlat = flatten(es);
    const tokenRe = /\{[^}]+\}/g;

    for (const key of Object.keys(enFlat)) {
      const enTokens = (enFlat[key].match(tokenRe) ?? []).sort();
      const esTokens = (esFlat[key].match(tokenRe) ?? []).sort();
      expect(esTokens, `token mismatch at "${key}"`).toEqual(enTokens);
    }
  });
});
