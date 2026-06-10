# Ample Removals — Complete Setup Guide

This guide walks you through setting up all third-party services for the Ample Removals platform.

---

## Table of Contents
1. [Supabase (Database & Storage)](#1-supabase-database--storage)
2. [Resend (Email)](#2-resend-email)
3. [Twilio (SMS & WhatsApp)](#3-twilio-sms--whatsapp)
4. [Stripe (Payments)](#4-stripe-payments)
5. [Vercel Deployment](#5-vercel-deployment)
6. [Final Verification](#6-final-verification)

---

## 1. Supabase (Database & Storage)

**Purpose:** PostgreSQL database, authentication, file storage for invoices and quotes

### Step 1: Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `pegajpwahlzlhtmltovy`
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/phase6_quotes.sql`
6. Paste into the query editor
7. Click **Run** (or press `Ctrl+Enter`)
8. ✅ Verify: You should see "Success. No rows returned"

### Step 2: Create Storage Buckets

#### Invoices Bucket (should already exist)
1. Go to **Storage** → **Buckets**
2. If `invoices` bucket doesn't exist:
   - Click **New bucket**
   - Name: `invoices`
   - Public: **No** (keep private)
   - Click **Create bucket**

#### Quotes Bucket (NEW - required for quote PDFs)
1. Go to **Storage** → **Buckets**
2. Click **New bucket**
3. Name: `quotes`
4. Public: **No** (keep private)
5. Click **Create bucket**

### Step 3: Get Service Role Key

1. Go to **Settings** → **API**
2. Under **Project API keys**, find `service_role` (secret)
3. Click **Reveal** and copy the key
4. ⚠️ **Important:** Never commit this to Git!
5. Add to Vercel environment variables (see section 5)

---

## 2. Resend (Email)

**Purpose:** Transactional emails for quotes, invoices, booking confirmations

### Step 1: Sign Up & Get API Key

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address
4. Navigate to **API Keys** in dashboard
5. Click **Create API Key**
6. Name: `Ample Removals Production`
7. Permission: **Full Access**
8. Click **Create**
9. Copy the API key (starts with `re_...`)

### Step 2: Verify Domain

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter: `ampleremovals.com`
4. Follow DNS verification steps:
   - Add the provided TXT, MX, and CNAME records to your domain DNS settings
   - This is typically done via your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare)
5. Wait for verification (can take up to 48 hours, usually <1 hour)
6. ✅ Verify: Domain status shows as **Verified**

### Step 3: Update Environment Variables

```bash
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=Bookings - Ample Removals <bookings@ampleremovals.com>
RESEND_ADMIN_EMAIL=daniel@ampleremovals.com
```

---

## 3. Twilio (SMS & WhatsApp)

**Purpose:** Send SMS notifications and WhatsApp messages to customers

### Step 1: Sign Up & Get Credentials

1. Go to [twilio.com/console](https://www.twilio.com/console)
2. Sign up for an account
3. Complete phone verification
4. From the dashboard, note down:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)

### Step 2: Get a Phone Number (SMS)

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select country: **United Kingdom**
3. Capabilities: Check **SMS**
4. Search and purchase a number (costs ~$1-2/month)
5. Copy your purchased number (format: `+44...`)

### Step 3: Set Up WhatsApp (Optional but Recommended)

#### Option A: WhatsApp Sandbox (Testing/Development)
1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox
3. Send the join code from your WhatsApp to the provided number
4. Use the sandbox number: `whatsapp:+14155238886`
5. ⚠️ Note: Sandbox requires customers to "opt-in" first (not ideal for production)

#### Option B: WhatsApp Business API (Production - Recommended)
1. Go to **Messaging** → **WhatsApp** → **Senders**
2. Click **Create new WhatsApp sender**
3. Follow Twilio's WhatsApp Business Profile setup
4. This requires:
   - Facebook Business Manager account
   - Business verification
   - WhatsApp Business profile approval (can take 1-3 days)
5. Once approved, you'll get a production WhatsApp number

### Step 4: Update Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+447123456789
TWILIO_WHATSAPP_NUMBER=whatsapp:+447123456789  # or sandbox number
```

### Step 5: Add Credits

1. Go to **Billing** in Twilio console
2. Add funds (minimum $20 recommended)
3. SMS costs: ~£0.04 per message to UK numbers
4. WhatsApp costs: Free for first 1,000 conversations/month, then ~£0.005 per message

---

## 4. Stripe (Payments)

**Purpose:** Payment processing for deposit and full balance invoices

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up with your business email
3. Complete business verification:
   - Business details
   - Bank account information
   - Identity verification (may require documents)

### Step 2: Get API Keys

1. Go to **Developers** → **API keys**
2. Toggle **Viewing test data** to **OFF** (for production keys)
3. Copy:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`, click **Reveal**)

### Step 3: Set Up Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://ampleremovals.com/api/webhooks/stripe`
4. Description: `Ample Removals Invoice Payments`
5. Events to send: Select **payment_intent.succeeded**
6. Click **Add endpoint**
7. Click on the newly created endpoint
8. Under **Signing secret**, click **Reveal** and copy (starts with `whsec_...`)

### Step 4: Enable Payment Links

1. Go to **Settings** → **Payment methods**
2. Enable:
   - ✅ Cards (Visa, Mastercard, etc.)
   - ✅ Google Pay
   - ✅ Apple Pay
   - ✅ Link (Stripe's one-click checkout)

### Step 5: Update Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 6: Configure Branding (Optional)

1. Go to **Settings** → **Branding**
2. Upload logo
3. Set brand colors: Primary: `#6b21a8` (purple)
4. This appears on Payment Link pages

---

## 5. Vercel Deployment

**Purpose:** Host the Next.js application

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import Git Repository: `celebiouk/ampleremovals`
4. Framework Preset: **Next.js** (auto-detected)
5. Root Directory: `./` (leave default)
6. Click **Deploy** (will fail first time due to missing env vars — that's OK)

### Step 2: Add Environment Variables

1. Go to project **Settings** → **Environment Variables**
2. Copy all variables from `vercel-env.txt`
3. For each variable:
   - Paste **Key** (e.g., `RESEND_API_KEY`)
   - Paste **Value** (the actual API key/secret)
   - Environment: Select **Production**, **Preview**, **Development** (all three)
   - Click **Add**

**Complete list of required variables:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pegajpwahlzlhtmltovy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>

# Resend
RESEND_API_KEY=<from Resend dashboard>
RESEND_FROM_EMAIL=Bookings - Ample Removals <bookings@ampleremovals.com>
RESEND_ADMIN_EMAIL=daniel@ampleremovals.com

# Twilio
TWILIO_ACCOUNT_SID=<from Twilio dashboard>
TWILIO_AUTH_TOKEN=<from Twilio dashboard>
TWILIO_PHONE_NUMBER=<your Twilio number>
TWILIO_WHATSAPP_NUMBER=<your WhatsApp number or sandbox>

# Stripe
STRIPE_SECRET_KEY=<from Stripe dashboard>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<from Stripe dashboard>
STRIPE_WEBHOOK_SECRET=<from Stripe webhooks>

# Postcode API
IDEAL_POSTCODES_API_KEY=ak_mq2u0g6iVSbJibZQDbLV8AMY0eE1M

# App Config
NEXT_PUBLIC_SITE_URL=https://ampleremovals.com
NEXT_PUBLIC_ADMIN_PHONE=+443335772070
CRON_SECRET=ample_cron_secret_2026
```

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the failed deployment
3. Click **Redeploy**
4. ✅ Verify: Deployment succeeds (green checkmark)

### Step 4: Add Custom Domain

1. Go to **Settings** → **Domains**
2. Add: `ampleremovals.com`
3. Add: `www.ampleremovals.com`
4. Follow DNS configuration:
   - Add `A` record pointing to Vercel's IP
   - Add `CNAME` for `www` pointing to `cname.vercel-dns.com`
5. Wait for SSL certificate generation (~5 minutes)

---

## 6. Final Verification

### Test the Complete Flow

1. **Create a test booking:**
   - Go to your live site homepage
   - Submit a removal request
   - Check it appears in admin dashboard

2. **Create a quote:**
   - Log into `/admin`
   - Open the booking
   - Click **"+ Create Quote"**
   - Add line items
   - Click **"Save & Send"**
   - ✅ Check email inbox for quote email + PDF
   - ✅ Check phone for SMS
   - ✅ Check WhatsApp for message

3. **Generate deposit invoice:**
   - Click **"+ Deposit Invoice"**
   - Verify quote total is pre-filled
   - Set deposit % (e.g., 30%)
   - Click **"Generate & Preview"**
   - Click **"Send to Customer"**
   - ✅ Check email for invoice + payment link

4. **Test payment:**
   - Click payment link from email
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ✅ Verify booking status updates to "Deposit Paid"

---

## Common Issues & Solutions

### Emails Not Sending
- ✅ Check Resend domain is verified
- ✅ Verify `RESEND_API_KEY` is correct in Vercel
- ✅ Check spam/junk folder
- ✅ Check Resend dashboard → Logs for error messages

### SMS/WhatsApp Not Sending
- ✅ Check Twilio account has credits
- ✅ Verify phone numbers are in E.164 format (`+44...`)
- ✅ For WhatsApp sandbox: customer must send join code first
- ✅ Check Twilio console → Monitor → Logs → Errors

### Payment Link Not Working
- ✅ Verify `STRIPE_SECRET_KEY` is **live** key, not test key
- ✅ Check webhook endpoint is accessible: `https://ampleremovals.com/api/webhooks/stripe`
- ✅ Verify `STRIPE_WEBHOOK_SECRET` matches the endpoint in Stripe dashboard

### PDF Not Generating
- ✅ Check Supabase storage buckets exist: `invoices` and `quotes`
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- ✅ Check bucket policies allow service role access

---

## Cost Breakdown (Monthly)

| Service | Cost | Details |
|---------|------|---------|
| **Vercel** | $0 - $20 | Hobby: Free, Pro: $20/month |
| **Supabase** | $0 - $25 | Free tier up to 500MB, Pro: $25/month |
| **Resend** | $0 - $20 | Free: 3,000 emails/month, Pro: $20/month |
| **Twilio** | ~£20 | Pay-as-you-go: £0.04/SMS, WhatsApp mostly free |
| **Stripe** | 1.4% + £0.20 | Per successful transaction |
| **Ideal Postcodes** | £0 | Free tier: 10k lookups/month |
| **TOTAL** | ~£0-70/month | Scales with usage |

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **Twilio Docs:** https://www.twilio.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Setup Complete!** 🎉

Your Ample Removals platform is now fully configured and ready to handle quotes, invoices, and payments.
