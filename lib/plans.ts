/**
 * Movive plans — single source of truth.
 *
 * This module centralizes every non-localized fact about the subscription
 * plans (prices, billing cycles, limits, which plan is highlighted, savings
 * math) so the Landing pricing section, the in-app /pricing page and the
 * /subscription page all render exactly the same numbers and structure.
 *
 * Localized copy (plan display names, feature bullets, descriptions, CTA
 * labels, period labels) lives in the i18n dictionary under
 * `messages.*.pricing.landing`. Consumers resolve text from the dictionary and
 * numbers/config from here — no view hardcodes its own prices anymore.
 *
 * Product decision (official): the public plans are **Free** and **Pro**.
 * Pro is billed monthly ($5.99) or yearly ($49). There is no "Premium" naming
 * in the UI.
 *
 * IMPORTANT — internal IDs vs. display:
 *   The database column `subscriptions.plan` stores technical keys
 *   ("FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY"). Those keys are preserved
 *   for backward compatibility and MUST NOT change. The UI maps them to the
 *   Free / Pro display via this module.
 */

// ── Internal (DB) plan identifiers — do not rename (persisted values) ─────────
export type PlanId = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";

// ── Public-facing plan tiers (what the UI shows) ──────────────────────────────
export type PlanTier = "free" | "pro";

export type BillingCycle = "monthly" | "yearly";

// Dictionary key under `pricing.landing.plans` used to resolve localized copy.
// (basic → Free tier, pro → Pro tier — mirrors the existing landing dictionary.)
export type PlanDictKey = "basic" | "pro";

export interface PlanLimits {
  /** -1 means unlimited. */
  maxRecipes: number;
  maxWorkoutPlans: number;
  maxProgressPhotos: number;
  maxHistoryDays: number;
}

export interface PlanTierConfig {
  tier: PlanTier;
  /** Dictionary key for localized name/description/features/cta. */
  dictKey: PlanDictKey;
  /** Whether this tier is the highlighted / "Most Popular" card. */
  highlighted: boolean;
  /** Monthly price in USD (0 for Free). */
  priceMonthly: number;
  /** Yearly price in USD, total per year (0 for Free; null if no yearly). */
  priceYearly: number | null;
  /** Feature-usage limits enforced for this tier (-1 = unlimited). */
  limits: PlanLimits;
  /** DB id used when this tier is purchased on a given cycle. */
  planIdFor: (cycle: BillingCycle) => PlanId;
}

// ── Official plan configuration (single source of truth) ──────────────────────

export const FREE_LIMITS: PlanLimits = {
  maxRecipes: 10,
  maxWorkoutPlans: 3,
  maxProgressPhotos: 30,
  maxHistoryDays: 90,
};

export const PRO_LIMITS: PlanLimits = {
  maxRecipes: -1,
  maxWorkoutPlans: -1,
  maxProgressPhotos: -1,
  maxHistoryDays: -1,
};

// Official prices (USD). Pro: $5.99/month or $49/year.
export const PRO_PRICE_MONTHLY = 5.99;
export const PRO_PRICE_YEARLY = 49;

export const PLANS: PlanTierConfig[] = [
  {
    tier: "free",
    dictKey: "basic",
    highlighted: false,
    priceMonthly: 0,
    priceYearly: 0,
    limits: FREE_LIMITS,
    planIdFor: () => "FREE",
  },
  {
    tier: "pro",
    dictKey: "pro",
    highlighted: true,
    priceMonthly: PRO_PRICE_MONTHLY,
    priceYearly: PRO_PRICE_YEARLY,
    limits: PRO_LIMITS,
    planIdFor: (cycle) => (cycle === "yearly" ? "PREMIUM_YEARLY" : "PREMIUM_MONTHLY"),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Look up a tier config by its public tier name. */
export function getPlanTier(tier: PlanTier): PlanTierConfig {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0];
}

/**
 * Map a stored DB plan id to its public tier + billing cycle for display.
 * Used by /subscription to render the user's current plan as Free / Pro.
 */
export function tierForPlanId(planId: PlanId): { tier: PlanTier; cycle: BillingCycle | null } {
  switch (planId) {
    case "PREMIUM_MONTHLY": return { tier: "pro", cycle: "monthly" };
    case "PREMIUM_YEARLY":  return { tier: "pro", cycle: "yearly" };
    default:                return { tier: "free", cycle: null };
  }
}

/** Is this stored plan id a paid (Pro) plan? */
export function isPaidPlan(planId: PlanId): boolean {
  return planId === "PREMIUM_MONTHLY" || planId === "PREMIUM_YEARLY";
}

/** Limits for a stored plan id. */
export function limitsForPlanId(planId: PlanId): PlanLimits {
  return isPaidPlan(planId) ? PRO_LIMITS : FREE_LIMITS;
}

/**
 * Real yearly savings % vs. paying monthly for 12 months. Returns null when it
 * can't be computed (e.g. free plan). Drives the "Save up to X%" badge so the
 * headline claim is always accurate and consistent across views.
 */
export function yearlySavingsPct(): number | null {
  const monthly = PRO_PRICE_MONTHLY;
  const yearly = PRO_PRICE_YEARLY;
  if (monthly <= 0) return null;
  const fullYear = monthly * 12;
  if (fullYear <= 0) return null;
  return Math.round(((fullYear - yearly) / fullYear) * 100);
}

/** Approximate monthly price of the yearly plan (e.g. $49/12 ≈ $4.08). */
export function proApproxMonthly(): number {
  return PRO_PRICE_YEARLY / 12;
}

/** Format a USD amount as a price string. 0 → "$0". */
export function formatPrice(amount: number): string {
  if (amount === 0) return "$0";
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}
