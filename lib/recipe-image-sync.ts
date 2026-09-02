/**
 * Recipe image auto-assignment — fuzzy matching core.
 *
 * Pure, dependency-free string similarity + matching. Given the list of recipe
 * names and the list of Storage filenames in the `recipe-images` bucket, it
 * decides which image belongs to which recipe.
 *
 * Design notes:
 *  - Normalization strips accents, extensions, punctuation and lowercases, then
 *    joins tokens with a single "-" so "Arroz con Pollo y Aguacate" and
 *    "Arroz-Pollo-Aguacate.png" compare fairly.
 *  - Similarity is a hybrid of a token Dice coefficient (order-independent, and
 *    tolerant of MISSING words like the dropped "con"/"y") and a normalized
 *    Levenshtein ratio (catches typos / char-level drift). We take the higher
 *    of the two so either signal can carry a confident match.
 *  - Thresholds: >= 0.90 auto-assign, 0.80–0.89 review, < 0.80 ignore.
 */

export const AUTO_THRESHOLD = 0.9;
export const REVIEW_THRESHOLD = 0.8;

// Spanish/English connector words that images commonly drop. They should not
// penalize a match (image "Arroz-Pollo-Aguacate" vs "Arroz con Pollo y Aguacate").
const STOPWORDS = new Set([
  "con", "y", "de", "del", "la", "el", "los", "las", "al", "a", "e", "o", "u",
  "and", "with", "the", "of",
]);

// ── Normalization ─────────────────────────────────────────────────────────────

/** Strip the file extension from a filename (only a trailing known-ish ext). */
export function stripExtension(filename: string): string {
  return filename.replace(/\.[a-z0-9]{2,5}$/i, "");
}

/**
 * Normalize a recipe name or image filename to a canonical dashed slug:
 * lowercase, accents removed, extension removed, non-alphanumerics collapsed to
 * single dashes, trimmed. e.g. "Arroz-Pollo-Aguacate.png" -> "arroz-pollo-aguacate".
 */
