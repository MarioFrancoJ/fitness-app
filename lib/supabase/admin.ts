/**
 * Supabase Admin Client
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY — bypasses RLS completely.
 * ONLY use in server-side code (Route Handlers, Server Actions, scripts).
 * NEVER import in Client Components or expose to the browser.
 *
 * Use cases:
 *   - Admin operations (user management, role changes)
 *   - Stripe webhook handler (updating subscriptions)
 *   - Background jobs
 *   - Data migration scripts
 *
 * Usage:
 *   import { createAdminClient } from "@/lib/supabase/admin";
 *   const supabase = createAdminClient();
 *   const { data } = await supabase.from("users").select("*"); // all users, no RLS
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. " +
        "This client can only be used server-side."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
