-- ============================================================
-- Admin push notification tokens (for the mobile admin app)
-- ============================================================
-- Stores each admin device's Expo push token so the backend can send
-- push notifications when key events occur (new booking, invoice paid,
-- driver status update, booking status change).

CREATE TABLE IF NOT EXISTS admin_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON admin_push_tokens(supabase_user_id);

ALTER TABLE admin_push_tokens ENABLE ROW LEVEL SECURITY;

-- Only the owning user can read/manage their token rows; service-role (server
-- routes) bypasses RLS for dispatch.
DROP POLICY IF EXISTS "Users manage own push tokens" ON admin_push_tokens;
CREATE POLICY "Users manage own push tokens"
  ON admin_push_tokens FOR ALL TO authenticated
  USING (supabase_user_id = auth.uid())
  WITH CHECK (supabase_user_id = auth.uid());
