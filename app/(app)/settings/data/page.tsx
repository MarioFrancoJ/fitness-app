"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";
import {
  validateBackup, restoreFromBackup, deleteAllUserData, resetAccountData, exportAndDownload,
  getStorageStats, formatBytes, ALL_CATEGORIES, CATEGORY_LABELS, type ExportCategory, type ValidationResult, type StorageStats,
} from "@/lib/data-export";

export default function DataManagementPage() {
  const { dict } = useDictionary();
  const t = dict.account.data;
  const { success: showToast } = useToast();
  const [stats, setStats] = useState<StorageStats>({ totalRecords: 0, estimatedBytes: 0, backupCount: 0, lastBackupDate: null });
  const [hydrated, setHydrated] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importContent, setImportContent] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);


  useEffect(() => {
    getStorageStats().then(setStats);
    setHydrated(true);
  }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setImportContent(content);
      setValidation(validateBackup(content));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!importContent) return;
    const result = await restoreFromBackup(importContent, importMode);
    if (result.success) {
      showToast(t.toastImported.replace("{n}", String(result.restored.length)));
      setShowImport(false);
      setImportContent(null);
      setValidation(null);
      getStorageStats().then(setStats);
    } else {
      showToast(t.toastImportFailed);
    }
  }

  function handleDownloadAllData() {
    exportAndDownload({ categories: ALL_CATEGORIES, format: "json" });
    showToast(t.toastAllDownloaded);
  }

  async function handleDeleteAll() {
    await deleteAllUserData();
    setShowDeleteConfirm(false);
    getStorageStats().then(setStats);
    showToast(t.toastAllDeleted);
  }

  async function handleReset() {
    await resetAccountData();
    setShowResetConfirm(false);
    getStorageStats().then(setStats);
    showToast(t.toastAccountReset);
  }

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
        </div>

        {/* Storage overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{stats.totalRecords}</p>
            <p className="text-xs text-zinc-400">{t.statRecords}</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-blue-600">{formatBytes(stats.estimatedBytes)}</p>
            <p className="text-xs text-zinc-400">{t.statStorage}</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{stats.backupCount}</p>
            <p className="text-xs text-zinc-400">{t.statBackups}</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-zinc-900">{stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString() : "—"}</p>
            <p className="text-xs text-zinc-400">{t.statLastBackup}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/settings/export" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-zinc-900">{t.linkExportTitle}</p>
            <p className="text-xs text-zinc-400">{t.linkExportDesc}</p>
          </Link>
          <Link href="/settings/backups" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-zinc-900">{t.linkBackupsTitle}</p>
            <p className="text-xs text-zinc-400">{t.linkBackupsDesc}</p>
          </Link>
          <button type="button" onClick={() => setShowImport(true)} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow text-left">
            <p className="text-sm font-semibold text-zinc-900">{t.linkImportTitle}</p>
            <p className="text-xs text-zinc-400">{t.linkImportDesc}</p>
          </button>
        </div>

        {/* Data Privacy */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">{t.privacyHeading}</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">{t.downloadAllTitle}</p>
                <p className="text-xs text-zinc-400">{t.downloadAllDesc}</p>
              </div>
              <button type="button" onClick={handleDownloadAllData} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                {t.downloadButton}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
              <div>
                <p className="text-sm font-medium text-red-900">{t.resetTitle}</p>
                <p className="text-xs text-red-600">{t.resetDesc}</p>
              </div>
              <button type="button" onClick={() => setShowResetConfirm(true)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                {t.resetButton}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <p className="text-sm font-medium text-red-900">{t.deleteAllTitle}</p>
                <p className="text-xs text-red-600">{t.deleteAllDesc}</p>
              </div>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                {t.deleteAllButton}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-zinc-900">{t.importModalTitle}</h2>
            <label htmlFor="import-file" className="mb-4 flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-zinc-400">
              <p className="text-sm font-medium text-zinc-600">{t.uploadJsonFile}</p>
              <input id="import-file" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            {validation && (
              <div className={`mb-4 rounded-lg p-3 ${validation.valid ? "bg-success-light border border-border-brand" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-xs font-semibold ${validation.valid ? "text-success" : "text-red-700"}`}>
                  {validation.valid ? t.validFile : t.invalidFile}
                </p>
                {validation.errors.map((e, i) => <p key={i} className="text-xs text-red-600 mt-1">{e}</p>)}
              </div>
            )}

            {validation?.valid && (
              <>
                <div className="mb-4 flex gap-2">
                  <button type="button" onClick={() => setImportMode("merge")}
                    className={["rounded-lg px-3 py-1.5 text-xs font-semibold", importMode === "merge" ? "bg-primary text-white" : "border border-zinc-200 text-zinc-600"].join(" ")}>
                    {t.importModeMerge}
                  </button>
                  <button type="button" onClick={() => setImportMode("replace")}
                    className={["rounded-lg px-3 py-1.5 text-xs font-semibold", importMode === "replace" ? "bg-primary text-white" : "border border-zinc-200 text-zinc-600"].join(" ")}>
                    {t.importModeReplace}
                  </button>
                </div>
                <button type="button" onClick={handleImport} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
                  {t.importButton}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-bold text-red-900">{t.deleteConfirmTitle}</h2>
            <p className="mb-4 text-sm text-zinc-500">{t.deleteConfirmDesc}</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDeleteAll} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">{t.deleteEverything}</button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">{dict.common.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-bold text-zinc-900">{t.resetConfirmTitle}</h2>
            <p className="mb-4 text-sm text-zinc-500">{t.resetConfirmDesc}</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleReset} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">{t.resetConfirmButton}</button>
              <button type="button" onClick={() => setShowResetConfirm(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">{dict.common.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
