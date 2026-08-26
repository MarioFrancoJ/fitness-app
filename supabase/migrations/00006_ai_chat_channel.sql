-- Migration: 00006_ai_chat_channel
-- Purpose: Add channel column to ai_chat_messages to differentiate
--          between /ai/chat ('ai_chat') and /ai-coach/chat ('coach_chat')
-- Fixes: Critical data collision where both chat pages shared the same messages

-- 1. Add channel column with default 'ai_chat' (backfills existing rows)
ALTER TABLE ai_chat_messages
ADD COLUMN channel TEXT NOT NULL DEFAULT 'ai_chat';

-- 2. Create index for efficient filtering by user + channel
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_channel
ON ai_chat_messages (user_id, channel, timestamp);

-- 3. Update RLS policy to include channel awareness (optional, RLS already filters by user_id)
-- No RLS changes needed — the existing user_id policy is sufficient.
-- Channel separation is enforced at the application layer.
