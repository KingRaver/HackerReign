-- Phase 3: FTS Triggers and Backfill
-- Auto-sync triggers for FTS index and backfill historical data

-- Backfill existing messages into FTS index (run before triggers to avoid duplicates)
INSERT OR IGNORE INTO messages_fts(message_id, conversation_id, content, role)
SELECT id, conversation_id, content, role
FROM messages
WHERE role IN ('user', 'assistant')
