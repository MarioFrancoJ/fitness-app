/**
 * Seeds the SUPER_ADMIN account if it doesn't exist.
 * Call this on app initialization (e.g., in root layout or login page).
 *
 * Credentials:
 *   Email: admin@fitnessapp.com
 *   Password: Admin123!
 *   Role: SUPER_ADMIN
 */

const ADMIN_KEY = "fitnessapp_admin";

const SUPER_ADMIN = {
  name: "Super Admin",
  email: "admin@fitnessapp.com",
  password: "Admin123!",
  role: "SUPER_ADMIN",
  createdAt: "2024-01-01T00:00:00.000Z",
};

export function seedSuperAdmin() {
  try {
    const existing = localStorage.getItem(ADMIN_KEY);
    if (!existing) {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(SUPER_ADMIN));
    }
  } catch {
    // localStorage unavailable
  }
}

export function getSuperAdmin() {
  try {
    const stored = localStorage.getItem(ADMIN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
