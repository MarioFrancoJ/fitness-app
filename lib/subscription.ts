// ── Types ─────────────────────────────────────────────────────────────────────

export type PlanType = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";
export type SubscriptionStatus = "Active" | "Trial" | "Expired" | "Cancelled" | "Pending";

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate: string | null;
  expirationDate: string | null;
}

export interface PlanFeature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
}

export interface PlanDefinition {
  id: PlanType;
  name: string;
  price: number; // monthly equivalent in USD
  interval: "month" | "year" | null;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  maxRecipes: number;       // -1 = unlimited
  maxWorkoutPlans: number;
  maxProgressPhotos: number;
  maxHistoryDays: number;   // -1 = unlimited
}

export interface UsageStats {
  recipesCreated: number;
  workoutPlansCreated: number;
  progressPhotosUploaded: number;
  historyDays: number;
}

// Future payment integration interfaces
export interface PaymentProvider {
  type: "stripe" | "paypal" | "mercado_pago";
  enabled: boolean;
  publicKey: string | null;
}

export interface PaymentIntent {
  id: string;
  userId: string;
  plan: PlanType;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  provider: PaymentProvider["type"];
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    interval: null,
    features: [
      "Profile Management",
      "Body Measurements",
      "Weight Tracking",
      "Progress Photos (limited)",
      "Basic Nutrition Tracking",
      "Basic Workout Tracking",
    ],
    limits: { maxRecipes: 10, maxWorkoutPlans: 3, maxProgressPhotos: 30, maxHistoryDays: 90 },
  },
  {
    id: "PREMIUM_MONTHLY",
    name: "Premium Monthly",
    price: 9.99,
    interval: "month",
    features: [
      "Everything in Free",
      "Unlimited Recipes",
      "Unlimited Workout Plans",
      "Unlimited Progress Photos",
      "Unlimited History",
      "Advanced Analytics",
      "Meal Planner",
      "Shopping List Generator",
      "Smart Recommendations",
      "AI Coach (Future)",
      "Data Export",
      "Priority Support",
    ],
    limits: { maxRecipes: -1, maxWorkoutPlans: -1, maxProgressPhotos: -1, maxHistoryDays: -1 },
  },
  {
    id: "PREMIUM_YEARLY",
    name: "Premium Yearly",
    price: 7.99, // monthly equivalent (billed $95.88/year)
    interval: "year",
    features: [
      "Everything in Premium Monthly",
      "2 months free",
      "Early access to new features",
    ],
    limits: { maxRecipes: -1, maxWorkoutPlans: -1, maxProgressPhotos: -1, maxHistoryDays: -1 },
  },
];

export const FEATURE_COMPARISON: PlanFeature[] = [
  { name: "Profile Management", free: true, premium: true },
  { name: "Body Measurements", free: true, premium: true },
  { name: "Weight Tracking", free: true, premium: true },
  { name: "Basic Nutrition Tracking", free: true, premium: true },
  { name: "Basic Workout Tracking", free: true, premium: true },
  { name: "Custom Recipes", free: "Up to 10", premium: "Unlimited" },
  { name: "Workout Plans", free: "Up to 3", premium: "Unlimited" },
  { name: "Progress Photos", free: "Up to 30", premium: "Unlimited" },
  { name: "History Retention", free: "90 days", premium: "Unlimited" },
  { name: "Advanced Analytics", free: false, premium: true },
  { name: "Meal Planner", free: false, premium: true },
  { name: "Shopping List Generator", free: false, premium: true },
  { name: "Smart Recommendations", free: false, premium: true },
  { name: "AI Coach", free: false, premium: true },
  { name: "Data Export", free: false, premium: true },
  { name: "Priority Support", free: false, premium: true },
];

// ── Storage ───────────────────────────────────────────────────────────────────

const SUBSCRIPTION_KEY = "fitnessapp_subscription";
const ALL_SUBSCRIPTIONS_KEY = "fitnessapp_all_subscriptions";

