// ── Types ─────────────────────────────────────────────────────────────────────

export type ExportCategory = "profile" | "nutrition" | "workouts" | "progress" | "analytics" | "recipes" | "mealPlans" | "shoppingLists" | "notifications" | "recommendations";
export type ExportFormat = "json" | "csv";

// Future formats
export type FutureFormat = "pdf" | "excel";
// Future cloud providers
export type CloudProvider = "google_drive" | "dropbox" | "onedrive" | "aws_s3";

export interface ExportOptions {
  categories: ExportCategory[];
  format: ExportFormat;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface BackupMetadata {
  id: string;
  createdAt: string;
  fileSize: number; // bytes
  version: string;
  appVersion: string;
  categoriesIncluded: ExportCategory[];
}

export interface BackupFile {
  metadata: BackupMetadata;
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

const BACKUPS_KEY = "fitnessapp_backups_metadata";
const BACKUP_DATA_PREFIX = "fitnessapp_backup_";
const APP_VERSION = "1.0.0";
const SCHEMA_VERSION = "1";

export const ALL_CATEGORIES: ExportCategory[] = [
  "profile", "nutrition", "workouts", "progress", "analytics", "recipes", "mealPlans", "shoppingLists", "notifications", "recommendations",
];

export const CATEGORY_LABELS: Record<ExportCategory, string> = {
  profile: "Profile & Measurements",
  nutrition: "Nutrition Logs",
  workouts: "Workouts & Training",
  progress: "Progress Data",
  analytics: "Analytics",
  recipes: "Recipes",
  mealPlans: "Meal Plans",
  shoppingLists: "Shopping Lists",
  notifications: "Notifications",
  recommendations: "Recommendations",
};

// Data source keys mapping
// NOTE: These keys are used for the legacy localStorage backup/export system.
// The app now uses Supabase as the primary data source.
// Old key names preserved in LEGACY_KEY_ALIASES for backward-compatible import.
const CATEGORY_KEYS: Record<ExportCategory, string[]> = {
  profile: ["user_profile", "measurement_history"],
  nutrition: ["nutrition_meals"],
  workouts: ["workouts", "workout_templates", "training_sessions", "active_session"],
  progress: ["progress_photos", "daily_checkins"],
  analytics: ["progress_analytics"],
  recipes: ["recipes", "ingredients"],
  mealPlans: ["weekly_meal_plan", "saved_meal_plans"],
  shoppingLists: ["shopping_list"],
  notifications: ["notifications", "notification_preferences"],
  recommendations: ["recommendations", "recommendation_rules"],
};

// Legacy key aliases for backward-compatible import of old backups
const LEGACY_KEY_ALIASES: Record<string, string> = {
  "fitnessapp_user": "user_profile",
  "fitnessapp_measurement_history": "measurement_history",
  "fitnessapp_nutrition_meals": "nutrition_meals",
  "fitnessapp_workouts": "workouts",
  "fitnessapp_workout_templates": "workout_templates",
  "fitnessapp_training_sessions": "training_sessions",
  "fitnessapp_active_session": "active_session",
  "fitnessapp_progress_photos": "progress_photos",
  "fitnessapp_daily_checkins": "daily_checkins",
  "fitnessapp_progress": "progress_analytics",
  "fitnessapp_recipes": "recipes",
  "fitnessapp_ingredients": "ingredients",
  "fitnessapp_weekly_meal_plan": "weekly_meal_plan",
  "fitnessapp_saved_meal_plans": "saved_meal_plans",
  "fitnessapp_smart_shopping_list": "shopping_list",
  "fitnessapp_notifications": "notifications",
  "fitnessapp_notification_preferences": "notification_preferences",
  "fitnessapp_recommendations": "recommendations",
  "fitnessapp_recommendation_rules": "recommendation_rules",
};

// ── Export Functions ───────────────────────────────────────────────────────────

export function exportData(options: ExportOptions): string {
  const data: Record<string, unknown> = {};

  for (const category of options.categories) {
    const keys = CATEGORY_KEYS[category] || [];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch {
        const raw = localStorage.getItem(key);
        if (raw) data[key] = raw;
      }
    }
  }

  if (options.format === "json") {
    return JSON.stringify({ version: SCHEMA_VERSION, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), categories: options.categories, data }, null, 2);
  }

