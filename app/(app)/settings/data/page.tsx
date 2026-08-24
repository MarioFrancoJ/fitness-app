"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  validateBackup, restoreFromBackup, deleteAllUserData, resetAccountData, exportAndDownload,
  getStorageStats, formatBytes, ALL_CATEGORIES, CATEGORY_LABELS, type ExportCategory, type ValidationResult, type StorageStats,
} from "@/lib/data-export";

export default function DataManagementPage() {
  const [stats, setStats] = useState<StorageStats>({ totalRecords: 0, estimatedBytes: 0, backupCount: 0, lastBackupDate: null });
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importContent, setImportContent] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    setStats(getStorageStats());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(dismissToast, 3000); return () => clearTimeout(t); }
  }, [toast, dismissToast]);

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

  function handleImport() {
    if (!importContent) return;
    const result = restoreFromBackup(importContent, importMode);
    if (result.success) {
      setToast(`Imported ${result.restored.length} data sources`);
      setShowImport(false);
      setImportContent(null);
      setValidation(null);
      setStats(getStorageStats());
    } else {
      setToast("Import failed");
    }
  }

  function handleDownloadAllData() {
    exportAndDownload({ categories: ALL_CATEGORIES, format: "json", dateFrom: null, dateTo: null });
    setToast("All personal data downloaded");
  }

  function handleDeleteAll() {
    deleteAllUserData();
    setShowDeleteConfirm(false);
    setStats(getStorageStats());
    setToast("All personal data deleted");
  }

  function handleReset() {
    resetAccountData();
    setShowResetConfirm(false);
    setStats(getStorageStats());
    setToast("Account data reset");
  }

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Data Management</h1>
          <p className="mt-1 text-sm text-zinc-500">Import, export, and manage your personal data.</p>
        </div>

        {/* Storage overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{stats.totalRecords}</p>
            <p className="text-xs text-zinc-400">Records</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-blue-600">{formatBytes(stats.estimatedBytes)}</p>
            <p className="text-xs text-zinc-400">Storage</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{stats.backupCount}</p>
            <p className="text-xs text-zinc-400">Backups</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-zinc-900">{stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString() : "—"}</p>
            <p className="text-xs text-zinc-400">Last Backup</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/settings/export" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-zinc-900">Export Data</p>
            <p className="text-xs text-zinc-400">Download as JSON or CSV</p>
          </Link>
          <Link href="/settings/backups" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-zinc-900">Backups</p>
            <p className="text-xs text-zinc-400">Create and manage backups</p>
          </Link>
          <button type="button" onClick={() => setShowImport(true)} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow text-left">
            <p className="text-sm font-semibold text-zinc-900">Import Data</p>
            <p className="text-xs text-zinc-400">Upload and import JSON data</p>
          </button>
        </div>

        {/* Data Privacy */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">Data Privacy</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">Download All Personal Data</p>
                <p className="text-xs text-zinc-400">Get a complete copy of all your stored data</p>
              </div>
              <button type="button" onClick={handleDownloadAllData} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
                Download
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
              <div>
                <p className="text-sm font-medium text-red-900">Reset Account Data</p>
                <p className="text-xs text-red-600">Clear all data but keep your account</p>
              </div>
              <button type="button" onClick={() => setShowResetConfirm(true)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                Reset
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <p className="text-sm font-medium text-red-900">Delete All Personal Data</p>
                <p className="text-xs text-red-600">Permanently delete all your data. This cannot be undone.</p>
              </div>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                Delete All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-zinc-900">Import Data</h2>
            <label htmlFor="import-file" className="mb-4 flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-zinc-400">
              <p className="text-sm font-medium text-zinc-600">Upload JSON file</p>
              <input id="import-file" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            {validation && (
              <div className={`mb-4 rounded-lg p-3 ${validation.valid ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-xs font-semibold ${validation.valid ? "text-emerald-700" : "text-red-700"}`}>
                  {validation.valid ? "✓ Valid file" : "✗ Invalid file"}
                </p>
                {validation.errors.map((e, i) => <p key={i} className="text-xs text-red-600 mt-1">{e}</p>)}
              </div>
            )}

            {validation?.valid && (
              <>
                <div className="mb-4 flex gap-2">
                  <button type="button" onClick={() => setImportMode("merge")}
                    className={["rounded-lg px-3 py-1.5 text-xs font-semibold", importMode === "merge" ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600"].join(" ")}>
                    Merge
                  </button>
                  <button type="button" onClick={() => setImportMode("replace")}
                    className={["rounded-lg px-3 py-1.5 text-xs font-semibold", importMode === "replace" ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600"].join(" ")}>
                    Replace
                  </button>
                </div>
                <button type="button" onClick={handleImport} className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
                  Import
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
            <h2 className="mb-2 text-lg font-bold text-red-900">Delete All Data?</h2>
            <p className="mb-4 text-sm text-zinc-500">This will permanently delete all your personal data. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDeleteAll} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete Everything</button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-bold text-zinc-900">Reset Account?</h2>
            <p className="mb-4 text-sm text-zinc-500">This will clear all fitness data but keep your login. Consider creating a backup first.</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleReset} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Reset</button>
              <button type="button" onClick={() => setShowResetConfirm(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 shadow-lg">
          <p className="text-sm font-medium text-zinc-800">{toast}</p>
        </div>
      )}
    </>
  );
}
