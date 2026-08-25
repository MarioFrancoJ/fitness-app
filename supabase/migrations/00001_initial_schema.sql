-- ============================================================================
-- FitnessApp — Initial Schema Migration
-- Version: 00001
-- Date: 2026-08-25
-- Target: Supabase PostgreSQL 15+
-- Architecture: Supabase Only (no Prisma)
-- Decisions applied: D1 (denormalized user_id), D4 (PostgreSQL enums)
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: EXTENSIONS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: ENUM TYPES
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Auth & Users ──────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('Active', 'Suspended', 'Deleted');

-- ── Subscriptions ─────────────────────────────────────────────────────────────

CREATE TYPE plan_type AS ENUM ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY');
CREATE TYPE subscription_status AS ENUM ('Active', 'Trial', 'Expired', 'Cancelled', 'Pending');

-- ── Exercises & Workouts ──────────────────────────────────────────────────────

CREATE TYPE exercise_category AS ENUM ('Strength', 'Calisthenics', 'Cardio', 'Mobility', 'Flexibility');
CREATE TYPE muscle_group AS ENUM ('Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core', 'Glutes', 'Quadriceps', 'Hamstrings', 'Calves', 'Full Body');
CREATE TYPE equipment_type AS ENUM ('None', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-Up Bar', 'Machine', 'Kettlebell');
CREATE TYPE exercise_difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');

CREATE TYPE workout_goal AS ENUM ('Fat Loss', 'Muscle Gain', 'Strength', 'Endurance', 'Mobility', 'General Fitness');

-- ── Training Sessions ─────────────────────────────────────────────────────────

CREATE TYPE training_session_status AS ENUM ('In Progress', 'Completed', 'Cancelled');

-- ── Nutrition ─────────────────────────────────────────────────────────────────

CREATE TYPE meal_type AS ENUM ('Breakfast', 'Lunch', 'Dinner', 'Snack');
CREATE TYPE recipe_goal AS ENUM ('Fat Loss', 'Muscle Gain', 'Maintenance');
CREATE TYPE ingredient_category AS ENUM ('Protein', 'Carbohydrate', 'Fat', 'Vegetable', 'Fruit', 'Dairy', 'Beverage', 'Other');

-- ── Notifications ─────────────────────────────────────────────────────────────

CREATE TYPE notification_type AS ENUM ('Workout Reminder', 'Nutrition Reminder', 'Meal Planner Reminder', 'Progress Check-In', 'Achievement', 'Recommendation', 'Subscription', 'System');
CREATE TYPE notification_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE notification_status AS ENUM ('Unread', 'Read', 'Archived');
CREATE TYPE reminder_frequency AS ENUM ('Daily', 'Weekly', 'Monthly', 'Never');

-- ── Progress ──────────────────────────────────────────────────────────────────

CREATE TYPE photo_type AS ENUM ('Front', 'Side', 'Back');

-- ── Recommendations ───────────────────────────────────────────────────────────

CREATE TYPE recommendation_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE recommendation_status AS ENUM ('New', 'Viewed', 'Dismissed', 'Completed');
CREATE TYPE recommendation_category AS ENUM ('Nutrition', 'Training', 'Recovery', 'Weight Management', 'Consistency', 'Motivation', 'Goal Achievement');

-- ── Feedback ──────────────────────────────────────────────────────────────────

CREATE TYPE feedback_type AS ENUM ('Bug Report', 'Feature Request', 'General Feedback');
CREATE TYPE feedback_status AS ENUM ('Open', 'In Progress', 'Closed');

-- ── AI ────────────────────────────────────────────────────────────────────────

CREATE TYPE ai_provider_type AS ENUM ('openai', 'claude', 'gemini', 'local_llm', 'ollama', 'openrouter', 'rule_based');
CREATE TYPE ai_chat_role AS ENUM ('user', 'coach', 'system');

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: UTILITY FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: TABLES — AUTH & USERS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  gender          VARCHAR(20),
  date_of_birth   DATE,
  height_cm       DECIMAL(5,1),
  weight_kg       DECIMAL(5,1),
  activity_level  VARCHAR(50),
  fitness_goal    VARCHAR(50),
  goal_weight_kg  DECIMAL(5,1),
  role            user_role NOT NULL DEFAULT 'USER',
  status          user_status NOT NULL DEFAULT 'Active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 5: TABLES — SUBSCRIPTIONS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            plan_type NOT NULL DEFAULT 'FREE',
  status          subscription_status NOT NULL DEFAULT 'Active',
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  renewal_date    DATE,
  expiration_date DATE,
  stripe_customer_id    VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 6: TABLES — PROGRESS & MEASUREMENTS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE weight_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  weight_kg  DECIMAL(5,1) NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE measurement_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  weight_kg       DECIMAL(5,1),
  neck_cm         DECIMAL(5,1),
  chest_cm        DECIMAL(5,1),
  waist_cm        DECIMAL(5,1),
  hips_cm         DECIMAL(5,1),
  left_arm_cm     DECIMAL(5,1),
  right_arm_cm    DECIMAL(5,1),
  left_thigh_cm   DECIMAL(5,1),
  right_thigh_cm  DECIMAL(5,1),
  left_calf_cm    DECIMAL(5,1),
  right_calf_cm   DECIMAL(5,1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE progress_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_type  photo_type NOT NULL,
  image_url   TEXT NOT NULL,
  weight_kg   DECIMAL(5,1),
  notes       TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 7: TABLES — INGREDIENTS & RECIPES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE ingredients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  category          ingredient_category NOT NULL,
  calories_per_100g DECIMAL(7,1) NOT NULL,
  protein_per_100g  DECIMAL(6,1) NOT NULL,
  carbs_per_100g    DECIMAL(6,1) NOT NULL,
  fat_per_100g      DECIMAL(6,1) NOT NULL,
  unit              VARCHAR(20) NOT NULL DEFAULT 'g',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recipes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  goal        recipe_goal,
  servings    INT NOT NULL DEFAULT 1,
  prep_time   INT,
  image_url   TEXT,
  calories    INT,
  protein     INT,
  carbs       INT,
  fat         INT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE recipe_ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  quantity      DECIMAL(8,2) NOT NULL,
  unit          VARCHAR(20) NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE TABLE recipe_instructions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 8: TABLES — EXERCISES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  category        exercise_category NOT NULL,
  muscle_group    muscle_group NOT NULL,
  equipment       equipment_type NOT NULL,
  difficulty      exercise_difficulty NOT NULL,
  instructions    JSONB NOT NULL DEFAULT '[]',
  tips            JSONB NOT NULL DEFAULT '[]',
  common_mistakes JSONB NOT NULL DEFAULT '[]',
  image_url       TEXT,
  video_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 9: TABLES — WORKOUTS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE workouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  goal        workout_goal,
  difficulty  exercise_difficulty,
  duration    INT,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D1: user_id denormalized for RLS simplification
CREATE TABLE workout_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  day_name    VARCHAR(15) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D1: user_id denormalized for RLS simplification
CREATE TABLE workout_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id  UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id     UUID REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name   VARCHAR(255) NOT NULL,
  sets            INT NOT NULL DEFAULT 3,
  reps            INT NOT NULL DEFAULT 10,
  rest_seconds    INT NOT NULL DEFAULT 60,
  notes           TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 10: TABLES — TRAINING SESSIONS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE training_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id       UUID REFERENCES workouts(id) ON DELETE SET NULL,
  workout_name     VARCHAR(255),
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time         TIMESTAMPTZ,
  duration_minutes INT,
  status           training_session_status NOT NULL DEFAULT 'In Progress',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- D1: user_id denormalized for RLS simplification
CREATE TABLE session_exercise_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id   UUID REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name VARCHAR(255) NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D1: user_id denormalized for RLS simplification
CREATE TABLE session_set_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_log_id  UUID NOT NULL REFERENCES session_exercise_logs(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_number       INT NOT NULL,
  target_reps      INT,
  completed_reps   INT,
  target_weight    DECIMAL(6,1),
  completed_weight DECIMAL(6,1),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 11: TABLES — NUTRITION & MEAL LOGGING
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE meal_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type   meal_type NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  calories    INT NOT NULL DEFAULT 0,
  protein     INT NOT NULL DEFAULT 0,
  carbs       INT NOT NULL DEFAULT 0,
  fat         INT NOT NULL DEFAULT 0,
  date        DATE NOT NULL,
  time        TIME,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(255),
  week_start_date DATE NOT NULL,
  week_end_date   DATE NOT NULL,
  plan_data       JSONB NOT NULL DEFAULT '{}',
  is_saved        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE shopping_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  name         VARCHAR(255),
  items        JSONB NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 12: TABLES — NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  priority    notification_priority NOT NULL DEFAULT 'Medium',
  status      notification_status NOT NULL DEFAULT 'Unread',
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ
);

CREATE TABLE notification_preferences (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_reminders             BOOLEAN NOT NULL DEFAULT TRUE,
  nutrition_reminders           BOOLEAN NOT NULL DEFAULT TRUE,
  progress_reminders            BOOLEAN NOT NULL DEFAULT TRUE,
  achievement_notifications     BOOLEAN NOT NULL DEFAULT TRUE,
  recommendation_notifications  BOOLEAN NOT NULL DEFAULT TRUE,
  subscription_notifications    BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_frequency            reminder_frequency NOT NULL DEFAULT 'Daily',
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 13: TABLES — RECOMMENDATIONS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE recommendations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category       recommendation_category NOT NULL,
  priority       recommendation_priority NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  status         recommendation_status NOT NULL DEFAULT 'New',
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recommendation_rules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  category       recommendation_category NOT NULL,
  description    TEXT NOT NULL,
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  priority       recommendation_priority NOT NULL DEFAULT 'Medium',
  evaluator_type VARCHAR(30) NOT NULL DEFAULT 'rule-based',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER recommendation_rules_updated_at
  BEFORE UPDATE ON recommendation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 14: TABLES — AI
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE ai_chat_messages (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      ai_chat_role NOT NULL,
  content   TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_usage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider       ai_provider_type NOT NULL,
  model          VARCHAR(50) NOT NULL,
  tokens_used    INT NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(8,6) NOT NULL DEFAULT 0,
  prompt_type    VARCHAR(30),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 15: TABLES — DAILY CHECK-INS
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE daily_checkins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  energy_level     INT NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality    INT NOT NULL CHECK (sleep_quality BETWEEN 1 AND 10),
  stress_level     INT NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
  motivation_level INT NOT NULL CHECK (motivation_level BETWEEN 1 AND 10),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 16: TABLES — FEEDBACK & BETA
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE beta_registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  fitness_goal     VARCHAR(50),
  experience_level VARCHAR(30),
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type        feedback_type NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  priority    recommendation_priority DEFAULT 'Medium',
  status      feedback_status DEFAULT 'Open',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 17: TABLES — AUDIT & PLATFORM
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(255) NOT NULL,
  entity     VARCHAR(255),
  entity_id  UUID,
  details    TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        VARCHAR(100) UNIQUE NOT NULL,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 18: INDEXES
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ── Subscriptions ─────────────────────────────────────────────────────────────
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ── Weight & Measurements ─────────────────────────────────────────────────────
CREATE INDEX idx_weight_entries_user_date ON weight_entries(user_id, date DESC);
CREATE INDEX idx_measurement_entries_user_date ON measurement_entries(user_id, date DESC);

-- ── Progress Photos ───────────────────────────────────────────────────────────
CREATE INDEX idx_progress_photos_user ON progress_photos(user_id);
CREATE INDEX idx_progress_photos_user_date ON progress_photos(user_id, upload_date DESC);

-- ── Ingredients ───────────────────────────────────────────────────────────────
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients(name);

-- ── Recipes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_recipes_goal ON recipes(goal);
CREATE INDEX idx_recipes_created_by ON recipes(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_instructions_recipe ON recipe_instructions(recipe_id);

-- ── Exercises ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_name ON exercises(name);

-- ── Workouts ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_workouts_user_id ON workouts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_workouts_is_template ON workouts(is_template);
CREATE INDEX idx_workout_days_workout ON workout_days(workout_id);
CREATE INDEX idx_workout_days_user ON workout_days(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_workout_exercises_day ON workout_exercises(workout_day_id);
CREATE INDEX idx_workout_exercises_user ON workout_exercises(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id) WHERE exercise_id IS NOT NULL;

-- ── Training Sessions ─────────────────────────────────────────────────────────
CREATE INDEX idx_training_sessions_user_date ON training_sessions(user_id, date DESC);
CREATE INDEX idx_training_sessions_status ON training_sessions(user_id, status);
CREATE INDEX idx_session_exercise_logs_session ON session_exercise_logs(session_id);
CREATE INDEX idx_session_exercise_logs_user ON session_exercise_logs(user_id);
CREATE INDEX idx_session_set_logs_exercise_log ON session_set_logs(exercise_log_id);
CREATE INDEX idx_session_set_logs_user ON session_set_logs(user_id);

-- ── Nutrition ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, date DESC);
CREATE INDEX idx_meal_logs_meal_type ON meal_logs(user_id, meal_type);
CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ── Recommendations ───────────────────────────────────────────────────────────
CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_user_status ON recommendations(user_id, status);
CREATE INDEX idx_recommendation_rules_enabled ON recommendation_rules(enabled);

-- ── AI ────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_ai_chat_messages_user ON ai_chat_messages(user_id, timestamp DESC);
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date DESC);

-- ── Daily Check-Ins ───────────────────────────────────────────────────────────
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);

-- ── Feedback ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_feedback_user ON feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_feedback_status ON feedback(status);

-- ── Audit ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_audit_log_user ON audit_log(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ── Platform Settings ─────────────────────────────────────────────────────────
CREATE INDEX idx_platform_settings_key ON platform_settings(key);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 19: COMMENTS (documentation)
-- ════════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth. id = auth.users.id';
COMMENT ON TABLE subscriptions IS 'User subscription plans. Write-restricted to service_role (D2).';
COMMENT ON COLUMN workout_days.user_id IS 'D1: Denormalized from workouts.user_id for RLS simplification. NULL for system templates.';
COMMENT ON COLUMN workout_exercises.user_id IS 'D1: Denormalized from workouts.user_id for RLS simplification. NULL for system templates.';
COMMENT ON COLUMN session_exercise_logs.user_id IS 'D1: Denormalized from training_sessions.user_id for RLS simplification.';
COMMENT ON COLUMN session_set_logs.user_id IS 'D1: Denormalized from training_sessions.user_id for RLS simplification.';
COMMENT ON TABLE recommendation_rules IS 'Admin-managed rules for the recommendation engine. Evaluated by the rule engine.';
COMMENT ON TABLE platform_settings IS 'Key-value global configuration. Managed by SUPER_ADMIN only.';
COMMENT ON TABLE ai_chat_messages IS 'Persistent AI coach conversation history per user.';

-- ════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 00001
-- ════════════════════════════════════════════════════════════════════════════════
