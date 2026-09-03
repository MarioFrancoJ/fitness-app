/**
 * Supabase Middleware Helper
 *
 * Creates a Supabase client configured for Next.js middleware context.
 * Handles cookie reading/writing on the request/response pair.
 * Used exclusively by the root middleware.ts.
 */

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/src/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase env vars are missing, don't crash the whole middleware (which
  // would 500 every request, including public pages). Degrade gracefully by
  // treating the request as unauthenticated. Route guards still apply.
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, supabaseResponse };
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set cookies on the request (for downstream server components)
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Recreate the response with updated request
        supabaseResponse = NextResponse.next({
          request,
        });

        // Set cookies on the response (sent back to browser)
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: Do NOT use getSession() here.
  // getUser() sends a request to the Supabase Auth server to revalidate
  // the token. getSession() only reads from the JWT without validation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}
