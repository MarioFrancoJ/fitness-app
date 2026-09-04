-- ============================================================================
-- Movive Database Schema v1.0.0-beta
-- Target: PostgreSQL 15+ (compatible with Supabase, Neon)
-- ORM: Prisma (migration-ready)
-- ============================================================================

-- ── Users & Auth ──────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  gender        VARCHAR(20),
  date_of_birth DATE,
  height_cm     DECIMAL(5,1),
  activity_level VARCHAR(50),
  fitness_goal  VARCHAR(50),
  role          VARCHAR(20) NOT NULL DEFAULT 'USER', -- USER, ADMIN, SUPER_ADMIN
  status        VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Suspended, Deleted
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ── Subscriptions ─────────────────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            VARCHAR(30) NOT NULL DEFAULT 'FREE', -- FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY
  status          VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Trial, Expired, Cancelled, Pending
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  renewal_date    DATE,
  expiration_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- ── Weight & Measurements ─────────────────────────────────────────────────────

CREATE TABLE weight_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  weight_kg  DECIMAL(5,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE measurement_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  weight_kg   DECIMAL(5,1),
  neck_cm     DECIMAL(5,1),
  chest_cm    DECIMAL(5,1),
  waist_cm    DECIMAL(5,1),
  hips_cm     DECIMAL(5,1),
  left_arm_cm DECIMAL(5,1),
  right_arm_cm DECIMAL(5,1),
  left_thigh_cm DECIMAL(5,1),
  right_thigh_cm DECIMAL(5,1),
  left_calf_cm DECIMAL(5,1),
  right_calf_cm DECIMAL(5,1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_measurements_user_date ON measurement_entries(user_id, date);

-- ── Progress Photos ───────────────────────────────────────────────────────────

CREATE TABLE progress_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_type  VARCHAR(10) NOT NULL, -- Front, Side, Back
  image_url   TEXT NOT NULL,
  weight_kg   DECIMAL(5,1),
  notes       TEXT,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_user ON progress_photos(user_id);

-- ── Ingredients ───────────────────────────────────────────────────────────────

CREATE TABLE ingredients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  category         VARCHAR(50) NOT NULL, -- Protein, Carbohydrate, Fat, Vegetable, Fruit, Dairy, Beverage, Other
  calories_per_100g DECIMAL(7,1) NOT NULL,
  protein_per_100g DECIMAL(6,1) NOT NULL,
  carbs_per_100g   DECIMAL(6,1) NOT NULL,
  fat_per_100g     DECIMAL(6,1) NOT NULL,
  unit             VARCHAR(20) NOT NULL DEFAULT 'g',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Recipes ───────────────────────────────────────────────────────────────────

CREATE TABLE recipes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  goal        VARCHAR(30), -- Fat Loss, Muscle Gain, Maintenance
  servings    INT NOT NULL DEFAULT 1,
  prep_time   INT, -- minutes
  image_url   TEXT,
  calories    INT,
  protein     INT,
  carbs       INT,
  fat         INT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  name          VARCHAR(255) NOT NULL,
  quantity      DECIMAL(8,2) NOT NULL,
  unit          VARCHAR(20) NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE TABLE recipe_instructions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL
);

-- ── Exercises ─────────────────────────────────────────────────────────────────

CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(30) NOT NULL, -- Strength, Calisthenics, Cardio, Mobility, Flexibility
  muscle_group    VARCHAR(30) NOT NULL,
  equipment       VARCHAR(30) NOT NULL,
  difficulty      VARCHAR(20) NOT NULL, -- Beginner, Intermediate, Advanced
  instructions    JSONB DEFAULT '[]',
  tips            JSONB DEFAULT '[]',
  common_mistakes JSONB DEFAULT '[]',
  image_url       TEXT,
  video_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_muscle ON exercises(muscle_group);

-- ── Workouts ──────────────────────────────────────────────────────────────────

CREATE TABLE workouts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  goal        VARCHAR(30),
  difficulty  VARCHAR(20),
  duration    INT, -- estimated minutes
  is_template BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  day_name    VARCHAR(15) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE workout_exercises (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id    UUID REFERENCES exercises(id),
  exercise_name  VARCHAR(255) NOT NULL,
  sets           INT NOT NULL DEFAULT 3,
  reps           INT NOT NULL DEFAULT 10,
  rest_seconds   INT NOT NULL DEFAULT 60,
  notes          TEXT,
  sort_order     INT NOT NULL DEFAULT 0
);

-- ── Training Sessions ─────────────────────────────────────────────────────────

CREATE TABLE training_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id      UUID REFERENCES workouts(id),
  workout_name    VARCHAR(255),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  duration_minutes INT,
  status          VARCHAR(20) NOT NULL DEFAULT 'In Progress', -- In Progress, Completed, Cancelled
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_exercise_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id  UUID REFERENCES exercises(id),
  exercise_name VARCHAR(255) NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0
);

CREATE TABLE session_set_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_log_id UUID NOT NULL REFERENCES session_exercise_logs(id) ON DELETE CASCADE,
  set_number      INT NOT NULL,
  target_reps     INT,
  completed_reps  INT,
  target_weight   DECIMAL(6,1),
  completed_weight DECIMAL(6,1),
  completed       BOOLEAN DEFAULT FALSE,
  notes           TEXT
);

CREATE INDEX idx_sessions_user_date ON training_sessions(user_id, date);

-- ── Nutrition / Meal Logging ──────────────────────────────────────────────────

CREATE TABLE meal_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type   VARCHAR(20) NOT NULL, -- Breakfast, Lunch, Dinner, Snack
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

CREATE INDEX idx_meals_user_date ON meal_logs(user_id, date);

-- ── Meal Plans ────────────────────────────────────────────────────────────────

CREATE TABLE meal_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date   DATE NOT NULL,
  plan_data       JSONB NOT NULL, -- day -> meal slot -> recipe_id
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────────────────────

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  priority    VARCHAR(20) NOT NULL DEFAULT 'Medium',
  status      VARCHAR(20) NOT NULL DEFAULT 'Unread', -- Unread, Read, Archived
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- ── Recommendations ───────────────────────────────────────────────────────────

CREATE TABLE recommendations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category       VARCHAR(50) NOT NULL,
  priority       VARCHAR(20) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'New', -- New, Viewed, Dismissed, Completed
  generated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AI Usage ──────────────────────────────────────────────────────────────────

CREATE TABLE ai_usage (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider       VARCHAR(30) NOT NULL,
  model          VARCHAR(50) NOT NULL,
  tokens_used    INT NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(8,6) DEFAULT 0,
  prompt_type    VARCHAR(30),
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Feedback & Beta ───────────────────────────────────────────────────────────

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
  user_id     UUID REFERENCES users(id),
  type        VARCHAR(30) NOT NULL, -- Bug Report, Feature Request, General Feedback
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  priority    VARCHAR(20) DEFAULT 'Medium',
  status      VARCHAR(20) DEFAULT 'Open', -- Open, In Progress, Closed
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Audit Log ─────────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id),
  action    VARCHAR(255) NOT NULL,
  entity    VARCHAR(255),
  details   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ── Daily Check-Ins ───────────────────────────────────────────────────────────

CREATE TABLE daily_checkins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  energy_level     INT CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality    INT CHECK (sleep_quality BETWEEN 1 AND 10),
  stress_level     INT CHECK (stress_level BETWEEN 1 AND 10),
  motivation_level INT CHECK (motivation_level BETWEEN 1 AND 10),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);
