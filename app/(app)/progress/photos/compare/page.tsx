"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import { useDictionary } from "@/lib/i18n/DictionaryProvider";

type PhotoType = "Front" | "Side" | "Back";
const PHOTO_TYPES: PhotoType[] = ["Front", "Side", "Back"];

type PhotosDict = ReturnType<typeof useDictionary>["dict"]["progress"]["photos"];

// Localized label for a photo-type value (value stays the logic/DB key).
// The photoCompare namespace has no type labels, so reuse photos.type* keys.
function photoTypeLabel(type: PhotoType, photos: PhotosDict): string {
  switch (type) {
    case "Front": return photos.typeFront;
    case "Side":  return photos.typeSide;
    case "Back":  return photos.typeBack;
    default:      return type;
  }
}

interface ProgressPhoto {
  id: string;
  photo_type: PhotoType;
  image_url: string;
  weight_kg: number | null;
  upload_date: string;
}

export default function ComparePhotosPage() {
  const { dict } = useDictionary();
  const t = dict.progress.photoCompare;
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [compareType, setCompareType] = useState<PhotoType>("Front");
  const [beforeId, setBeforeId] = useState<string>("");
  const [afterId, setAfterId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("progress_photos")
        .select("id, photo_type, image_url, weight_kg, upload_date")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: true });

      if (data) setPhotos(data as ProgressPhoto[]);
      setLoading(false);
    }
    loadData();
  }, []);

  const typePhotos = useMemo(() => {
    return photos.filter((p) => p.photo_type === compareType);
  }, [photos, compareType]);

  useEffect(() => {
    if (typePhotos.length >= 2) {
      setBeforeId(typePhotos[0].id);
      setAfterId(typePhotos[typePhotos.length - 1].id);
    } else if (typePhotos.length === 1) {
      setBeforeId(typePhotos[0].id);
      setAfterId("");
    } else {
      setBeforeId(""); setAfterId("");
    }
  }, [typePhotos]);

  const beforePhoto = photos.find((p) => p.id === beforeId) ?? null;
  const afterPhoto = photos.find((p) => p.id === afterId) ?? null;

  const daysBetween = beforePhoto && afterPhoto
    ? Math.floor((new Date(afterPhoto.upload_date).getTime() - new Date(beforePhoto.upload_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const weightChange = beforePhoto?.weight_kg && afterPhoto?.weight_kg
    ? afterPhoto.weight_kg - beforePhoto.weight_kg
    : null;

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/progress/photos" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr; {dict.common.back}</Link>
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-900">{t.title}</h1><p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p></div>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20">
          <p className="mb-1 text-base font-semibold text-zinc-900">{t.emptyTitle}</p>
          <p className="mb-6 text-sm text-zinc-500">{t.emptyDescription}</p>
          <Link href="/progress/photos/upload" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700">{t.emptyAction}</Link>
        </div>
      ) : (
        <>
          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 w-fit">
            {PHOTO_TYPES.map((pt) => (<button key={pt} type="button" onClick={() => setCompareType(pt)} className={["rounded-md px-4 py-1.5 text-xs font-semibold transition-colors", compareType === pt ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"].join(" ")}>{photoTypeLabel(pt, dict.progress.photos)}</button>))}
          </div>

          {typePhotos.length < 2 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-zinc-400">{t.needTwo.replace("{type}", photoTypeLabel(compareType, dict.progress.photos)).replace("{n}", String(typePhotos.length))}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label htmlFor="before-select" className="text-xs font-semibold text-zinc-500">{t.beforePhoto}</label><select id="before-select" value={beforeId} onChange={(e) => setBeforeId(e.target.value)} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{typePhotos.map((p) => (<option key={p.id} value={p.id}>{p.upload_date}{p.weight_kg ? ` — ${p.weight_kg} kg` : ""}</option>))}</select></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="after-select" className="text-xs font-semibold text-zinc-500">{t.afterPhoto}</label><select id="after-select" value={afterId} onChange={(e) => setAfterId(e.target.value)} className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">{typePhotos.map((p) => (<option key={p.id} value={p.id}>{p.upload_date}{p.weight_kg ? ` — ${p.weight_kg} kg` : ""}</option>))}</select></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  {beforePhoto ? (<><img src={beforePhoto.image_url} alt={`Before - ${beforePhoto.upload_date}`} className="h-72 w-full object-contain bg-zinc-50" /><div className="p-4"><p className="text-xs font-semibold text-zinc-400 uppercase">{t.before}</p><p className="text-sm font-medium text-zinc-900">{beforePhoto.upload_date}</p>{beforePhoto.weight_kg && <p className="text-xs text-zinc-500">{beforePhoto.weight_kg} kg</p>}</div></>) : (<div className="flex h-72 items-center justify-center bg-zinc-50"><p className="text-sm text-zinc-400">{t.selectBefore}</p></div>)}
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  {afterPhoto ? (<><img src={afterPhoto.image_url} alt={`After - ${afterPhoto.upload_date}`} className="h-72 w-full object-contain bg-zinc-50" /><div className="p-4"><p className="text-xs font-semibold text-zinc-400 uppercase">{t.after}</p><p className="text-sm font-medium text-zinc-900">{afterPhoto.upload_date}</p>{afterPhoto.weight_kg && <p className="text-xs text-zinc-500">{afterPhoto.weight_kg} kg</p>}</div></>) : (<div className="flex h-72 items-center justify-center bg-zinc-50"><p className="text-sm text-zinc-400">{t.selectAfter}</p></div>)}
                </div>
              </div>

              {(daysBetween !== null || weightChange !== null) && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-400">{t.beforeDate}</p><p className="text-sm font-bold text-zinc-900">{beforePhoto?.upload_date ?? "—"}</p></div>
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-400">{t.afterDate}</p><p className="text-sm font-bold text-zinc-900">{afterPhoto?.upload_date ?? "—"}</p></div>
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-400">{t.daysBetween}</p><p className="text-sm font-bold text-blue-600">{daysBetween ?? "—"}</p></div>
                  <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-xs text-zinc-400">{t.weightChange}</p><p className={`text-sm font-bold ${weightChange !== null && weightChange < 0 ? "text-emerald-600" : weightChange !== null && weightChange > 0 ? "text-red-500" : "text-zinc-900"}`}>{weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "—"}</p></div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