  // CSV: flatten to rows
  return convertToCSV(data);
}

function convertToCSV(data: Record<string, unknown>): string {
  const lines: string[] = ["category,key,index,field,value"];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        if (typeof item === "object" && item !== null) {
          for (const [field, val] of Object.entries(item as Record<string, unknown>)) {
            const safeVal = String(val ?? "").replace(/"/g, '""');
            lines.push(`"${key}","${key}","${idx}","${field}","${safeVal}"`);
          }
        }
      });
    } else if (typeof value === "object" && value !== null) {
      for (const [field, val] of Object.entries(value as Record<string, unknown>)) {
        const safeVal = String(val ?? "").replace(/"/g, '""');
        lines.push(`"${key}","${key}","0","${field}","${safeVal}"`);
      }
    }
  }

  return lines.join("\n");
}

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

export function exportAndDownload(options: ExportOptions) {
  const content = exportData(options);
  const timestamp = new Date().toISOString().slice(0, 10);
  const ext = options.format;
  const mime = options.format === "json" ? "application/json" : "text/csv";
  downloadFile(content, `fitnessapp-export-${timestamp}.${ext}`, mime);
}

// ── Backup Functions ──────────────────────────────────────────────────────────

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

export function createBackup(categories: ExportCategory[] = ALL_CATEGORIES): BackupMetadata {
  const data: Record<string, unknown> = {};

  for (const category of categories) {
    const keys = CATEGORY_KEYS[category] || [];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) data[key] = JSON.parse(raw);
      } catch {}
    }
  }

  const backupFile: BackupFile = {
    metadata: {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      fileSize: 0,
      version: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      categoriesIncluded: categories,
    },
    data,
  };

  const serialized = JSON.stringify(backupFile);
  backupFile.metadata.fileSize = new Blob([serialized]).size;

  // Store backup data
  localStorage.setItem(`${BACKUP_DATA_PREFIX}${backupFile.metadata.id}`, serialized);

  // Update metadata list
  const list = loadBackupList();
  list.unshift(backupFile.metadata);
  saveBackupList(list);

  return backupFile.metadata;
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

// ── Restore Functions ─────────────────────────────────────────────────────────

export function validateBackup(content: string): ValidationResult {
  const result: ValidationResult = { valid: false, errors: [], warnings: [], categoriesFound: [], version: null };

  try {
    const parsed = JSON.parse(content);

    if (!parsed.metadata && !parsed.version) {
      result.errors.push("Invalid backup format: missing metadata or version");
      return result;
    }

    // Handle both backup files and export files
    const version = parsed.metadata?.version || parsed.version;
    result.version = version;

    if (!version) {
      result.errors.push("Missing schema version");
      return result;
    }

    const data = parsed.data;
    if (!data || typeof data !== "object") {
      result.errors.push("Missing or invalid data field");
      return result;
    }

    // Detect categories (recognize both new keys and legacy fitnessapp_* keys)
    for (const cat of ALL_CATEGORIES) {
      const keys = CATEGORY_KEYS[cat];
      const legacyKeys = Object.values(LEGACY_KEY_ALIASES);
      const allKnownKeys = [...keys, ...Object.keys(LEGACY_KEY_ALIASES).filter((lk) => keys.includes(LEGACY_KEY_ALIASES[lk]))];
      if (allKnownKeys.some((k) => k in data) || keys.some((k) => k in data)) {
        result.categoriesFound.push(cat);
      }
    }

    if (result.categoriesFound.length === 0) {
      result.warnings.push("No recognized data categories found");
    }

    if (version !== SCHEMA_VERSION) {
      result.warnings.push(`Version mismatch: file is v${version}, current is v${SCHEMA_VERSION}`);
    }

    result.valid = result.errors.length === 0;
  } catch (e) {
    result.errors.push("Invalid JSON format");
  }

  return result;
}

