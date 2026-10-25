-- ============================================================
-- Page view tracking — site-wide + per-page traffic for admin
-- ============================================================

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  session_id TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_path_created ON page_views(path, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'page_views' AND policyname = 'Public can insert page views') THEN
    CREATE POLICY "Public can insert page views" ON page_views FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'page_views' AND policyname = 'Admins full access to page views') THEN
    CREATE POLICY "Admins full access to page views" ON page_views FOR ALL TO authenticated USING (true);
  END IF;
END $$;

COMMENT ON TABLE page_views IS 'One row per page load on the public site, for admin traffic stats (site-wide + per-page, monthly).';
COMMENT ON COLUMN page_views.session_id IS 'Client-generated id (not PII) to dedupe/approximate unique visitors per page per session.';
