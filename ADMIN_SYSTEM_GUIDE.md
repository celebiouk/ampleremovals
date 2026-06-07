# Multi-Admin System — Setup & Usage Guide

## Overview

The Ample Removals platform now supports multiple admin users with role-based access control. This allows you (the super admin) to create additional admin accounts for your team members and monitor all admin activity.

---

## 🔐 Admin Roles

### Super Admin
- **Email:** `ampleremovals@gmail.com`
- **Name:** Daniel
- **Permissions:**
  - ✅ Full access to all platform features
  - ✅ Create new admin users
  - ✅ Delete admin users
  - ✅ Change admin passwords
  - ✅ Activate/deactivate admin accounts
  - ✅ View complete admin activity log
  - ✅ Manage bookings, quotes, invoices, customers

### Admin (Standard)
- **Permissions:**
  - ✅ Manage bookings, quotes, invoices, customers
  - ✅ View reports and analytics
  - ✅ Send emails/SMS to customers
  - ❌ Cannot create/delete other admin users
  - ❌ Cannot view admin activity log
  - ❌ Cannot access "Manage Admins" page

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pegajpwahlzlhtmltovy`
3. Navigate to **SQL Editor**
4. Copy the contents of `supabase/migrations/phase7_admin_system.sql`
5. Paste and click **Run**
6. ✅ Verify: "Success. No rows returned"

This migration:
- Creates `admin_users` table
- Creates `admin_activity_log` table
- Inserts you (Daniel) as the super admin
- Adds `admin_user_id` to existing `activity_log` table

### Step 2: Link Your Supabase Auth Account

After running the migration, you need to link your Supabase auth account to the admin_users table:

1. Log into the admin dashboard at `/admin/login`
2. Use your existing Supabase auth credentials (ampleremovals@gmail.com)
3. Run this SQL in Supabase SQL Editor (replace `YOUR_USER_ID` with your actual Supabase user ID):

```sql
-- Get your Supabase user ID first:
SELECT id, email FROM auth.users WHERE email = 'ampleremovals@gmail.com';

