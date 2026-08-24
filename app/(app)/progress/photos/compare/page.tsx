"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { loadPhotos, PHOTO_TYPES, type ProgressPhoto, type PhotoType } from "@/lib/progress-photos-store";

export default function ComparePhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [compareType, setCompareType] = useState<PhotoType>("Front");
  const [beforeId, setBeforeId] = useState<string>("");
  const [afterId, setAfterId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPhotos(loadPhotos());
    setHydrated(true);
  }, []);

  const typePhotos = useMemo(() => {
    return photos.filter((p) => p.photoType === compareType).sort((a, b) => a.uploadDate.localeCompare(b.uploadDate));
  }, [photos, compareType]);

  // Auto-select first and last
  useEffect(() => {
    if (typePhotos.length >= 2) {
      setBeforeId(typePhotos[0].id);
      setAfterId(typePhotos[typePhotos.length - 1].id);
    } else if (typePhotos.length === 1) {
      setBeforeId(typePhotos[0].id);
      setAfterId("");
    } else {
      setBeforeId("");
      setAfterId("");
    }
  }, [typePhotos]);

  const beforePhoto = photos.find((p) => p.id === beforeId) ?? null;
  const afterPhoto = photos.find((p) => p.id === afterId) ?? null;

  // Comparison stats
  const daysBetween = beforePhoto && afterPhoto
    ? Math.floor((new Date(afterPhoto.uploadDate).getTime() - new Date(beforePhoto.uploadDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const weightChange = beforePhoto?.weight && afterPhoto?.weight
    ? afterPhoto.weight - beforePhoto.weight
    : null;

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/progress/photos" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr; Back</Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Transformation Comparison</h1>
          <p className="mt-1 text-sm text-zinc-500">Compare your before and after progress photos side by side.</p>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
          <p className="mb-1 text-base font-semibold text-zinc-900">No photos to compare</p>
          <p className="mb-6 text-sm text-zinc-500">Upload at least 2 photos of the same type to compare.</p>
          <Link href="/progress/photos/upload" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">
            Upload Photo
          </Link>
        </div>
      ) : (
        <>
          {/* Type selector */}
          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit">
            {PHOTO_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setCompareType(t)}
                className={["rounded-md px-4 py-1.5 text-xs font-semibold transition-colors", compareType === t ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>
                {t}
              </button>
            ))}
          </div>

          {typePhotos.length < 2 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-zinc-400">
                You need at least 2 &quot;{compareType}&quot; photos to compare. Currently have {typePhotos.length}.
              </p>
            </div>
          ) : (
            <>
              {/* Photo selectors */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="before-select" className="text-xs font-semibold text-zinc-500">Before Photo</label>
                  <select id="before-select" value={beforeId} onChange={(e) => setBeforeId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                    {typePhotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.uploadDate}{p.weight ? ` — ${p.weight} kg` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="after-select" className="text-xs font-semibold text-zinc-500">After Photo</label>
                  <select id="after-select" value={afterId} onChange={(e) => setAfterId(e.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                    {typePhotos.map((p) => (
                      <option key={p.id} value={p.id}>{p.uploadDate}{p.weight ? ` — ${p.weight} kg` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Before */}
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  {beforePhoto ? (
                    <>
                      <img src={beforePhoto.imageUrl} alt={`Before - ${beforePhoto.uploadDate}`} className="h-72 w-full object-contain bg-zinc-50" />
                      <div className="p-4">
                        <p className="text-xs font-semibold text-zinc-400 uppercase">Before</p>
                        <p className="text-sm font-medium text-zinc-900">{beforePhoto.uploadDate}</p>
                        {beforePhoto.weight && <p className="text-xs text-zinc-500">{beforePhoto.weight} kg</p>}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-zinc-50">
                      <p className="text-sm text-zinc-400">Select a before photo</p>
                    </div>
                  )}
                </div>

                {/* After */}
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  {afterPhoto ? (
                    <>
                      <img src={afterPhoto.imageUrl} alt={`After - ${afterPhoto.uploadDate}`} className="h-72 w-full object-contain bg-zinc-50" />
                      <div className="p-4">
                        <p className="text-xs font-semibold text-zinc-400 uppercase">After</p>
                        <p className="text-sm font-medium text-zinc-900">{afterPhoto.uploadDate}</p>
                        {afterPhoto.weight && <p className="text-xs text-zinc-500">{afterPhoto.weight} kg</p>}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-zinc-50">
                      <p className="text-sm text-zinc-400">Select an after photo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison stats */}
              {(daysBetween !== null || weightChange !== null) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-zinc-400">Before Date</p>
                    <p className="text-sm font-bold text-zinc-900">{beforePhoto?.uploadDate ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-zinc-400">After Date</p>
                    <p className="text-sm font-bold text-zinc-900">{afterPhoto?.uploadDate ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-zinc-400">Days Between</p>
                    <p className="text-sm font-bold text-blue-600">{daysBetween ?? "—"}</p>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-zinc-400">Weight Change</p>
                    <p className={`text-sm font-bold ${weightChange !== null && weightChange < 0 ? "text-emerald-600" : weightChange !== null && weightChange > 0 ? "text-red-500" : "text-zinc-900"}`}>
                      {weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "—"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
