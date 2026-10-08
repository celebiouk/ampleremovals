-- One-off private, token-gated documents (e.g. "print this and show them"
-- style customer summaries) that need a shareable link without being public
-- or indexable. Content lives in the DB, same as every other piece of
-- customer data in this app — never committed to the git repo or /public.
CREATE TABLE IF NOT EXISTS private_documents (
  token TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE private_documents ENABLE ROW LEVEL SECURITY;
-- No public policies at all: only the service-role key (server-side routes)
-- can read/write this table. The token itself is the access control for the
-- one route that serves it.
