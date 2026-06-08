-- ============================================================
-- Call Back Reminders System
-- Allows admin to set reminders to call customers back
-- ============================================================

-- Create call_back_reminders table
CREATE TABLE IF NOT EXISTS call_back_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- When to call back
  reminder_datetime TIMESTAMPTZ NOT NULL,

  -- Why calling back
  notes TEXT,
  reason VARCHAR(100), -- "not_sure", "checking_price", "waiting_decision", "other"

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),

  -- Who created and when
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- When reminder was sent/completed
  reminder_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_back_reminders_booking ON call_back_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_call_back_reminders_customer ON call_back_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_back_reminders_datetime ON call_back_reminders(reminder_datetime);
CREATE INDEX IF NOT EXISTS idx_call_back_reminders_status ON call_back_reminders(status);

-- Index for finding due reminders
CREATE INDEX IF NOT EXISTS idx_call_back_reminders_due
  ON call_back_reminders(reminder_datetime, status)
  WHERE status = 'pending';

-- Comments
COMMENT ON TABLE call_back_reminders IS 'Reminders for admin to call back customers';
COMMENT ON COLUMN call_back_reminders.reminder_datetime IS 'When to send the reminder';
COMMENT ON COLUMN call_back_reminders.reason IS 'Why customer needs callback';
COMMENT ON COLUMN call_back_reminders.status IS 'pending, completed, or cancelled';

-- RLS Policies
ALTER TABLE call_back_reminders ENABLE ROW LEVEL SECURITY;

-- Admin can manage all reminders
CREATE POLICY "Admin users can manage call back reminders"
  ON call_back_reminders FOR ALL
  USING (true)
  WITH CHECK (true);