export function normalizeName(input: string): string {
  return stripExtension(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents/diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // spaces, underscores, dashes, punctuation -> "-"
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .replace(/-+/g, "-"); // collapse repeats
}

/** Tokenize a normalized slug into meaningful words (stopwords removed). */
export function tokenize(normalized: string): string[] {
  const words = normalized.split("-").filter(Boolean);
  const meaningful = words.filter((w) => !STOPWORDS.has(w));
  // If everything was a stopword (unlikely), fall back to the raw words.
  return meaningful.length > 0 ? meaningful : words;
}

// ── Similarity ──────────────────────────────────────────────────────────────

/** Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 0; i < a.length; i++) {
    curr[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(
        curr[j] + 1, // insertion
        prev[j + 1] + 1, // deletion
        prev[j] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Normalized Levenshtein similarity in [0,1] (1 = identical). */
export function levenshteinRatio(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/**
 * Token Dice coefficient in [0,1] over word sets (order-independent). This is
 * what rescues matches where the image drops connector words: the overlap of
 * meaningful tokens stays high.
 */
export function tokenDice(aTokens: string[], bTokens: string[]): number {
  if (aTokens.length === 0 && bTokens.length === 0) return 1;
  if (aTokens.length === 0 || bTokens.length === 0) return 0;
  const bCounts = new Map<string, number>();
  for (const t of bTokens) bCounts.set(t, (bCounts.get(t) || 0) + 1);
  let intersection = 0;
  for (const t of aTokens) {
    const c = bCounts.get(t);
    if (c && c > 0) {
      intersection++;
      bCounts.set(t, c - 1);
    }
  }
  return (2 * intersection) / (aTokens.length + bTokens.length);
}

/**
 * Overall similarity in [0,1] between a recipe name and an image filename.
 * Takes the max of the slug-level Levenshtein ratio and the token Dice score,
 * so either a char-level or a word-level match can drive confidence.
 */
export function similarity(recipeName: string, imageName: string): number {
  const recSlug = normalizeName(recipeName);
  const imgSlug = normalizeName(imageName);
  if (!recSlug || !imgSlug) return 0;
  if (recSlug === imgSlug) return 1;

  const lev = levenshteinRatio(recSlug, imgSlug);
  const dice = tokenDice(tokenize(recSlug), tokenize(imgSlug));
  return Math.max(lev, dice);
}

// ── Matching ──────────────────────────────────────────────────────────────

export interface RecipeInput {
  id: string;
  name: string;
  image_url: string | null;
}

export interface MatchRow {
  recipeId: string;
  recipeName: string;
  imageName: string;
  score: number; // 0..1
}

export interface SyncReport {
  autoMatched: MatchRow[];      // score >= AUTO_THRESHOLD, recipe had no image
  reviewRequired: MatchRow[];   // REVIEW_THRESHOLD <= score < AUTO_THRESHOLD
  skippedExisting: MatchRow[];  // would auto-match but recipe already has image_url
  unmatchedRecipes: { recipeId: string; recipeName: string }[];
  unusedImages: string[];       // image files not confidently assigned to any recipe
}

/**
 * Match images to recipes and build the full report.
 *
 * Greedy best-match: for each image, find its best-scoring recipe. Each image is
 * used at most once, and each recipe receives at most one image (its best image).
 * Recipes that already have an image_url are reported under `skippedExisting`
 * (never overwritten) rather than `autoMatched`.
 */
export function matchImagesToRecipes(
  recipes: RecipeInput[],
  imageNames: string[]
): SyncReport {
  // Build every candidate pair >= REVIEW_THRESHOLD, then assign greedily by score.
  interface Pair { image: string; recipe: RecipeInput; score: number; }
  const pairs: Pair[] = [];
  for (const image of imageNames) {
    for (const recipe of recipes) {
      const score = similarity(recipe.name, image);
      if (score >= REVIEW_THRESHOLD) pairs.push({ image, recipe, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const usedImages = new Set<string>();
  const assignedRecipes = new Set<string>();

  const autoMatched: MatchRow[] = [];
  const reviewRequired: MatchRow[] = [];
  const skippedExisting: MatchRow[] = [];

  for (const p of pairs) {
    if (usedImages.has(p.image) || assignedRecipes.has(p.recipe.id)) continue;

    const row: MatchRow = {
      recipeId: p.recipe.id,
      recipeName: p.recipe.name,
      imageName: p.image,
      score: p.score,
    };

    if (p.score >= AUTO_THRESHOLD) {
      // Confident match — claim both sides.
      usedImages.add(p.image);
      assignedRecipes.add(p.recipe.id);
      if (p.recipe.image_url) {
        skippedExisting.push(row); // never overwrite an existing image
      } else {
        autoMatched.push(row);
      }
    } else {
      // Review band: surface it but do NOT consume the image/recipe, so a better
      // auto match elsewhere still wins. (Only reported for visibility.)
      reviewRequired.push(row);
    }
  }

  // De-dupe review rows so each recipe/image appears once, and drop any whose
  // recipe or image was ultimately auto-assigned.
  const seenReview = new Set<string>();
  const filteredReview = reviewRequired.filter((r) => {
    if (assignedRecipes.has(r.recipeId) || usedImages.has(r.imageName)) return false;
    const key = `${r.recipeId}|${r.imageName}`;
    if (seenReview.has(key)) return false;
    seenReview.add(key);
    return true;
  });

  const unmatchedRecipes = recipes
    .filter((r) => !assignedRecipes.has(r.id) && !filteredReview.some((rr) => rr.recipeId === r.id))
    .map((r) => ({ recipeId: r.id, recipeName: r.name }));

  const unusedImages = imageNames.filter(
    (img) => !usedImages.has(img) && !filteredReview.some((rr) => rr.imageName === img)
  );

  return {
    autoMatched,
    reviewRequired: filteredReview,
    skippedExisting,
    unmatchedRecipes,
    unusedImages,
  };
}

/** Format a 0..1 score as a percentage integer (e.g. 0.933 -> 93). */
export function scorePct(score: number): number {
  return Math.round(score * 100);
}
