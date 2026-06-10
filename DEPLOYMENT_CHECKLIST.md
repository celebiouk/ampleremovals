# Ample Removals — Deployment Checklist

Quick checklist for deploying the quote system to production.

---

## ✅ Pre-Deployment (Database)

- [ ] Run `supabase/migrations/phase6_quotes.sql` in Supabase SQL Editor
- [ ] Create `quotes` storage bucket in Supabase (Settings → Storage)
- [ ] Verify `invoices` storage bucket exists
- [ ] Get Supabase Service Role Key (Settings → API)

---

## ✅ Third-Party Services Setup

### Resend (Email)
- [ ] Sign up at resend.com
- [ ] Get API key
- [ ] Verify domain: `ampleremovals.com`
- [ ] Test sending email

### Twilio (SMS & WhatsApp)
- [ ] Sign up at twilio.com
- [ ] Get Account SID & Auth Token
- [ ] Purchase UK phone number with SMS capability
- [ ] Add credits to account (minimum £20)
- [ ] **WhatsApp (Optional):**
  - [ ] Option A: Join sandbox (for testing)
  - [ ] Option B: Set up WhatsApp Business API (for production)

### Stripe (Payments)
- [ ] Create Stripe account
- [ ] Complete business verification
- [ ] Get live API keys (Publishable & Secret)
- [ ] Create webhook endpoint: `https://ampleremovals.com/api/webhooks/stripe`
- [ ] Get webhook signing secret
- [ ] Enable payment methods (Cards, Google Pay, Apple Pay)

---

## ✅ Vercel Environment Variables

Copy these to **Vercel Dashboard → Settings → Environment Variables**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pegajpwahlzlhtmltovy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# Resend
RESEND_API_KEY=<your_resend_api_key>
RESEND_FROM_EMAIL=Bookings - Ample Removals <bookings@ampleremovals.com>
RESEND_ADMIN_EMAIL=daniel@ampleremovals.com

# Twilio
TWILIO_ACCOUNT_SID=<your_account_sid>
TWILIO_AUTH_TOKEN=<your_auth_token>
TWILIO_PHONE_NUMBER=<your_twilio_number>
TWILIO_WHATSAPP_NUMBER=<your_whatsapp_number>  # or whatsapp:+14155238886 for sandbox

# Stripe
STRIPE_SECRET_KEY=<your_stripe_secret_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

# Other
IDEAL_POSTCODES_API_KEY=ak_mq2u0g6iVSbJibZQDbLV8AMY0eE1M
NEXT_PUBLIC_SITE_URL=https://ampleremovals.com
NEXT_PUBLIC_ADMIN_PHONE=+443335772070
CRON_SECRET=ample_cron_secret_2026
```

**After adding variables:**
- [ ] Redeploy from Vercel dashboard

---

## ✅ Post-Deployment Testing

### 1. Create Test Booking
- [ ] Submit booking from homepage
- [ ] Verify it appears in `/admin/bookings`

### 2. Create & Send Quote
- [ ] Open booking in admin dashboard
- [ ] Click "+ Create Quote"
- [ ] Add line items (base service + extras)
- [ ] Set validity period
- [ ] Click "Save & Send"
- [ ] **Verify:**
  - [ ] Email received with PDF attachment
  - [ ] SMS received with quote summary
  - [ ] WhatsApp message received (if configured)
  - [ ] Quote PDF opens and looks professional

### 3. Generate Deposit Invoice
- [ ] Click "+ Deposit Invoice"
- [ ] **Verify:** Full job price auto-filled from quote
- [ ] Choose deposit percentage (e.g., 30%)
- [ ] Click "Generate & Preview"
- [ ] **Verify:** Deposit amount calculated correctly
- [ ] Click "Send to Customer"
- [ ] **Verify:**
  - [ ] Email received with invoice PDF + payment link
  - [ ] SMS received with payment link

### 4. Test Payment Flow
- [ ] Click payment link
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] **Verify:**
  - [ ] Payment succeeds
  - [ ] Booking status updates to "Deposit Paid"
  - [ ] Invoice status updates to "Paid"
  - [ ] Payment record created

---

## ✅ Monitoring & Maintenance

- [ ] Set up Stripe Dashboard notifications for failed payments
- [ ] Set up Resend email logs monitoring
- [ ] Check Twilio usage/credits regularly
- [ ] Monitor Supabase storage usage
- [ ] Set up uptime monitoring (optional: UptimeRobot, Pingdom)

---

## 🚨 Troubleshooting

If something doesn't work, check [SETUP_GUIDE.md](./SETUP_GUIDE.md) → "Common Issues & Solutions" section.

**Quick Debug:**
1. Check Vercel deployment logs
2. Check Vercel environment variables are all set
3. Check Supabase logs (Dashboard → Logs)
4. Check Resend logs (Dashboard → Logs)
5. Check Twilio logs (Console → Monitor → Logs)
6. Check Stripe webhooks (Dashboard → Developers → Webhooks → Events)

---

## 📞 Support Resources

- **Vercel Logs:** Vercel Dashboard → Deployments → Click deployment → Logs
- **Supabase Logs:** Supabase Dashboard → Logs
- **Resend Logs:** Resend Dashboard → Logs
- **Twilio Logs:** Twilio Console → Monitor → Logs
- **Stripe Events:** Stripe Dashboard → Developers → Events

---

**Once all boxes are checked, your quote system is live!** 🚀
