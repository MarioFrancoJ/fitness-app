// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type UserStatus = "Active" | "Suspended" | "Deleted";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  registrationDate: string;
  lastActivity: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  entity: string;
  date: string;
  details: string;
}

export interface PlatformSettings {
  platformName: string;
  logoUrl: string | null;
  featureToggles: {
    aiCoach: boolean;
    mealPlanner: boolean;
    shoppingLists: boolean;
    progressPhotos: boolean;
    analytics: boolean;
    recommendations: boolean;
  };
}

export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalWorkouts: number;
  totalNutritionEntries: number;
  totalRecipes: number;
  totalExercises: number;
}

export interface RolePermission {
  resource: string;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RoleDefinition {
  role: UserRole;
  label: string;
  permissions: RolePermission[];
}

// ── Storage Keys ──────────────────────────────────────────────────────────────

const USERS_KEY = "fitnessapp_platform_users";
const AUDIT_KEY = "fitnessapp_audit_log";
const SETTINGS_KEY = "fitnessapp_platform_settings";

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_USERS: PlatformUser[] = [
  { id: "u1", name: "Admin User", email: "admin@fitnessapp.com", role: "SUPER_ADMIN", status: "Active", registrationDate: "2024-01-01", lastActivity: "2026-08-24" },
  { id: "u2", name: "John Trainer", email: "john@fitnessapp.com", role: "ADMIN", status: "Active", registrationDate: "2024-02-15", lastActivity: "2026-08-23" },
  { id: "u3", name: "Maria Garcia", email: "maria@example.com", role: "USER", status: "Active", registrationDate: "2024-03-10", lastActivity: "2026-08-22" },
  { id: "u4", name: "Alex Johnson", email: "alex@example.com", role: "USER", status: "Active", registrationDate: "2024-04-05", lastActivity: "2026-08-20" },
  { id: "u5", name: "Sarah Williams", email: "sarah@example.com", role: "USER", status: "Active", registrationDate: "2024-05-12", lastActivity: "2026-08-19" },
  { id: "u6", name: "Mike Brown", email: "mike@example.com", role: "USER", status: "Suspended", registrationDate: "2024-06-01", lastActivity: "2026-07-15" },
  { id: "u7", name: "Emma Davis", email: "emma@example.com", role: "USER", status: "Active", registrationDate: "2024-07-20", lastActivity: "2026-08-24" },
  { id: "u8", name: "Carlos Lopez", email: "carlos@example.com", role: "USER", status: "Active", registrationDate: "2024-08-08", lastActivity: "2026-08-21" },
  { id: "u9", name: "Lisa Chen", email: "lisa@example.com", role: "USER", status: "Active", registrationDate: "2025-01-14", lastActivity: "2026-08-18" },
  { id: "u10", name: "David Kim", email: "david@example.com", role: "USER", status: "Active", registrationDate: "2025-03-22", lastActivity: "2026-08-24" },
  { id: "u11", name: "Ana Torres", email: "ana@example.com", role: "USER", status: "Active", registrationDate: "2025-06-01", lastActivity: "2026-08-23" },
  { id: "u12", name: "James Wilson", email: "james@example.com", role: "USER", status: "Deleted", registrationDate: "2025-07-10", lastActivity: "2026-06-30" },
];

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "FitnessApp",
  logoUrl: null,
  featureToggles: {
    aiCoach: true,
    mealPlanner: true,
    shoppingLists: true,
    progressPhotos: true,
    analytics: true,
    recommendations: true,
  },
};

// ── Users Store ───────────────────────────────────────────────────────────────

export function loadUsers(): PlatformUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  } catch {
    return SEED_USERS;
  }
}

