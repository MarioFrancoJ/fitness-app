/**
 * Auth Callback Route Handler
 *
 * Handles OAuth redirects and email confirmation links.
 * Exchanges the authorization code for a session, then redirects.
 *
 * Flow:
 *   1. User clicks OAuth login or email confirmation link
 *   2. Supabase redirects to /auth/callback?code=xxx
 *   3. This handler exchanges the code for a session
 *   4. Redirects to the intended destination
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful code exchange — redirect to intended page
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
