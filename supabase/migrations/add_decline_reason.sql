-- Reason a driver gave when declining an assigned job (required on decline).
ALTER TABLE booking_driver_assignments
  ADD COLUMN IF NOT EXISTS decline_reason TEXT;
