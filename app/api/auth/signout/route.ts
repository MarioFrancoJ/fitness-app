/**
 * Sign Out Route Handler
 *
 * POST /api/auth/signout
 *
 * Signs the user out by clearing the Supabase session cookies.
 * Called from client components via fetch or form action.
 * Redirects to /login after successful sign out.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, {
    status: 302,
  });
}