export function restoreFromBackup(content: string, mode: "merge" | "replace", categories?: ExportCategory[]): { success: boolean; restored: string[] } {
  const restored: string[] = [];

  try {
    const parsed = JSON.parse(content);
    const data = parsed.data;
    if (!data) return { success: false, restored };

    const allowedKeys = new Set<string>();
    const cats = categories || ALL_CATEGORIES;
    for (const cat of cats) {
      for (const key of CATEGORY_KEYS[cat]) {
        allowedKeys.add(key);
      }
    }

    // Also allow legacy keys and map them to new keys
    const legacyToNew = LEGACY_KEY_ALIASES;

    for (const [key, value] of Object.entries(data)) {
      // Determine the target key (map legacy → new, or use as-is if already new)
      const targetKey = legacyToNew[key] || key;
      if (!allowedKeys.has(targetKey) && !allowedKeys.has(key)) continue;
      const storageKey = allowedKeys.has(targetKey) ? targetKey : key;

      if (mode === "replace") {
        localStorage.setItem(storageKey, JSON.stringify(value));
        restored.push(storageKey);
      } else {
        // Merge: for arrays, concat; for objects, shallow merge
        const existing = localStorage.getItem(storageKey);
        if (!existing) {
          localStorage.setItem(storageKey, JSON.stringify(value));
        } else {
          try {
            const existingData = JSON.parse(existing);
            if (Array.isArray(existingData) && Array.isArray(value)) {
              const merged = [...existingData, ...(value as unknown[])];
              // Deduplicate by id if available
              const seen = new Set();
              const deduped = merged.filter((item) => {
                if (typeof item === "object" && item !== null && "id" in item) {
                  if (seen.has((item as { id: string }).id)) return false;
                  seen.add((item as { id: string }).id);
                }
                return true;
              });
              localStorage.setItem(storageKey, JSON.stringify(deduped));
            } else if (typeof existingData === "object" && typeof value === "object") {
              localStorage.setItem(storageKey, JSON.stringify({ ...existingData, ...(value as object) }));
            } else {
              localStorage.setItem(storageKey, JSON.stringify(value));
            }
          } catch {
            localStorage.setItem(storageKey, JSON.stringify(value));
          }
        }
        restored.push(storageKey);
      }
    }

    return { success: true, restored };
  } catch {
    return { success: false, restored };
  }
}

// ── Data Privacy ──────────────────────────────────────────────────────────────

export function deleteAllUserData() {
  const allKeys = ALL_CATEGORIES.flatMap((cat) => CATEGORY_KEYS[cat]);
  const additionalKeys = ["subscription", "coach_chat", "exercises", "platform_users", "audit_log", "platform_settings"];

  for (const key of [...allKeys, ...additionalKeys]) {
    localStorage.removeItem(key);
  }

  // Also remove any legacy fitnessapp_* keys that may still exist
  const legacyKeys = Object.keys(localStorage).filter((k) => k.startsWith("fitnessapp_"));
  for (const key of legacyKeys) {
    localStorage.removeItem(key);
  }
}

export function resetAccountData() {
  // Remove all app localStorage data (both legacy fitnessapp_* and new neutral keys)
  // Session is managed by Supabase Auth cookies (not localStorage)
  const allKeys = Object.keys(localStorage).filter((k) =>
    k.startsWith("fitnessapp_") ||
    ALL_CATEGORIES.flatMap((cat) => CATEGORY_KEYS[cat]).includes(k)
  );
  for (const key of allKeys) {
    localStorage.removeItem(key);
  }
}

// ── Storage Stats ─────────────────────────────────────────────────────────────

export function getStorageStats(): StorageStats {
  let totalRecords = 0;
  let estimatedBytes = 0;

  // Count both new neutral keys and legacy fitnessapp_* keys
  const allCategoryKeys = ALL_CATEGORIES.flatMap((cat) => CATEGORY_KEYS[cat]);
  const allKeys = Object.keys(localStorage).filter((k) =>
    k.startsWith("fitnessapp_") || allCategoryKeys.includes(k)
  );

  for (const key of allKeys) {
    const val = localStorage.getItem(key);
    if (val) {
      estimatedBytes += val.length * 2; // UTF-16
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) totalRecords += parsed.length;
        else totalRecords += 1;
      } catch {
        totalRecords += 1;
      }
    }
  }

  const backups = loadBackupList();
  const lastBackup = backups.length > 0 ? backups[0].createdAt : null;

  return {
    totalRecords,
    estimatedBytes,
    backupCount: backups.length,
    lastBackupDate: lastBackup,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