-- Then update admin_users (replace the UUID below with your actual user ID):
UPDATE admin_users 
SET supabase_user_id = 'YOUR_USER_ID_HERE'
WHERE email = 'ampleremovals@gmail.com';
```

---

## 🚀 How to Use

### Accessing Admin Management

1. Log into `/admin`
2. Look at the bottom of the sidebar
3. Click **"Manage Admins"** (Shield icon)

You'll see two tabs:
- **Admin Users**: Create, edit, delete users
- **Activity Log**: See all admin actions

### Creating a New Admin User

1. Go to **Manage Admins** → **Admin Users** tab
2. Click **"Create Admin User"** button
3. Fill in the form:
   - **Email**: The admin's email address
   - **Full Name**: Their display name
   - **Password**: Minimum 6 characters (they can change it later)
   - **Role**: Choose `Admin` or `Super Admin`
4. Click **"Create User"**
5. ✅ The new admin can now log in with their email and password

### Changing an Admin's Password

1. Go to **Manage Admins** → **Admin Users** tab
2. Find the user in the table
3. Click the **Key icon** (🔑)
4. Enter new password (min 6 characters)
5. Click **"Change Password"**
6. ✅ The admin can now log in with the new password

### Deactivating an Admin

1. Go to **Manage Admins** → **Admin Users** tab
2. Find the user in the table
3. Click the **UserX icon** (will deactivate them)
4. ✅ The admin can no longer log in
5. To reactivate, click the **UserCheck icon**

### Deleting an Admin User

1. Go to **Manage Admins** → **Admin Users** tab
2. Find the user in the table
3. Click the **Trash icon** (🗑️)
4. Confirm deletion
5. ✅ The admin is permanently deleted and cannot log in

**Important Notes:**
- You cannot delete yourself
- You cannot delete the main super admin (ampleremovals@gmail.com)
- Deleted users are permanently removed from the system

### Viewing Admin Activity

1. Go to **Manage Admins** → **Activity Log** tab
2. See a complete audit trail of all admin actions:
   - Who performed the action
   - What they did
   - When it happened
   - Additional details (metadata)
3. Click **"Refresh"** to reload the latest activities

**Tracked Activities:**
- Created admin user
- Deleted admin user
- Changed admin password
- Activated/deactivated admin user
- Created booking
- Updated booking status
- Created quote
- Sent quote
- Generated invoice
- Sent invoice
- And more...

---

## 🔒 Security Features

### Protection Mechanisms

1. **Super Admin Protection:**
   - Main super admin (ampleremovals@gmail.com) cannot be deleted
   - Admins cannot delete themselves
   - Only super admins can access admin management

2. **Authentication:**
   - All API routes check authentication
   - Role-based access control enforced
   - Session-based security via Supabase Auth

3. **Audit Trail:**
   - Every admin action is logged
   - IP address and user agent captured
   - Metadata stored in JSONB for flexibility
   - Cannot be modified by admins

4. **Password Requirements:**
   - Minimum 6 characters
   - Stored securely in Supabase Auth
   - Can be reset by super admin

---

## 📊 Database Schema

### admin_users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Admin email (unique) |
| full_name | TEXT | Display name |
| role | admin_role | `super_admin` or `admin` |
| supabase_user_id | UUID | Links to Supabase Auth |
| is_active | BOOLEAN | Can the admin log in? |
| created_by | UUID | Who created this admin |
| created_at | TIMESTAMPTZ | When created |
| updated_at | TIMESTAMPTZ | Last updated |
| last_login_at | TIMESTAMPTZ | Last login timestamp |

### admin_activity_log Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| admin_user_id | UUID | Which admin performed this |
| admin_email | TEXT | Email of the admin |
| action | TEXT | What they did |
| resource_type | TEXT | Type of resource (e.g., "booking") |
| resource_id | UUID | ID of the resource |
| metadata | JSONB | Additional context |
| ip_address | TEXT | Admin's IP address |
| user_agent | TEXT | Browser/device info |
| created_at | TIMESTAMPTZ | When it happened |

---

## 🎯 Use Cases

### Scenario 1: Hiring a New Team Member

1. Create admin account for them
2. Role: `Admin` (standard permissions)
3. They receive email & password
4. They can log in and manage bookings
5. You can see all their actions in Activity Log

### Scenario 2: Team Member Leaves

1. Deactivate their account immediately (prevents login)
2. Review their recent activity in Activity Log
3. Delete their account after handover period
4. All their historical actions remain in the log

### Scenario 3: Forgot Password

1. Go to Manage Admins
2. Find the user
3. Click "Change Password"
4. Generate new password
5. Share new password with the admin securely

### Scenario 4: Promoting an Admin

1. Currently: must manually update in database
2. Run in Supabase SQL Editor:
```sql
UPDATE admin_users 
SET role = 'super_admin' 
WHERE email = 'admin@example.com';
```

---

## 🚨 Troubleshooting

### "Forbidden: Super admin access required"

**Cause:** You're not logged in as a super admin

**Fix:**
1. Check you're logged in with `ampleremovals@gmail.com`
2. Verify the migration ran successfully
3. Ensure `supabase_user_id` is linked (see Step 2 above)

### Cannot Create Admin User

**Possible causes:**
- Email already exists (check existing users)
- Password too short (min 6 characters)
- Supabase Auth service not responding

**Fix:**
1. Check Vercel logs for error details
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
3. Check Supabase project is active

### Activity Log is Empty

**Cause:** Admin actions haven't been linked yet

**Fix:**
- The system will start logging once admins take actions
- Old actions (before migration) won't appear
- Only actions after migration are tracked

---

## 🔄 Future Enhancements

Potential improvements (not yet implemented):

- [ ] Email notifications when new admin is created
- [ ] Force password reset on first login
- [ ] Two-factor authentication (2FA)
- [ ] Admin permission granularity (e.g., "can only view, not edit")
- [ ] Export activity log to CSV
- [ ] Admin session timeout settings

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs (Dashboard → Logs)
3. Verify environment variables are set
4. Run migration again if tables are missing

---

**Your admin system is now ready!** 🎉

You can create team accounts, monitor all activity, and maintain full control over who has access to the platform.
