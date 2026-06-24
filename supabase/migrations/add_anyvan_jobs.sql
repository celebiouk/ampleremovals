-- AnyVan marketplace jobs: minimal record of a job we did via AnyVan, so we can
-- ask the customer (48h later) to rate the Ample Removals driver and, on 5 stars,
-- invite them to a Google review. Server-side only (RLS deny-all).
CREATE TABLE IF NOT EXISTS anyvan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  amount NUMERIC(10,2),
  job_at TIMESTAMPTZ NOT NULL,                 -- date + time of the delivery
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  driver_name TEXT,                            -- snapshot for the rating message
  rating_request_sent BOOLEAN DEFAULT false,
  rating_request_sent_at TIMESTAMPTZ,
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  rating_feedback TEXT,
  rated_at TIMESTAMPTZ,
  created_by TEXT,                             -- 'admin' | 'driver'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_anyvan_jobs_due ON anyvan_jobs (rating_request_sent, job_at);
ALTER TABLE anyvan_jobs ENABLE ROW LEVEL SECURITY;
