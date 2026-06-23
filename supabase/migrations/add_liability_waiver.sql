-- Liability waiver: captured on the driver app when a customer hasn't protected
-- their goods/property and agrees to waive our liability (linked to the website T&Cs).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS waiver_signed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS waiver_signer_name TEXT,
  ADD COLUMN IF NOT EXISTS waiver_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS waiver_signed_at TIMESTAMPTZ;
