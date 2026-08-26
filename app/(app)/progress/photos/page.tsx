"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type PhotoType = "Front" | "Side" | "Back";
type ViewMode = "grid" | "timeline";

const PHOTO_TYPES: PhotoType[] = ["Front", "Side", "Back"];

interface ProgressPhoto {
  id: string;
  photo_type: PhotoType;
  image_url: string;
  weight_kg: number | null;
  notes: string | null;
  upload_date: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgressPhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [view, setView] = useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = useState<"All" | PhotoType>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("progress_photos")
        .select("id, photo_type, image_url, weight_kg, notes, upload_date")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false });

      if (data) setPhotos(data as ProgressPhoto[]);
      setLoading(false);
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (typeFilter === "All") return photos;
    return photos.filter((p) => p.photo_type === typeFilter);
  }, [photos, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    if (photos.length === 0) return { totalPhotos: 0, totalDays: 0, latestWeight: null, weightDiff: null };
    const sorted = [...photos].sort((a, b) => a.upload_date.localeCompare(b.upload_date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalDays = Math.floor((new Date(last.upload_date).getTime() - new Date(first.upload_date).getTime()) / (1000 * 60 * 60 * 24));
    const weightDiff = first.weight_kg && last.weight_kg ? last.weight_kg - first.weight_kg : null;
    return { totalPhotos: photos.length, totalDays, latestWeight: last.weight_kg, weightDiff };
  }, [photos]);

  // Achievements
  const achievements = useMemo(() => [
    { id: "first-photo", title: "First Progress Photo", description: "Uploaded your first progress photo", unlocked: stats.totalPhotos >= 1, icon: "📸" },
    { id: "30-days", title: "30 Days Tracking", description: "Tracking progress for 30 days", unlocked: stats.totalDays >= 30, icon: "📅" },
    { id: "90-days", title: "90 Days Tracking", description: "Tracking progress for 90 days", unlocked: stats.totalDays >= 90, icon: "🏅" },
    { id: "180-days", title: "180 Days Tracking", description: "Tracking progress for 180 days", unlocked: stats.totalDays >= 180, icon: "⭐" },
    { id: "1-year", title: "1 Year Tracking", description: "Tracking progress for a full year", unlocked: stats.totalDays >= 365, icon: "🏆" },
  ], [stats]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">Progress Photos</h1><p className="mt-1 text-sm text-zinc-500">Track your visual transformation over time.</p></div>
        <div className="flex gap-2">
          <Link href="/progress/photos/compare" className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Compare</Link>
          <Link href="/progress/photos/upload" className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700">+ Upload Photo</Link>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100"><svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-zinc-400" aria-hidden="true"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.97-4.969a.75.75 0 0 0-1.06 0L2.5 11.06Zm12.22-4.81a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd" /></svg></div>
          <p className="mb-1 text-base font-semibold text-zinc-900">No progress photos yet</p>
          <p className="mb-6 text-sm text-zinc-500">Upload your first progress photo to start tracking visually.</p>
          <Link href="/progress/photos/upload" className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">Upload First Progress Photo</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-900">{stats.totalPhotos}</p><p className="text-xs text-zinc-400">Total Photos</p></div>
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-blue-600">{stats.totalDays}</p><p className="text-xs text-zinc-400">Days Tracking</p></div>
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xl font-bold text-zinc-900">{stats.latestWeight ? `${stats.latestWeight} kg` : "—"}</p><p className="text-xs text-zinc-400">Latest Weight</p></div>
            <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className={`text-xl font-bold ${stats.weightDiff !== null && stats.weightDiff < 0 ? "text-emerald-600" : stats.weightDiff !== null && stats.weightDiff > 0 ? "text-red-500" : "text-zinc-900"}`}>{stats.weightDiff !== null ? `${stats.weightDiff > 0 ? "+" : ""}${stats.weightDiff.toFixed(1)} kg` : "—"}</p><p className="text-xs text-zinc-400">Weight Change</p></div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {(["All", ...PHOTO_TYPES] as const).map((t) => (<button key={t} type="button" onClick={() => setTypeFilter(t)} className={["rounded-md px-3 py-1.5 text-xs font-semibold transition-colors", typeFilter === t ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>{t}</button>))}
            </div>
            <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
              {(["grid", "timeline"] as const).map((v) => (<button key={v} type="button" onClick={() => setView(v)} className={["rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors", view === v ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>{v}</button>))}
            </div>
          </div>

          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  <img src={photo.image_url} alt={`${photo.photo_type} - ${photo.upload_date}`} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <div className="flex items-center justify-between"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{photo.photo_type}</span><span className="text-xs text-zinc-400">{photo.upload_date}</span></div>
                    {(photo.weight_kg || photo.notes) && (<div className="mt-2 text-xs text-zinc-500">{photo.weight_kg && <span>{photo.weight_kg} kg</span>}{photo.weight_kg && photo.notes && <span> · </span>}{photo.notes && <span>{photo.notes}</span>}</div>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((photo) => (
                <div key={photo.id} className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <img src={photo.image_url} alt={`${photo.photo_type} - ${photo.upload_date}`} className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2"><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">{photo.photo_type}</span><span className="text-xs text-zinc-400">{photo.upload_date}</span></div>
                    {photo.weight_kg && <p className="mt-1 text-sm font-medium text-zinc-700">{photo.weight_kg} kg</p>}
                    {photo.notes && <p className="mt-0.5 text-xs text-zinc-400">{photo.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-zinc-900">Photo Tracking Achievements</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <div key={a.id} className={["flex items-center gap-3 rounded-lg border p-3", a.unlocked ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-zinc-50 opacity-60"].join(" ")}>
                  <span className="text-xl">{a.icon}</span>
                  <div><p className={`text-xs font-semibold ${a.unlocked ? "text-emerald-900" : "text-zinc-500"}`}>{a.title}</p><p className="text-[10px] text-zinc-400">{a.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
