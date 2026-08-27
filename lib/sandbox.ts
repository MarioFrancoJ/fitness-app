/**
 * Sandbox Mode Utilities
 *
 * Architecture:
 * - When sandbox_mode is ON for a user, all data they create gets `is_sandbox: true`
 * - Queries for real metrics always filter with `.eq("is_sandbox", false)`
 * - This keeps test data in the same tables but logically isolated
 *
 * Usage in queries (reading real data):
 *   .eq("is_sandbox", false)
 *
 * Usage when inserting (writing test data):
 *   { ...data, is_sandbox: isSandbox }
 *
 * The SandboxContext provides `isSandbox` boolean for write operations.
 * For read operations, ALWAYS filter with is_sandbox = false regardless of mode,
 * because we never want sandbox data to pollute real metrics.
 */

/**
 * Standard filter to exclude sandbox data from metric queries.
 * Apply this to any Supabase query that feeds into:
 * - Dashboard stats
 * - Calendar activity indicators
 * - Weekly/monthly progress calculations
 * - Analytics and trends
 * - AI coach context
 *
 * Example:
 *   const query = supabase.from("training_sessions").select("...").eq("is_sandbox", false)
 */
export const SANDBOX_FILTER = { column: "is_sandbox", value: false } as const;
