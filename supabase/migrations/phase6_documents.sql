-- ============================================================
-- Phase 6: Document Upload System
-- booking_documents table + storage bucket policies
-- ============================================================

-- Create booking_documents table
CREATE TABLE IF NOT EXISTS booking_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins full access
CREATE POLICY "Admins full access to booking_documents"
  ON booking_documents FOR ALL
  TO authenticated
  USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_booking_documents_booking_id
  ON booking_documents(booking_id);

-- Comments
COMMENT ON TABLE booking_documents IS 'File attachments for bookings (photos, documents, permits)';
COMMENT ON COLUMN booking_documents.file_path IS 'Storage path in booking-documents bucket';
COMMENT ON COLUMN booking_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN booking_documents.file_type IS 'MIME type (e.g., image/jpeg, application/pdf)';

-- Storage buckets are created in Supabase Dashboard manually:
-- 1. booking-documents (private)
-- 2. company-assets (public)
-- 3. invoices (already exists, private)
-- 4. quotes (already exists, private)
