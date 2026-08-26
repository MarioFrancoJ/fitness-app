/**
 * Data Export/Import System — Supabase-backed
 *
 * Exports user data directly from Supabase tables as versioned JSON.
 * Supports importing back into the system.
 * Includes legacy localStorage backup migration adapter.
 */

import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ExportCategory = "profile" | "nutrition" | "workouts" | "progress" | "notifications" | "subscriptions";
export type ExportFormat = "json" | "csv";

export interface ExportOptions {
  categories: ExportCategory[];
  format: ExportFormat;
}

export interface BackupMetadata {
  id: string;
  createdAt: string;
  fileSize: number;
  version: string;
  appVersion: string;
  categoriesIncluded: ExportCategory[];
}

export interface BackupFile {
  metadata: {
    version: string;
    appVersion: string;
    exportedAt: string;
    userId: string;
    categoriesIncluded: ExportCategory[];
  };
  data: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  categoriesFound: ExportCategory[];
  version: string | null;
}

export interface StorageStats {
  totalRecords: number;
  estimatedBytes: number;
  backupCount: number;
  lastBackupDate: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_VERSION = "2.0.0";
const SCHEMA_VERSION = "2";
const BACKUPS_KEY = "app_backups_metadata";
const BACKUP_DATA_PREFIX = "app_backup_";

export const ALL_CATEGORIES: ExportCategory[] = [
  "profile", "nutrition", "workouts", "progress", "notifications", "subscriptions",
];

export const CATEGORY_LABELS: Record<ExportCategory, string> = {
  profile: "Profile & Measurements",
  nutrition: "Nutrition & Meals",
  workouts: "Workouts & Training",
  progress: "Progress & Photos",
  notifications: "Notifications",
  subscriptions: "Subscription",
};

// Category → Supabase table mappings
const CATEGORY_TABLES: Record<ExportCategory, string[]> = {
  profile: ["users", "weight_entries", "measurement_entries"],
  nutrition: ["meal_logs"],
  workouts: ["training_sessions"],
  progress: ["progress_photos"],
  notifications: ["notifications"],
  subscriptions: ["subscriptions"],
};

// ── Export from Supabase ───────────────────────────────────────────────────────

export async function exportData(options: ExportOptions): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const exportedData: Record<string, unknown> = {};

  for (const category of options.categories) {
    const tables = CATEGORY_TABLES[category] || [];
    for (const table of tables) {
      if (table === "users") {
        const { data } = await (supabase as any).from(table).select("*").eq("id", user.id).single();
        if (data) exportedData[table] = data;
      } else {
        const { data } = await (supabase as any).from(table).select("*").eq("user_id", user.id);
        if (data && data.length > 0) exportedData[table] = data;
      }
    }
  }

  const backup: BackupFile = {
    metadata: {
      version: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      userId: user.id,
      categoriesIncluded: options.categories,
    },
    data: exportedData,
  };

  if (options.format === "json") {
    return JSON.stringify(backup, null, 2);
  }

  return convertToCSV(exportedData);
}

function convertToCSV(data: Record<string, unknown>): string {
  const lines: string[] = ["table,index,field,value"];

  for (const [table, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === "object" && item !== null) {
          for (const [field, val] of Object.entries(item as Record<string, unknown>)) {
            const safeVal = String(val ?? "").replace(/"/g, '""');
            lines.push(`"${table}","${idx}","${field}","${safeVal}"`);
          }
        }
      });
    } else if (typeof value === "object" && value !== null) {
      for (const [field, val] of Object.entries(value as Record<string, unknown>)) {
        const safeVal = String(val ?? "").replace(/"/g, '""');
        lines.push(`"${table}","0","${field}","${safeVal}"`);
      }
    }
  }

  return lines.join("\n");
}

// ── Download helpers ──────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAndDownload(options: ExportOptions) {
  const content = await exportData(options);
  const timestamp = new Date().toISOString().slice(0, 10);
  const ext = options.format;
  const mime = options.format === "json" ? "application/json" : "text/csv";
  downloadFile(content, `fitnessapp-export-${timestamp}.${ext}`, mime);
}

