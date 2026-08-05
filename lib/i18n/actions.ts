"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isValidLocale, type Locale } from "./config";

const LOCALE_COOKIE = "locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Server Action — persist the chosen locale in a cookie and revalidate
 * the current page so the new language takes effect immediately.
 */
export async function setLocaleCookie(locale: Locale, redirectPath = "/") {
  if (!isValidLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath(redirectPath, "layout");
}

/**
 * Read the active locale from the cookie (server-side).
 * Falls back to 'en' if the cookie is absent or invalid.
 */
export async function getLocaleCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isValidLocale(value ?? "") ? (value as Locale) : "en";
}
