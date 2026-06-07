# Deployment Guide — Ample Removals Platform

Complete step-by-step guide to deploy the platform to production.

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub repository with all code pushed
- ✅ Vercel account (free tier works)
- ✅ Supabase account (free tier works)
- ✅ Stripe account (test mode → live mode)
- ✅ Resend account (email sending)
- ✅ Twilio account (SMS + WhatsApp)
- ✅ Custom domain (optional but recommended)

---

## 1️⃣ Production Supabase Setup

### Step 1: Create Production Project

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in:
   - **Name**: Ample Removals Production
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users (e.g., EU West London)
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 2: Run Database Migrations

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the following migrations **in this order**:

**a) Base Schema** (if starting fresh)
```sql
-- Copy entire contents of supabase/migrations/schema.sql
-- Paste and Run
```

**b) Phase 4B** (Kanban, Calendar, Automations)
```sql
-- Copy entire contents of supabase/migrations/phase4b.sql
-- Paste and Run
```

**c) Phase 5** (Invoicing)
```sql
-- Copy entire contents of supabase/migrations/phase5.sql
-- Paste and Run
```

**d) Phase 6 Quotes**
```sql
-- Copy entire contents of supabase/migrations/phase6_quotes.sql
-- Paste and Run
```

**e) Phase 6 Documents**
```sql
-- Copy entire contents of supabase/migrations/phase6_documents.sql
-- Paste and Run
```

**f) Phase 7 Admin System**
```sql
-- Copy entire contents of supabase/migrations/phase7_admin_system.sql
-- Paste and Run
```

### Step 3: Enable Realtime

Run this SQL to enable realtime on required tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE booking_notes;
```

### Step 4: Create Storage Buckets

Go to **Storage** → Click **"Create bucket"**

Create these buckets (all **private**):
1. **invoices**
2. **quotes**
3. **booking-documents**

For each bucket, add this RLS policy:
- Policy name: `Admin full access`
- Target roles: `authenticated`
- Policy: `USING (true)`

### Step 5: Create Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Email: `ampleremovals@gmail.com` (or your email)
4. Auto-generate password
5. Click **"Create user"**
6. Copy the **User ID** (UUID)

7. Go back to **SQL Editor** and run:
```sql
-- Link your auth user to admin_users table
UPDATE admin_users 
SET supabase_user_id = 'YOUR_USER_ID_HERE'
WHERE email = 'ampleremovals@gmail.com';
```

### Step 6: Get API Keys

Go to **Project Settings** → **API**

Copy these values (you'll need them for Vercel):
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** (show value) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2️⃣ Stripe Production Setup

### Step 1: Switch to Live Mode

1. Go to https://dashboard.stripe.com
2. Toggle switch in sidebar: **Test mode** → **Live mode**

### Step 2: Get Live API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (reveal) → `STRIPE_SECRET_KEY`

### Step 3: Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
   (You'll update this after Vercel deployment)
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 3️⃣ Resend Production Setup

### Step 1: Get API Key

1. Go to https://resend.com/api-keys
2. Click **"Create API Key"**
3. Name: `Production - Ample Removals`
4. Permission: **Full access**
5. Copy the key → `RESEND_API_KEY`

### Step 2: Verify Domain (Recommended)

1. Go to **Domains** → **"Add Domain"**
2. Enter your domain: `ampleremovals.com`
3. Add the DNS records shown to your domain registrar
4. Wait for verification (can take 24-48 hours)
5. Once verified, emails from `bookings@ampleremovals.com` will work

**For now, use:**
- `RESEND_FROM_EMAIL=onboarding@resend.dev` (temporary)
- `RESEND_ADMIN_EMAIL=your-real-email@gmail.com`

---

## 4️⃣ Twilio Production Setup

### Step 1: Get Account Credentials

1. Go to https://console.twilio.com
2. Copy from dashboard:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** (show) → `TWILIO_AUTH_TOKEN`

### Step 2: Buy Phone Number (for SMS)

1. Go to **Phone Numbers** → **Buy a number**
2. Select country: **United Kingdom**
3. Capabilities: **SMS**
4. Buy the number
5. Copy the number → `TWILIO_PHONE_NUMBER` (format: +44...)

### Step 3: WhatsApp Setup

**Option A: Sandbox (Testing)**
- Use: `whatsapp:+14155238886`
- Customers must send "join <code>" first
- **Not recommended for production**

**Option B: WhatsApp Business API (Production)**
1. Go to **Messaging** → **Try WhatsApp**
2. Follow Twilio's WhatsApp Business setup
3. Verify your business
4. Get approved WhatsApp sender (takes 1-2 weeks)

**For now**: Leave WhatsApp disabled or use sandbox

---

## 5️⃣ Vercel Deployment

### Step 1: Push Code to GitHub

```bash
cd c:\Users\User\Ampleremovals
git add .
git commit -m "chore: final pre-deployment commit"
git push origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repo: `ampleremovals`
4. Click **"Import"**