// ── Backup Functions (localStorage for backup metadata only) ──────────────────

export function loadBackupList(): BackupMetadata[] {
  try {
    const raw = localStorage.getItem(BACKUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBackupList(list: BackupMetadata[]) {
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(list));
}

export async function createBackup(categories: ExportCategory[] = ALL_CATEGORIES): Promise<BackupMetadata> {
  const content = await exportData({ categories, format: "json" });
  const id = crypto.randomUUID();

  const metadata: BackupMetadata = {
    id,
    createdAt: new Date().toISOString(),
    fileSize: new Blob([content]).size,
    version: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    categoriesIncluded: categories,
  };

  // Store backup data in localStorage (for local retrieval)
  localStorage.setItem(`${BACKUP_DATA_PREFIX}${id}`, content);

  // Update metadata list
  const list = loadBackupList();
  list.unshift(metadata);
  saveBackupList(list);

  return metadata;
}

export function downloadBackup(id: string) {
  const raw = localStorage.getItem(`${BACKUP_DATA_PREFIX}${id}`);
  if (!raw) return;
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(raw, `fitnessapp-backup-${timestamp}.json`, "application/json");
}

export function deleteBackup(id: string) {
  localStorage.removeItem(`${BACKUP_DATA_PREFIX}${id}`);
  const list = loadBackupList().filter((b) => b.id !== id);
  saveBackupList(list);
}

// ── Validate & Restore ────────────────────────────────────────────────────────

// Legacy key → table mapping for old backups
const LEGACY_KEY_TO_TABLE: Record<string, string> = {
  fitnessapp_user: "users",
  user_profile: "users",
  fitnessapp_measurement_history: "measurement_entries",
  measurement_history: "measurement_entries",
  fitnessapp_nutrition_meals: "meal_logs",
  nutrition_meals: "meal_logs",
  fitnessapp_training_sessions: "training_sessions",
  training_sessions: "training_sessions",
  fitnessapp_progress_photos: "progress_photos",
  progress_photos: "progress_photos",
  fitnessapp_notifications: "notifications",
  fitnessapp_daily_checkins: "daily_checkins",
};

export function validateBackup(content: string): ValidationResult {
  const result: ValidationResult = { valid: false, errors: [], warnings: [], categoriesFound: [], version: null };

  try {
    const parsed = JSON.parse(content);

    if (!parsed.metadata && !parsed.version && !parsed.data) {
      result.errors.push("Invalid backup format: missing metadata or data");
      return result;
    }

    const version = parsed.metadata?.version || parsed.version;
    result.version = version || null;

    const data = parsed.data;
    if (!data || typeof data !== "object") {
      result.errors.push("Missing or invalid data field");
      return result;
    }

    // Detect categories — check for both new table names and legacy keys
    const dataKeys = Object.keys(data);
    for (const cat of ALL_CATEGORIES) {
      const tables = CATEGORY_TABLES[cat];
      const hasNewFormat = tables.some((t) => dataKeys.includes(t));
      const hasLegacyFormat = dataKeys.some((k) => {
        const mappedTable = LEGACY_KEY_TO_TABLE[k];
        return mappedTable && tables.includes(mappedTable);
      });
      if (hasNewFormat || hasLegacyFormat) {
        result.categoriesFound.push(cat);
      }
    }

    if (result.categoriesFound.length === 0) {
      result.warnings.push("No recognized data categories found in this backup");
    }

    if (version && version !== SCHEMA_VERSION) {
      result.warnings.push(`Version mismatch: file is v${version}, current is v${SCHEMA_VERSION}. Data will be migrated.`);
    }

    result.valid = result.errors.length === 0;
  } catch {
    result.errors.push("Invalid JSON format");
  }

  return result;
}

export async function restoreFromBackup(content: string, mode: "merge" | "replace", categories?: ExportCategory[]): Promise<{ success: boolean; restored: string[] }> {
  const restored: string[] = [];

  try {
    const parsed = JSON.parse(content);
    const data = parsed.data;
    if (!data) return { success: false, restored };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, restored };

    const allowedTables = new Set<string>();
    const cats = categories || ALL_CATEGORIES;
    for (const cat of cats) {
      for (const table of CATEGORY_TABLES[cat]) {
        allowedTables.add(table);
      }
    }

    for (const [key, value] of Object.entries(data)) {
      // Map legacy keys to table names
      const tableName = LEGACY_KEY_TO_TABLE[key] || key;
      if (!allowedTables.has(tableName)) continue;

      if (tableName === "users" && typeof value === "object" && value !== null) {
        // Profile: update current user's profile
        const profileData = value as Record<string, unknown>;
        const updateFields: Record<string, unknown> = {};
        if (profileData.name) updateFields.name = profileData.name;
        if (profileData.fitness_goal || profileData.fitnessGoal) updateFields.fitness_goal = profileData.fitness_goal || profileData.fitnessGoal;
        if (profileData.gender) updateFields.gender = profileData.gender;
        if (profileData.height_cm || profileData.height) updateFields.height_cm = profileData.height_cm || profileData.height;
        if (profileData.weight_kg || profileData.weight || profileData.currentWeight) updateFields.weight_kg = profileData.weight_kg || profileData.weight || profileData.currentWeight;
        if (profileData.activity_level || profileData.activityLevel) updateFields.activity_level = profileData.activity_level || profileData.activityLevel;

        if (Object.keys(updateFields).length > 0) {
          await (supabase as any).from("users").update(updateFields).eq("id", user.id);
          restored.push("users");
        }
      } else if (Array.isArray(value) && value.length > 0) {
        // Array data: insert rows (skip if they conflict)
        if (mode === "replace") {
          await (supabase as any).from(tableName).delete().eq("user_id", user.id);
        }

        // Insert rows, adding user_id
        const rows = value.map((row: any) => ({
          ...row,
          user_id: user.id,
          id: undefined,
        }));

        // Insert in batches of 50
        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50);
          await (supabase as any).from(tableName).insert(batch);
        }

        restored.push(tableName);
      }
    }

    return { success: true, restored };
  } catch (err) {
    console.error("Restore error:", err);
    return { success: false, restored };
  }
}

