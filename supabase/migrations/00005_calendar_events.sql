-- ============================================================================
-- Movive — Calendar Events
-- Version: 00005
-- Date: 2026-08-25
-- Purpose: Calendar module for scheduling workouts, meals, goals, and custom events
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: TABLE
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  event_type  TEXT NOT NULL DEFAULT 'custom',
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ,
  all_day     BOOLEAN NOT NULL DEFAULT FALSE,
  color       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: INDEXES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, start_date DESC);
CREATE INDEX idx_calendar_events_type ON calendar_events(user_id, event_type);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- User can SELECT own events
CREATE POLICY "calendar_events_select_own"
  ON calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- User can INSERT own events
CREATE POLICY "calendar_events_insert_own"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User can UPDATE own events
CREATE POLICY "calendar_events_update_own"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User can DELETE own events
CREATE POLICY "calendar_events_delete_own"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can view all events
CREATE POLICY "calendar_events_select_admin"
  ON calendar_events FOR SELECT
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: COMMENTS
-- ════════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE calendar_events IS 'User calendar events. Supports: workout, meal, measurement, goal, custom types.';
COMMENT ON COLUMN calendar_events.event_type IS 'Event category: workout, meal, measurement, goal, custom. Prepared for future integrations.';
COMMENT ON COLUMN calendar_events.color IS 'Optional hex color for calendar display (e.g., #3b82f6).';

-- ════════════════════════════════════════════════════════════════════════════════
-- GRANTS (for Supabase roles)
-- ════════════════════════════════════════════════════════════════════════════════

GRANT ALL ON calendar_events TO authenticated;
GRANT ALL ON calendar_events TO service_role;

-- ════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 00005
-- ════════════════════════════════════════════════════════════════════════════════