export function loadSubscription(): Subscription {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: free plan
  const defaultSub: Subscription = {
    id: crypto.randomUUID(),
    userId: "current-user",
    plan: "FREE",
    status: "Active",
    startDate: new Date().toISOString().slice(0, 10),
    renewalDate: null,
    expirationDate: null,
  };
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSub));
  return defaultSub;
}

export function saveSubscription(sub: Subscription) {
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
}

export function upgradePlan(plan: PlanType) {
  const sub = loadSubscription();
  const now = new Date();
  const renewalDate = new Date(now);
  if (plan === "PREMIUM_MONTHLY") renewalDate.setMonth(now.getMonth() + 1);
  else if (plan === "PREMIUM_YEARLY") renewalDate.setFullYear(now.getFullYear() + 1);

  const updated: Subscription = {
    ...sub,
    plan,
    status: "Active",
    startDate: now.toISOString().slice(0, 10),
    renewalDate: plan !== "FREE" ? renewalDate.toISOString().slice(0, 10) : null,
    expirationDate: null,
  };
  saveSubscription(updated);
  return updated;
}

export function cancelSubscription() {
  const sub = loadSubscription();
  const updated: Subscription = { ...sub, status: "Cancelled", expirationDate: sub.renewalDate };
  saveSubscription(updated);
  return updated;
}

export function downgradeToFree() {
  const sub = loadSubscription();
  const updated: Subscription = { ...sub, plan: "FREE", status: "Active", renewalDate: null, expirationDate: null };
  saveSubscription(updated);
  return updated;
}

export function startTrial(days: number = 7) {
  const sub = loadSubscription();
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(now.getDate() + days);

  const updated: Subscription = {
    ...sub,
    plan: "PREMIUM_MONTHLY",
    status: "Trial",
    startDate: now.toISOString().slice(0, 10),
    renewalDate: null,
    expirationDate: expiry.toISOString().slice(0, 10),
  };
  saveSubscription(updated);
  return updated;
}

// ── Admin: All Subscriptions ──────────────────────────────────────────────────

export function loadAllSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(ALL_SUBSCRIPTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Seed with sample data
  const seed: Subscription[] = [
    { id: "sub-1", userId: "u1", plan: "PREMIUM_YEARLY", status: "Active", startDate: "2025-01-01", renewalDate: "2026-01-01", expirationDate: null },
    { id: "sub-2", userId: "u2", plan: "PREMIUM_MONTHLY", status: "Active", startDate: "2026-07-01", renewalDate: "2026-09-01", expirationDate: null },
    { id: "sub-3", userId: "u3", plan: "FREE", status: "Active", startDate: "2024-03-10", renewalDate: null, expirationDate: null },
    { id: "sub-4", userId: "u4", plan: "PREMIUM_MONTHLY", status: "Cancelled", startDate: "2026-05-01", renewalDate: null, expirationDate: "2026-06-01" },
    { id: "sub-5", userId: "u5", plan: "FREE", status: "Active", startDate: "2024-05-12", renewalDate: null, expirationDate: null },
    { id: "sub-6", userId: "u6", plan: "PREMIUM_MONTHLY", status: "Expired", startDate: "2026-03-01", renewalDate: null, expirationDate: "2026-04-01" },
    { id: "sub-7", userId: "u7", plan: "PREMIUM_YEARLY", status: "Active", startDate: "2026-01-20", renewalDate: "2027-01-20", expirationDate: null },
    { id: "sub-8", userId: "u8", plan: "FREE", status: "Active", startDate: "2024-08-08", renewalDate: null, expirationDate: null },
    { id: "sub-9", userId: "u9", plan: "PREMIUM_MONTHLY", status: "Trial", startDate: "2026-08-20", renewalDate: null, expirationDate: "2026-08-27" },
    { id: "sub-10", userId: "u10", plan: "FREE", status: "Active", startDate: "2025-03-22", renewalDate: null, expirationDate: null },
  ];
  localStorage.setItem(ALL_SUBSCRIPTIONS_KEY, JSON.stringify(seed));
  return seed;
}

export function saveAllSubscriptions(subs: Subscription[]) {
  localStorage.setItem(ALL_SUBSCRIPTIONS_KEY, JSON.stringify(subs));
}

