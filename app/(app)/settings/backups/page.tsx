"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import {
  createBackup, loadBackupList, downloadBackup, deleteBackup, validateBackup, restoreFromBackup,
  ALL_CATEGORIES, CATEGORY_LABELS, formatBytes, type BackupMetadata, type ExportCategory, type ValidationResult,
} from "@/lib/data-export";

export default function BackupsPage() {
  const { dict } = useDictionary();
  const t = dict.account.backups;
  const { success: showToast } = useToast();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreContent, setRestoreContent] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [restoreCategories, setRestoreCategories] = useState<Set<ExportCategory>>(new Set(ALL_CATEGORIES));


  useEffect(() => {
    setBackups(loadBackupList());
    setHydrated(true);
  }, []);

  function refresh() { setBackups(loadBackupList()); }

  async function handleCreate() {
    await createBackup();
    refresh();
    showToast(t.toastCreated);
  }

  async function handleDownload(id: string) {
    await downloadBackup(id);
    showToast(t.toastDownloaded);
  }

  function handleDelete(id: string) {
    deleteBackup(id);
    refresh();
    showToast(t.toastDeleted);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setRestoreContent(content);
      const result = validateBackup(content);
      setValidation(result);
      setRestoreCategories(new Set(result.categoriesFound));
    };
    reader.readAsText(file);
  }

  async function handleRestore() {
    if (!restoreContent) return;
    const result = await restoreFromBackup(restoreContent, restoreMode, Array.from(restoreCategories));
    if (result.success) {
      showToast(t.toastRestored.replace("{n}", String(result.restored.length)));
      setShowRestore(false);
      setRestoreContent(null);
      setValidation(null);
    } else {
      showToast(t.toastRestoreFailed);
    }
  }

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowRestore(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
              {t.restoreButton}
            </button>
            <button type="button" onClick={handleCreate}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover">
              {t.createBackup}
            </button>
          </div>
        </div>

        {/* Backup list */}
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16">
            <p className="mb-1 text-sm font-semibold text-zinc-900">{t.emptyTitle}</p>
            <p className="mb-4 text-xs text-zinc-400">{t.emptyDesc}</p>
            <button type="button" onClick={handleCreate} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover">
              {t.createFirstBackup}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {t.backupItemLabel.replace("{date}", new Date(backup.createdAt).toLocaleString())}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                    <span>{formatBytes(backup.fileSize)}</span>
                    <span>v{backup.version}</span>
                    <span>{t.categoriesCount.replace("{n}", String(backup.categoriesIncluded.length))}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleDownload(backup.id)} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">{t.download}</button>
                  <button type="button" onClick={() => handleDelete(backup.id)} className="rounded-md px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">{t.delete}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scheduling info */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs font-medium text-zinc-600">{t.schedulingHeading}</p>
          <p className="mt-1 text-xs text-zinc-400">{t.schedulingNote}</p>
        </div>
      </div>

      {/* Restore Modal */}
      {showRestore && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRestore(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" style={{ maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">{t.restoreModalTitle}</h2>
              <button type="button" onClick={() => { setShowRestore(false); setRestoreContent(null); setValidation(null); }} className="text-zinc-400 hover:text-zinc-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
              </button>
            </div>

            {/* Upload */}
            <div className="mb-4">
              <label htmlFor="restore-file" className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-zinc-400">
                <p className="text-sm font-medium text-zinc-600">{t.uploadBackupFile}</p>
                <p className="text-xs text-zinc-400">{t.fileTypeJson}</p>
                <input id="restore-file" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Validation results */}
            {validation && (
              <div className="mb-4">
                <div className={`rounded-lg p-3 ${validation.valid ? "bg-success-light border border-border-brand" : "bg-red-50 border border-red-200"}`}>
                  <p className={`text-xs font-semibold ${validation.valid ? "text-success" : "text-red-700"}`}>
                    {validation.valid ? t.validBackup : t.invalidBackup}
                  </p>
                  {validation.errors.map((e, i) => <p key={i} className="text-xs text-red-600 mt-1">{e}</p>)}
                  {validation.warnings.map((w, i) => <p key={i} className="text-xs text-amber-600 mt-1">{w}</p>)}
                  {validation.categoriesFound.length > 0 && (
                    <p className="mt-1 text-xs text-zinc-500">{t.categoriesFoundLabel.replace("{list}", validation.categoriesFound.map((c) => dict.account.export.categoryLabels[c] ?? CATEGORY_LABELS[c]).join(", "))}</p>
                  )}
                </div>
              </div>
            )}

            {/* Restore options */}
            {validation?.valid && (
              <>
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-zinc-600">{t.restoreModeHeading}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRestoreMode("merge")}
                      className={["rounded-lg px-4 py-2 text-xs font-semibold", restoreMode === "merge" ? "bg-primary text-white" : "border border-zinc-200 text-zinc-600"].join(" ")}>
                      {t.restoreModeMerge}
                    </button>
                    <button type="button" onClick={() => setRestoreMode("replace")}
                      className={["rounded-lg px-4 py-2 text-xs font-semibold", restoreMode === "replace" ? "bg-primary text-white" : "border border-zinc-200 text-zinc-600"].join(" ")}>
                      {t.restoreModeReplace}
                    </button>
                  </div>
                </div>

                <button type="button" onClick={handleRestore}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
                  {t.restoreDataButton}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
