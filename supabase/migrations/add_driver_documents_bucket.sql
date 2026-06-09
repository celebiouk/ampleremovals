-- ============================================================
-- PHASE 11A: Driver Documents Storage Bucket
-- Private bucket for driver profile photos & driving licences
-- ============================================================

-- Create the private bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- Admins (authenticated) get full access. Drivers access only
-- files under their own folder: driver-documents/[driverId]/*
-- Service-role routes bypass RLS, so server uploads always work.
-- ============================================================

-- Admin full access (any authenticated user — admin routes use service role)
DROP POLICY IF EXISTS "Admin full access to driver documents" ON storage.objects;
CREATE POLICY "Admin full access to driver documents"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'driver-documents')
  WITH CHECK (bucket_id = 'driver-documents');

-- Drivers can read files in their own driver folder.
-- Folder name is the driver's id; we match it to the driver row
-- linked to the current auth user.
DROP POLICY IF EXISTS "Drivers can read own documents" ON storage.objects;
CREATE POLICY "Drivers can read own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'driver-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM drivers WHERE auth_user_id = auth.uid()
    )
  );