// ── Data Privacy ──────────────────────────────────────────────────────────────

export async function deleteAllUserData(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const tables = ALL_CATEGORIES.flatMap((cat) => CATEGORY_TABLES[cat]).filter((t) => t !== "users");
    const uniqueTables = [...new Set(tables)];

    for (const table of uniqueTables) {
      await (supabase as any).from(table).delete().eq("user_id", user.id);
    }

    // Clear local backup storage
    const backups = loadBackupList();
    for (const b of backups) {
      localStorage.removeItem(`${BACKUP_DATA_PREFIX}${b.id}`);
    }
    localStorage.removeItem(BACKUPS_KEY);

    return true;
  } catch {
    return false;
  }
}

export async function resetAccountData(): Promise<boolean> {
  return deleteAllUserData();
}

// ── Storage Stats (from Supabase) ─────────────────────────────────────────────

export async function getStorageStats(): Promise<StorageStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { totalRecords: 0, estimatedBytes: 0, backupCount: 0, lastBackupDate: null };

  let totalRecords = 0;

  const tables = ALL_CATEGORIES.flatMap((cat) => CATEGORY_TABLES[cat]).filter((t) => t !== "users");
  const uniqueTables = [...new Set(tables)];

  for (const table of uniqueTables) {
    const { count } = await (supabase as any).from(table).select("id", { count: "exact", head: true }).eq("user_id", user.id);
    totalRecords += count || 0;
  }

  // Estimate bytes (rough: ~200 bytes per record average)
  const estimatedBytes = totalRecords * 200;

  const backups = loadBackupList();
  const lastBackup = backups.length > 0 ? backups[0].createdAt : null;

  return {
    totalRecords,
    estimatedBytes,
    backupCount: backups.length,
    lastBackupDate: lastBackup,
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
