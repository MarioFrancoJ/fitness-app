"use client";

/**
 * Admin → Sync Recipe Images (SUPER_ADMIN only).
 *
 * Fuzzy-matches files in the public `recipe-images` Storage bucket to recipes
 * and assigns recipes.image_url. Two modes:
 *   - Dry Run: compute & show the report, no DB writes.
 *   - Apply:   write image_url for AUTO-matched recipes (never overwriting an
 *              existing image_url), then re-scan.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageLoader from "@/components/ui/PageLoader";
import Button from "@/components/ui/Button";
import {
  matchImagesToRecipes,
  scorePct,
  AUTO_THRESHOLD,
  REVIEW_THRESHOLD,
  type SyncReport,
  type RecipeInput,
} from "@/lib/recipe-image-sync";

const BUCKET = "recipe-images";

export default function SyncRecipeImagesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);
  const [counts, setCounts] = useState<{ recipes: number; images: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<number | null>(null);

  // ── SUPER_ADMIN gate ────────────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      setAuthorized(profile?.role === "SUPER_ADMIN");
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load recipes + bucket files, build the report (dry run) ──────────────────
  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setApplied(null);

    // Recipes
    const { data: recipesData, error: recErr } = await supabase
      .from("recipes")
      .select("id, name, image_url")
      .order("name");
    if (recErr) { setError(`Could not read recipes: ${recErr.message}`); setScanning(false); return; }

    // Storage files
    const { data: files, error: stErr } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (stErr) { setError(`Could not read the "${BUCKET}" bucket: ${stErr.message}`); setScanning(false); return; }

    const recipes: RecipeInput[] = (recipesData || []).map((r) => ({
      id: r.id,
      name: r.name,
      image_url: r.image_url,
    }));
    // Only real files (skip folder placeholders which have no metadata/id).
    const imageNames = (files || [])
      .filter((f) => f.name && !f.name.startsWith(".") && (f.id || f.metadata))
      .map((f) => f.name);

    setCounts({ recipes: recipes.length, images: imageNames.length });
    setReport(matchImagesToRecipes(recipes, imageNames));
    setScanning(false);
  }, [supabase]);

  useEffect(() => {
    if (authorized) scan();
  }, [authorized, scan]);

  // ── Apply: write image_url for auto matches (never overwrite existing) ───────
  async function handleApply() {
    if (!report || applying) return;
    setApplying(true);
    setError(null);

    let updated = 0;
    for (const row of report.autoMatched) {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(row.imageName);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) continue;
      // Guard again at write-time: only set when image_url is still empty.
      const { error: updErr } = await supabase
        .from("recipes")
        .update({ image_url: publicUrl })
        .eq("id", row.recipeId)
        .is("image_url", null);
      if (updErr) { setError(`Failed updating "${row.recipeName}": ${updErr.message}`); break; }
      updated++;
    }

    setApplied(updated);
    setApplying(false);
    await scan(); // refresh so applied rows move to "skipped (existing)"
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (authorized === null) {
    return <PageLoader text="Verifying permissions..." />;
  }

  if (!authorized) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="text-3xl">🔒</span>
        <h1 className="text-lg font-bold text-zinc-900">SUPER_ADMIN only</h1>
        <p className="text-sm text-zinc-500">
          The Sync Recipe Images tool is restricted to super administrators.
        </p>
        <Link href="/admin" className="text-sm font-medium text-zinc-900 hover:underline">
          &larr; Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sync Recipe Images</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fuzzy-matches files in the <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{BUCKET}</code> bucket to
            recipes. Auto-assigns at ≥{scorePct(AUTO_THRESHOLD)}%, flags {scorePct(REVIEW_THRESHOLD)}–{scorePct(AUTO_THRESHOLD) - 1}% for review.
            Existing images are never overwritten.
          </p>
          {counts && (
            <p className="mt-1 text-xs text-zinc-400">
              {counts.recipes} recipe{counts.recipes !== 1 ? "s" : ""} · {counts.images} image{counts.images !== 1 ? "s" : ""} in bucket
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={scan} disabled={scanning || applying}>
            {scanning ? "Scanning…" : "Preview (Dry Run)"}
          </Button>
          <Button
            onClick={handleApply}
            disabled={scanning || applying || !report || report.autoMatched.length === 0}
          >
            {applying
              ? "Applying…"
              : (report?.autoMatched.length ?? 0) > 0
              ? `Apply & Save ${report?.autoMatched.length} match${report?.autoMatched.length === 1 ? "" : "es"}`
              : "Apply & Save"}
          </Button>
        </div>
      </div>

      {/* Two-step flow explainer — makes it obvious that Preview does NOT save */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <p className="font-semibold">How this works — 2 steps:</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
          <li><strong>Preview (Dry Run)</strong> — shows the matches below. <em>Nothing is saved yet.</em></li>
          <li>
            <strong>Apply &amp; Save</strong> — writes the <span className="font-medium">Auto Matched</span> images to the recipes
            (recipe cards &amp; detail pages update). Existing images are never overwritten.
          </li>
        </ol>
        {report && report.autoMatched.length > 0 && (
          <p className="mt-2 font-medium text-blue-900">
            👉 {report.autoMatched.length} image{report.autoMatched.length === 1 ? " is" : "s are"} ready to save — click <strong>Apply &amp; Save</strong>.
          </p>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      {applied !== null && !error && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          ✓ Applied {applied} image{applied !== 1 ? "s" : ""} to recipes.
        </div>
      )}

      {scanning && !report ? (
        <PageLoader text="Scanning recipes & images..." />
      ) : report ? (
        <div className="flex flex-col gap-6">
          <ReportSection
            title="Auto Matched"
            hint={`Score ≥ ${scorePct(AUTO_THRESHOLD)}% — saved when you click "Apply & Save"`}
            tone="emerald"
            rows={report.autoMatched.map((r) => ({ a: r.recipeName, b: r.imageName, c: `${scorePct(r.score)}%` }))}
            emptyText="No new auto matches (already applied, or no images to assign)."
          />

          <ReportSection
            title="Review Required"
            hint={`Score ${scorePct(REVIEW_THRESHOLD)}–${scorePct(AUTO_THRESHOLD) - 1}% — confirm manually, not applied automatically`}
            tone="amber"
            rows={report.reviewRequired.map((r) => ({ a: r.recipeName, b: r.imageName, c: `${scorePct(r.score)}%` }))}
            emptyText="Nothing needs review."
          />

          {report.skippedExisting.length > 0 && (
            <ReportSection
              title="Skipped — already has an image"
              hint="A confident match exists but image_url is already set (never overwritten)"
              tone="zinc"
              rows={report.skippedExisting.map((r) => ({ a: r.recipeName, b: r.imageName, c: `${scorePct(r.score)}%` }))}
              emptyText=""
            />
          )}

          <ReportSection
            title="Unmatched Recipes"
            hint="No image scored high enough"
            tone="zinc"
            rows={report.unmatchedRecipes.map((r) => ({ a: r.recipeName, b: "—", c: "" }))}
            emptyText="Every recipe found a candidate."
          />

          <ReportSection
            title="Unused Images"
            hint="Bucket files not confidently assigned to any recipe"
            tone="zinc"
            rows={report.unusedImages.map((img) => ({ a: img, b: "", c: "" }))}
            emptyText="All images were used."
            singleColumn
          />
        </div>
      ) : null}
    </div>
  );
}

// ── Report section table ──────────────────────────────────────────────────────

const toneClasses: Record<string, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  zinc: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

function ReportSection({
  title,
  hint,
  tone,
  rows,
  emptyText,
  singleColumn = false,
}: {
  title: string;
  hint: string;
  tone: "emerald" | "amber" | "zinc";
  rows: { a: string; b: string; c: string }[];
  emptyText: string;
  singleColumn?: boolean;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
            {rows.length}
          </span>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        </div>
        <p className="text-xs text-zinc-400">{hint}</p>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm text-zinc-400">{emptyText || "None."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-widest text-zinc-400">
                <th className="px-5 py-2 font-semibold">{singleColumn ? "Image" : "Recipe"}</th>
                {!singleColumn && <th className="px-5 py-2 font-semibold">Image</th>}
                {!singleColumn && <th className="px-5 py-2 text-right font-semibold">Score</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-zinc-900">{row.a}</td>
                  {!singleColumn && <td className="px-5 py-2.5 text-zinc-500">{row.b}</td>}
                  {!singleColumn && <td className="px-5 py-2.5 text-right font-semibold text-zinc-700">{row.c}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