export function saveUsers(users: PlatformUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function updateUser(id: string, data: Partial<PlatformUser>) {
  const users = loadUsers();
  saveUsers(users.map((u) => (u.id === id ? { ...u, ...data } : u)));
  addAuditEntry(`Updated user ${data.name || id}`, "System", `User: ${id}`, JSON.stringify(data));
}

export function suspendUser(id: string) {
  updateUser(id, { status: "Suspended" });
}

export function activateUser(id: string) {
  updateUser(id, { status: "Active" });
}

export function deleteUser(id: string) {
  updateUser(id, { status: "Deleted" });
}

export function changeUserRole(id: string, role: UserRole) {
  const user = loadUsers().find((u) => u.id === id);
  updateUser(id, { role });
  addAuditEntry(`Changed role to ${role}`, "System", `User: ${user?.name || id}`, `New role: ${role}`);
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export function loadAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addAuditEntry(action: string, user: string, entity: string, details: string) {
  const log = loadAuditLog();
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    action,
    user,
    entity,
    date: new Date().toISOString(),
    details,
  };
  log.unshift(entry);
  // Keep last 100 entries
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 100)));
}

// ── Platform Settings ─────────────────────────────────────────────────────────

export function loadSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PlatformSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  addAuditEntry("Updated platform settings", "System", "Platform", "Settings updated");
}

// ── Platform Stats ────────────────────────────────────────────────────────────

export function getPlatformStats(): PlatformStats {
  const users = loadUsers();
  const activeUsers = users.filter((u) => u.status === "Active");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const newThisMonth = users.filter((u) => u.registrationDate >= monthStart);

  // Count from other stores
  let totalWorkouts = 0;
  let totalNutritionEntries = 0;
  let totalRecipes = 0;
  let totalExercises = 0;

  try {
    const sessions = JSON.parse(localStorage.getItem("fitnessapp_training_sessions") || "[]");
    totalWorkouts = sessions.length;
  } catch {}

  try {
    const meals = JSON.parse(localStorage.getItem("fitnessapp_nutrition_meals") || "[]");
    totalNutritionEntries = meals.length;
  } catch {}

  try {
    const recipes = JSON.parse(localStorage.getItem("fitnessapp_recipes") || "[]");
    totalRecipes = recipes.length;
  } catch {}

  try {
    const exercises = JSON.parse(localStorage.getItem("fitnessapp_exercises") || "[]");
    totalExercises = exercises.length;
  } catch {}

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    newUsersThisMonth: newThisMonth.length,
    totalWorkouts,
    totalNutritionEntries,
    totalRecipes,
    totalExercises,
  };
}

// ── Role Definitions ──────────────────────────────────────────────────────────

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "USER",
    label: "User",
    permissions: [
      { resource: "Own Profile", view: true, edit: true, delete: false },
      { resource: "Workouts", view: true, edit: true, delete: true },
      { resource: "Nutrition", view: true, edit: true, delete: true },
      { resource: "Progress", view: true, edit: true, delete: true },
      { resource: "Recipes", view: true, edit: false, delete: false },
      { resource: "Exercises", view: true, edit: false, delete: false },
      { resource: "Admin Panel", view: false, edit: false, delete: false },
      { resource: "Users", view: false, edit: false, delete: false },
      { resource: "Settings", view: false, edit: false, delete: false },
    ],
  },
  {
    role: "ADMIN",
    label: "Admin",
    permissions: [
      { resource: "Own Profile", view: true, edit: true, delete: false },
      { resource: "Workouts", view: true, edit: true, delete: true },
      { resource: "Nutrition", view: true, edit: true, delete: true },
      { resource: "Progress", view: true, edit: true, delete: true },
      { resource: "Recipes", view: true, edit: true, delete: true },
      { resource: "Exercises", view: true, edit: true, delete: true },
      { resource: "Admin Panel", view: true, edit: false, delete: false },
      { resource: "Users", view: true, edit: false, delete: false },
      { resource: "Settings", view: true, edit: false, delete: false },
    ],
  },
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    permissions: [
      { resource: "Own Profile", view: true, edit: true, delete: true },
      { resource: "Workouts", view: true, edit: true, delete: true },
      { resource: "Nutrition", view: true, edit: true, delete: true },
      { resource: "Progress", view: true, edit: true, delete: true },
      { resource: "Recipes", view: true, edit: true, delete: true },
      { resource: "Exercises", view: true, edit: true, delete: true },
      { resource: "Admin Panel", view: true, edit: true, delete: true },
      { resource: "Users", view: true, edit: true, delete: true },
      { resource: "Settings", view: true, edit: true, delete: true },
    ],
  },
];