export function adminChangePlan(subId: string, plan: PlanType) {
  const all = loadAllSubscriptions();
  const updated = all.map((s) => (s.id === subId ? { ...s, plan, status: "Active" as SubscriptionStatus } : s));
  saveAllSubscriptions(updated);
}

export function adminGrantPremium(subId: string) {
  adminChangePlan(subId, "PREMIUM_MONTHLY");
}

export function adminRevokePremium(subId: string) {
  const all = loadAllSubscriptions();
  const updated = all.map((s) => (s.id === subId ? { ...s, plan: "FREE" as PlanType, status: "Active" as SubscriptionStatus, renewalDate: null, expirationDate: null } : s));
  saveAllSubscriptions(updated);
}

// ── Feature Gate Service ──────────────────────────────────────────────────────

export function isPremium(): boolean {
  const sub = loadSubscription();
  return (sub.plan === "PREMIUM_MONTHLY" || sub.plan === "PREMIUM_YEARLY") && (sub.status === "Active" || sub.status === "Trial");
}

export function getCurrentLimits(): PlanLimits {
  const sub = loadSubscription();
  const plan = PLAN_DEFINITIONS.find((p) => p.id === sub.plan) ?? PLAN_DEFINITIONS[0];
  return plan.limits;
}

export function canAccessFeature(feature: string): boolean {
  if (isPremium()) return true;
  // Free tier features
  const freeFeatures = ["Profile Management", "Body Measurements", "Weight Tracking", "Basic Nutrition Tracking", "Basic Workout Tracking", "Progress Photos"];
  return freeFeatures.some((f) => feature.toLowerCase().includes(f.toLowerCase()));
}

export function checkLimit(resource: "recipes" | "workoutPlans" | "progressPhotos"): { allowed: boolean; current: number; max: number } {
  const limits = getCurrentLimits();
  const usage = getUsageStats();

  switch (resource) {
    case "recipes": {
      const max = limits.maxRecipes;
      return { allowed: max === -1 || usage.recipesCreated < max, current: usage.recipesCreated, max };
    }
    case "workoutPlans": {
      const max = limits.maxWorkoutPlans;
      return { allowed: max === -1 || usage.workoutPlansCreated < max, current: usage.workoutPlansCreated, max };
    }
    case "progressPhotos": {
      const max = limits.maxProgressPhotos;
      return { allowed: max === -1 || usage.progressPhotosUploaded < max, current: usage.progressPhotosUploaded, max };
    }
  }
}

// ── Usage Tracking ────────────────────────────────────────────────────────────

export function getUsageStats(): UsageStats {
  let recipesCreated = 0;
  let workoutPlansCreated = 0;
  let progressPhotosUploaded = 0;
  let historyDays = 0;

  try { recipesCreated = JSON.parse(localStorage.getItem("fitnessapp_recipes") || "[]").length; } catch {}
  try { workoutPlansCreated = JSON.parse(localStorage.getItem("fitnessapp_workouts") || "[]").length; } catch {}
  try { progressPhotosUploaded = JSON.parse(localStorage.getItem("fitnessapp_progress_photos") || "[]").length; } catch {}
  try {
    const history = JSON.parse(localStorage.getItem("fitnessapp_measurement_history") || "[]");
    if (history.length >= 2) {
      const dates = history.map((h: { date: string }) => h.date).sort();
      const first = new Date(dates[0]);
      const last = new Date(dates[dates.length - 1]);
      historyDays = Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
    }
  } catch {}

  return { recipesCreated, workoutPlansCreated, progressPhotosUploaded, historyDays };
}

// ── Plan Badge ────────────────────────────────────────────────────────────────

export function getPlanBadge(): { label: string; color: string } {
  const sub = loadSubscription();
  if (sub.plan === "FREE") return { label: "FREE", color: "bg-zinc-100 text-zinc-600" };
  if (sub.status === "Trial") return { label: "TRIAL", color: "bg-amber-100 text-amber-700" };
  return { label: "PREMIUM", color: "bg-gradient-to-r from-violet-500 to-purple-600 text-white" };
}
