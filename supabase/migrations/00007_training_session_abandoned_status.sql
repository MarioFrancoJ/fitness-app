-- ════════════════════════════════════════════════════════════════════════════════
-- Migration 00007: Add 'Abandoned' status to training_session_status enum
-- ════════════════════════════════════════════════════════════════════════════════
-- Purpose: Sessions left open >4 hours are automatically marked as Abandoned.
-- This prevents unrealistic duration calculations (e.g. 1700+ minutes) and
-- provides a clear lifecycle: In Progress → Completed | Cancelled | Abandoned
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TYPE training_session_status ADD VALUE IF NOT EXISTS 'Abandoned';