### Step 3: Configure Project

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (leave default)
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add ALL of these:

```env
# Supabase (from Step 1.6)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Resend (from Step 3)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@your-domain.com
RESEND_ADMIN_EMAIL=your-email@gmail.com

# Twilio (from Step 4)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+44...

# Stripe (from Step 2)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cron Secret (generate random 32-char string)
CRON_SECRET=your-random-secret-here

# Site URL (update after deployment)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Note your deployment URL: `https://ampleremovals.vercel.app`

### Step 6: Update Environment Variables

1. Go to **Project Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_SITE_URL`
3. Update value to: `https://ampleremovals.vercel.app`
4. Click **"Save"**

### Step 7: Update External Services

**Update Stripe Webhook URL:**
1. Go to Stripe Dashboard → Webhooks
2. Edit your webhook
3. Change URL to: `https://ampleremovals.vercel.app/api/webhooks/stripe`
4. Save

**Update Supabase Auth URLs:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. **Site URL**: `https://ampleremovals.vercel.app`
3. **Redirect URLs**: Add `https://ampleremovals.vercel.app/admin/reset-password`
4. Save

### Step 8: Redeploy

1. Go to Vercel Dashboard → Deployments
2. Click **"..." on latest deployment** → **"Redeploy"**
3. Check **"Use existing build cache"**
4. Click **"Redeploy"**

---

## 6️⃣ Custom Domain Setup

### Step 1: Add Domain in Vercel

1. Go to **Project Settings** → **Domains**
2. Enter your domain: `ampleremovals.com`
3. Click **"Add"**

### Step 2: Configure DNS

Vercel will show you DNS records to add. Go to your domain registrar (GoDaddy, Namecheap, etc.) and add:

**For root domain (ampleremovals.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

### Step 3: Wait for DNS Propagation

- Can take 24-48 hours
- Check status in Vercel dashboard
- Once verified, you'll see green checkmark

### Step 4: Update NEXT_PUBLIC_SITE_URL

1. Go to Vercel **Environment Variables**
2. Update `NEXT_PUBLIC_SITE_URL` to: `https://ampleremovals.com`
3. Save and redeploy

### Step 5: Update External Services Again

- Update Stripe webhook URL to your custom domain
- Update Supabase Auth URLs to your custom domain
- Update Resend "From" email if using custom domain

---

## 7️⃣ Post-Deployment Verification

### Test Checklist

- [ ] Visit homepage: `https://ampleremovals.com`
- [ ] Submit test booking (all 5 services)
- [ ] Check confirmation email arrives
- [ ] Check confirmation SMS arrives
- [ ] Log into admin: `/admin/login`
- [ ] View booking in dashboard
- [ ] Create test quote
- [ ] Send quote to customer
- [ ] Generate deposit invoice
- [ ] Click Stripe payment link
- [ ] Complete test payment (use Stripe test card: 4242 4242 4242 4242)
- [ ] Verify webhook updates invoice to "paid"
- [ ] Upload test document to booking
- [ ] Create second admin user (if super admin)
- [ ] Check automations cron (wait 1 day)

### Monitor Logs

1. **Vercel Logs**:
   - Go to Deployment → Runtime Logs
   - Watch for errors

2. **Supabase Logs**:
   - Go to Logs → check for auth/database errors

3. **Stripe Events**:
   - Go to Developers → Events
   - Verify webhook deliveries

---

## 🎉 You're Live!

Your platform is now running in production. Monitor for the first few days and watch for:
- Email delivery issues
- SMS delivery issues
- Payment webhook failures
- Database connection errors

---

## 🆘 Troubleshooting

### "Unauthorized" errors in admin
→ Check Supabase Auth is configured correctly
→ Verify admin user exists in database

### Emails not sending
→ Check Resend API key is correct
→ Verify domain is verified (or use onboarding@resend.dev)

### Stripe webhook not firing
→ Check webhook URL matches deployment URL
→ Verify webhook secret is correct
→ Check Stripe event logs

### Cron not running
→ Verify `CRON_SECRET` matches in Vercel and code
→ Check Vercel cron logs

---

**Need help?** Check logs first, then review this guide step-by-step.
