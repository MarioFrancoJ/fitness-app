-- ============================================================================
-- FitnessApp — Recipe → Meal → Meal Plan → Shopping List integration
-- Version: 00010
-- Purpose: Make a recipe the source of truth for meal creation.
--   1. meal_logs.recipe_id  → provenance link when a meal is logged from a recipe
--   2. meal_logs.servings   → how many recipe servings were logged (default 1)
--   3. recipes.meal_type    → optional category (Breakfast/Lunch/Dinner/Snack)
--                             so the Recipes UI can group by meal category.
-- Reuses the existing meal_type enum. All columns are additive & nullable
-- (or defaulted) so existing rows and write paths keep working.
-- ============================================================================

-- ── meal_logs: link to source recipe + servings logged ──────────────────────
ALTER TABLE meal_logs
  ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

ALTER TABLE meal_logs
  ADD COLUMN IF NOT EXISTS servings NUMERIC(6,2) NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_meal_logs_recipe ON meal_logs(recipe_id);

-- ── recipes: optional meal category (for grouping & future filters) ──────────
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS meal_type meal_type;

CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);

COMMENT ON COLUMN meal_logs.recipe_id IS 'Source recipe when this meal was logged from a recipe. NULL for manual entries.';
COMMENT ON COLUMN meal_logs.servings IS 'Number of recipe servings logged. Macros stored on the row already reflect this multiplier.';
COMMENT ON COLUMN recipes.meal_type IS 'Optional meal category (Breakfast/Lunch/Dinner/Snack) for grouping recipes in the UI.';

-- ============================================================================
-- END OF MIGRATION 00010
-- ============================================================================
