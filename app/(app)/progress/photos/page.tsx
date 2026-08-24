"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { loadPhotos, getPhotoStats, getPhotoAchievements, PHOTO_TYPES, type ProgressPhoto, type PhotoType, type PhotoAchievement } from "@/lib/progress-photos-store";

type ViewMode = "grid" | "timeline";

export default function ProgressPhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = useState<"All" | PhotoType>("All");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPhotos(loadPhotos());
    setHydrated(true);
  }, []);

  const stats = useMemo(() => getPhotoStats(), [photos]);
  const achievements = useMemo(() => getPhotoAchievements(), [photos]);

  const filtered = useMemo(() => {
    const sorted = [...photos].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
    if (typeFilter === "All") return sorted;
    return sorted.filter((p) => p.photoType === typeFilter);
  }, [photos, typeFilter]);

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Progress Photos</h1>
          <p className="mt-1 text-sm text-zinc-500">Track your visual transformation over time.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/progress/photos/compare" className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">
            Compare
          </Link>
          <Link href="/progress/photos/upload" className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">
            + Upload Photo
          </Link>
        </div>
      </div>

      {photos.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-zinc-400" aria-hidden="true">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.97-4.969a.75.75 0 0 0-1.06 0L2.5 11.06Zm12.22-4.81a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="mb-1 text-base font-semibold text-zinc-900">No progress photos yet</p>
          <p className="mb-6 text-sm text-zinc-500">Upload your first progress photo to start tracking visually.</p>
          <Link href="/progress/photos/upload" className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
            Upload First Progress Photo
          </Link>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-bold text-zinc-900">{stats.totalPhotos}</p>
              <p className="text-xs text-zinc-400">Total Photos</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-bold text-blue-600">{stats.totalDays}</p>
              <p className="text-xs text-zinc-400">Days Tracking</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xl font-bold text-zinc-900">{stats.latestWeight ? `${stats.latestWeight} kg` : "—"}</p>
              <p className="text-xs text-zinc-400">Latest Weight</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className={`text-xl font-bold ${stats.weightDiff !== null && stats.weightDiff < 0 ? "text-emerald-600" : stats.weightDiff !== null && stats.weightDiff > 0 ? "text-red-500" : "text-zinc-900"}`}>
                {stats.weightDiff !== null ? `${stats.weightDiff > 0 ? "+" : ""}${stats.weightDiff.toFixed(1)} kg` : "—"}
              </p>
              <p className="text-xs text-zinc-400">Weight Change</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {(["All", ...PHOTO_TYPES] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTypeFilter(t)}
                  className={["rounded-md px-3 py-1.5 text-xs font-semibold transition-colors", typeFilter === t ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {(["grid", "timeline"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className={["rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors", view === v ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery */}
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  <img src={photo.imageUrl} alt={`${photo.photoType} - ${photo.uploadDate}`} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{photo.photoType}</span>
                      <span className="text-xs text-zinc-400">{photo.uploadDate}</span>
                    </div>
                    {(photo.weight || photo.notes) && (
                      <div className="mt-2 text-xs text-zinc-500">
                        {photo.weight && <span>{photo.weight} kg</span>}
                        {photo.weight && photo.notes && <span> · </span>}
                        {photo.notes && <span>{photo.notes}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((photo) => (
                <div key={photo.id} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <img src={photo.imageUrl} alt={`${photo.photoType} - ${photo.uploadDate}`} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{photo.photoType}</span>
                      <span className="text-xs text-zinc-400">{photo.uploadDate}</span>
                    </div>
                    {photo.weight && <p className="mt-1 text-sm font-medium text-zinc-700">{photo.weight} kg</p>}
                    {photo.notes && <p className="mt-0.5 text-xs text-zinc-400">{photo.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-900">Photo Tracking Achievements</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <div key={a.id} className={["flex items-center gap-3 rounded-lg border p-3", a.unlocked ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-zinc-50 opacity-60"].join(" ")}>
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${a.unlocked ? "text-emerald-900" : "text-zinc-500"}`}>{a.title}</p>
                    <p className="text-[10px] text-zinc-400">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
