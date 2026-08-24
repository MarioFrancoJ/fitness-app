"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addPhoto, PHOTO_TYPES, type PhotoType } from "@/lib/progress-photos-store";

export default function UploadProgressPhotoPage() {
  const router = useRouter();
  const [photoType, setPhotoType] = useState<PhotoType>("Front");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!imageUrl) {
      setError("Please upload a photo.");
      return;
    }

    addPhoto({
      uploadDate: new Date().toISOString().slice(0, 10),
      photoType,
      imageUrl,
      weight: weight ? parseFloat(weight) : null,
      notes: notes.trim(),
    });

    router.push("/progress/photos");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/progress/photos" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">&larr; Back</Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Upload Progress Photo</h1>
          <p className="mt-1 text-sm text-zinc-500">Document your transformation with a new progress photo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Photo</p>

          {/* Image preview / upload area */}
          {imageUrl ? (
            <div className="mb-4 flex flex-col items-center gap-3">
              <img src={imageUrl} alt="Preview" className="h-64 max-w-full rounded-xl object-contain border border-zinc-200" />
              <button type="button" onClick={() => setImageUrl(null)} className="text-xs font-medium text-red-500 hover:text-red-700">
                Remove &amp; re-upload
              </button>
            </div>
          ) : (
            <label htmlFor="photo-input" className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:border-zinc-400 transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="mb-2 h-8 w-8 text-zinc-400" aria-hidden="true">
                <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.97-4.969a.75.75 0 0 0-1.06 0L2.5 11.06Zm12.22-4.81a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-zinc-600">Click to upload a photo</p>
              <p className="text-xs text-zinc-400">JPG, PNG, WebP</p>
              <input id="photo-input" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-zinc-700">Details</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Photo Type */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="photo-type" className="text-sm font-medium text-zinc-700">Photo Type</label>
              <select id="photo-type" value={photoType} onChange={(e) => setPhotoType(e.target.value as PhotoType)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200">
                {PHOTO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="photo-weight" className="text-sm font-medium text-zinc-700">Current Weight (kg)</label>
              <input id="photo-weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="72" step={0.1} min={20} max={500}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="photo-notes" className="text-sm font-medium text-zinc-700">Notes</label>
              <input id="photo-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note"
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
            Save Progress Photo
          </button>
          <Link href="/progress/photos" className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
