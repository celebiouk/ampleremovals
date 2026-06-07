-- ============================================================
-- Phase 7: Multi-Admin System with Role-Based Access Control
-- Super Admin: ampleremovals@gmail.com (Daniel)
-- ============================================================

-- Create admin roles enum
DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'admin',
  supabase_user_id UUID UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);

-- Trigger for updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert super admin (Daniel)
INSERT INTO admin_users (email, full_name, role, is_active)
VALUES ('ampleremovals@gmail.com', 'Daniel', 'super_admin', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', full_name = 'Daniel';

-- Comments
COMMENT ON TABLE admin_users IS 'Admin users with role-based access control';
COMMENT ON TABLE admin_activity_log IS 'Complete audit trail of all admin actions';
COMMENT ON COLUMN admin_users.role IS 'super_admin: full access including user management, admin: standard access';
COMMENT ON COLUMN admin_users.supabase_user_id IS 'Links to Supabase Auth user';

-- Add admin_user_id to existing activity_log for backwards compatibility
ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_admin_user_id ON activity_log(admin_user_id);
