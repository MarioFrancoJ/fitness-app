// ── Types ─────────────────────────────────────────────────────────────────────

export type PhotoType = "Front" | "Side" | "Back";

export const PHOTO_TYPES: PhotoType[] = ["Front", "Side", "Back"];

export interface ProgressPhoto {
  id: string;
  userId: string;
  uploadDate: string; // ISO date
  photoType: PhotoType;
  imageUrl: string; // base64 data URL
  weight: number | null;
  notes: string;
}

// Future AI preparation structure (not implemented yet)
export interface AIPhotoAnalysis {
  bodyCompositionEstimate: number | null;
  postureScore: number | null;
  transformationScore: number | null;
  notes: string;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "fitnessapp_progress_photos";

export function loadPhotos(): ProgressPhoto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePhotos(photos: ProgressPhoto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

export function addPhoto(photo: Omit<ProgressPhoto, "id" | "userId">): ProgressPhoto {
  const all = loadPhotos();
  const newPhoto: ProgressPhoto = { ...photo, id: crypto.randomUUID(), userId: "current-user" };
  savePhotos([newPhoto, ...all]);
  return newPhoto;
}

export function deletePhoto(id: string) {
  savePhotos(loadPhotos().filter((p) => p.id !== id));
}

export function getPhotoById(id: string): ProgressPhoto | undefined {
  return loadPhotos().find((p) => p.id === id);
}

export function getPhotosByType(type: PhotoType): ProgressPhoto[] {
  return loadPhotos().filter((p) => p.photoType === type).sort((a, b) => a.uploadDate.localeCompare(b.uploadDate));
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getPhotoStats() {
  const photos = loadPhotos();
  const sorted = [...photos].sort((a, b) => a.uploadDate.localeCompare(b.uploadDate));
  const firstPhoto = sorted[0] ?? null;
  const latestPhoto = sorted[sorted.length - 1] ?? null;

  const totalDays = firstPhoto && latestPhoto
    ? Math.floor((new Date(latestPhoto.uploadDate).getTime() - new Date(firstPhoto.uploadDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const weightDiff = firstPhoto?.weight && latestPhoto?.weight
    ? latestPhoto.weight - firstPhoto.weight
    : null;

  return {
    totalPhotos: photos.length,
    firstDate: firstPhoto?.uploadDate ?? null,
    latestDate: latestPhoto?.uploadDate ?? null,
    latestWeight: latestPhoto?.weight ?? null,
    totalDays,
    weightDiff,
  };
}

// ── Achievements ──────────────────────────────────────────────────────────────

export interface PhotoAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export function getPhotoAchievements(): PhotoAchievement[] {
  const stats = getPhotoStats();
  return [
    { id: "first-photo", title: "First Progress Photo", description: "Uploaded your first progress photo", unlocked: stats.totalPhotos >= 1, icon: "📸" },
    { id: "30-days", title: "30 Days Tracking", description: "Tracking progress for 30 days", unlocked: stats.totalDays >= 30, icon: "📅" },
    { id: "90-days", title: "90 Days Tracking", description: "Tracking progress for 90 days", unlocked: stats.totalDays >= 90, icon: "🏅" },
    { id: "180-days", title: "180 Days Tracking", description: "Tracking progress for 180 days", unlocked: stats.totalDays >= 180, icon: "⭐" },
    { id: "1-year", title: "1 Year Tracking", description: "Tracking progress for a full year", unlocked: stats.totalDays >= 365, icon: "🏆" },
  ];
}
