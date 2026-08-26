"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { ALL_CATEGORIES, CATEGORY_LABELS, exportAndDownload, getStorageStats, formatBytes, type ExportCategory, type ExportFormat, type StorageStats } from "@/lib/data-export";

export default function ExportPage() {
  const { success: showToast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<Set<ExportCategory>>(new Set(ALL_CATEGORIES));
  const [format, setFormat] = useState<ExportFormat>("json");
  const [stats, setStats] = useState<StorageStats>({ totalRecords: 0, estimatedBytes: 0, backupCount: 0, lastBackupDate: null });
  const [hydrated, setHydrated] = useState(false);


  useEffect(() => {
    getStorageStats().then(setStats);
    setHydrated(true);
  }, []);

  function toggleCategory(cat: ExportCategory) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function selectAll() { setSelectedCategories(new Set(ALL_CATEGORIES)); }
  function selectNone() { setSelectedCategories(new Set()); }

  function handleExport() {
    if (selectedCategories.size === 0) { showToast("Select at least one category"); return; }
    exportAndDownload({
      categories: Array.from(selectedCategories),
      format,
    });
    showToast(`Data exported as ${format.toUpperCase()}`);
  }

  function handleExportAll() {
    exportAndDownload({ categories: ALL_CATEGORIES, format: "json" });
    showToast("All data exported as JSON");
  }

  if (!hydrated) return null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Export Data</h1>
          <p className="mt-1 text-sm text-zinc-500">Download your fitness data in JSON or CSV format.</p>
        </div>

        {/* Storage stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{stats.totalRecords}</p>
            <p className="text-xs text-zinc-400">Total Records</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-blue-600">{formatBytes(stats.estimatedBytes)}</p>
            <p className="text-xs text-zinc-400">Storage Used</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-zinc-900">{stats.backupCount}</p>
            <p className="text-xs text-zinc-400">Backups</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-zinc-900">{stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString() : "Never"}</p>
            <p className="text-xs text-zinc-400">Last Backup</p>
          </div>
        </div>

        {/* Quick export */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-900">Quick Export</p>
            <button type="button" onClick={handleExportAll} className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
              Export All Data (JSON)
            </button>
          </div>
          <p className="text-xs text-zinc-400">Downloads all your fitness data as a single JSON file.</p>
        </div>

        {/* Custom export */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-900">Custom Export</p>

          {/* Categories */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-600">Select Categories</p>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900">Select All</button>
                <button type="button" onClick={selectNone} className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {ALL_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={["rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    selectedCategories.has(cat) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
                  ].join(" ")}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Format & Date range */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-600">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={handleExport}
            className="mt-4 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
            Export Selected
          </button>
        </div>

        {/* Future formats note */}
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs text-zinc-500">PDF and Excel export will be available in a future update. Cloud storage integrations (Google Drive, Dropbox, OneDrive) coming soon.</p>
        </div>
      </div>
    </>
  );
}
