# Automation Rules Documentation

Complete guide to the 8 built-in automation rules that run daily at 8am.

---

## 📋 Overview

**What are automations?**
Automated follow-up emails and SMS messages sent based on booking status and timing.

**When do they run?**
Every day at 8:00 AM UK time (configured in Vercel cron)

**How do they work?**
1. Cron job triggers at 8am
2. Each rule checks ALL bookings
3. If conditions match, action is executed
4. Result logged to activity_log

**Can I turn them off?**
Yes - toggle any rule on/off in `/admin/automations`

---

## 🎯 The 8 Built-in Rules

### Rule 1: Follow-up — Inquiry Not Called (24h)

**Trigger**: Booking created 24+ hours ago, still in "inquiry" status

**Action**: Send reminder email to admin

**Purpose**: Don't let new leads go cold

**Email Template**: "Reminder: New inquiry waiting"

**Variables**:
- `{{booking_reference}}`
- `{{customer_name}}`
- `{{service_type}}`

**Example**:
> Customer "John Smith" submitted a removal inquiry (RMV-2026-ABC123) 24 hours ago and hasn't been called yet.

**When to disable**: Never - this is your safety net

---

### Rule 2: Follow-up — Called but Not Answered (48h)

**Trigger**: Booking in "called_not_answered" status for 48+ hours

**Action**: Send reminder email to admin

**Purpose**: Try calling again before lead goes stale

**Email Template**: "Reminder: Follow up with customer"

**Variables**:
- `{{booking_reference}}`
- `{{customer_name}}`
- `{{customer_phone}}`

**Example**:
> You called John Smith (RMV-2026-ABC123) but didn't reach them. Try again now.

**When to disable**: If you have a different calling schedule

---

### Rule 3: Follow-up — Quote Sent (48h)

**Trigger**: Quote sent 48+ hours ago, customer hasn't responded

**Action**: Send follow-up email to customer

**Purpose**: Nudge customers who haven't replied to quotes

**Email Template**: "Just checking in on your quote"

**Variables**:
- `{{customer_name}}`
- `{{quote_total}}`
- `{{quote_valid_until}}`
- `{{quote_link}}`

**Example**:
> Hi John, just following up on the £600 quote we sent on Monday. Valid until Friday. Any questions?

**When to disable**: If you prefer manual follow-ups

---

### Rule 4: Reminder — Deposit Invoice Due Soon (3 days)

**Trigger**: Deposit invoice sent, due date is 3 days away, not paid yet

**Action**: Send reminder email to customer

**Purpose**: Friendly reminder to pay before due date

**Email Template**: "Friendly reminder: Deposit due soon"

**Variables**:
- `{{customer_name}}`
- `{{invoice_amount}}`
- `{{due_date}}`
- `{{payment_link}}`

**Example**:
> Hi John, just a reminder that your £200 deposit is due on Thursday. Click here to pay securely.

**When to disable**: Never - prevents surprises

---

### Rule 5: Overdue — Deposit Invoice Overdue (1 day)

**Trigger**: Deposit invoice due date passed, still unpaid

**Action**: Send overdue notice to customer

**Purpose**: Polite but firm reminder that payment is overdue

**Email Template**: "Overdue payment notice"

**Variables**:
- `{{customer_name}}`
- `{{invoice_amount}}`
- `{{days_overdue}}`
- `{{payment_link}}`

**Example**:
> Hi John, your £200 deposit payment is now 1 day overdue. Please pay ASAP to confirm your booking.

**When to disable**: If you handle collections manually

---

### Rule 6: Reminder — Move Day Approaching (2 days)

**Trigger**: Move date is 2 days away, job confirmed (deposit paid)

**Action**: Send confirmation email to customer

**Purpose**: Final confirmation of details before move day

**Email Template**: "Your move is in 2 days"

**Variables**:
- `{{customer_name}}`
- `{{move_date}}`
- `{{move_time}}`
- `{{collection_address}}`
- `{{delivery_address}}`

**Example**:
> Hi John, this is a final reminder that we're moving you on Thursday, July 15th at 9:00 AM from London to Manchester.

**When to disable**: If you call customers instead

---

### Rule 7: Follow-up — Job Completed (2 days)

**Trigger**: Job marked "completed" 2 days ago

**Action**: Send thank you + review request email

**Purpose**: Get reviews while experience is fresh

**Email Template**: "Thank you! Leave us a review?"

**Variables**:
- `{{customer_name}}`
- `{{google_review_link}}`

**Example**:
> Hi John, thank you for choosing us for your move! If you were happy with our service, we'd love a Google review.

**When to disable**: If you don't want to ask for reviews

---

### Rule 8: Stale Lead — No Activity (7 days)

**Trigger**: Booking older than 7 days, no progress beyond "inquiry"

**Action**: Mark as "bad_lead" status

**Purpose**: Keep pipeline clean, focus on active leads

**Email Template**: None (status change only)

**Variables**: N/A

**Example**:
> RMV-2026-ABC123 has been in "inquiry" status for 7 days with no activity. Automatically marked as bad lead.

**When to disable**: If you want to manually review old leads

---

## ⚙️ How to Edit Rules

### In the Admin Dashboard

1. Go to `/admin/automations`
2. Find the rule you want to edit
3. Click the toggle to enable/disable
4. Changes take effect immediately

### In the Code

Rules are defined in: `app/api/cron/automations/route.ts`

Each rule is an object:
```typescript
{
  name: "Rule name",
  enabled: true,
  triggerCondition: (booking) => {
    // Return true if conditions match
  },
  action: async (booking) => {
    // Send email/SMS or update status
  }
}
```

**To modify a rule:**
1. Edit the `triggerCondition` function
2. Edit the `action` function
3. Deploy changes

**To add a new rule:**
1. Add new object to `AUTOMATION_RULES` array
2. Insert into `automation_rules` table via SQL
3. Deploy

---

## 📊 Monitoring Automations

### Activity Log

Every automation execution is logged:
- When it ran
- Which booking it affected
- What action was taken
- Result (success/failure)

**View logs**:
1. Go to booking detail page
2. Scroll to "Activity Log"
3. Look for entries like "Automation: Rule name"

### Admin Notifications

When an automation sends an email to admin, you'll receive it at the `RESEND_ADMIN_EMAIL` address.

### Cron Logs

Check Vercel cron logs:
1. Go to Vercel Dashboard
2. Click your project
3. Go to "Cron Jobs"
4. View execution history

---

## 🚨 Troubleshooting

### Automations not running

**Possible causes**:
1. Cron job not configured in Vercel
2. `CRON_SECRET` mismatch
3. All rules are disabled

**Fix**:
1. Check `vercel.json` has cron config
2. Verify environment variable matches
3. Enable at least one rule

### Customer not receiving emails

**Possible causes**:
1. Email address is wrong
2. Resend API key is invalid
3. Domain not verified (emails in spam)

**Fix**:
1. Check customer email in booking
2. Verify Resend API key
3. Verify your sending domain

### Too many reminder emails

**Possible causes**:
1. Multiple rules triggering for same booking
2. Rules running more frequently than expected

**Fix**:
1. Review which rules are enabled
2. Adjust timing conditions
3. Disable overly aggressive rules

---

## 💡 Best Practices

1. **Leave most rules ON** - they're designed to be helpful, not spammy

2. **Monitor the first week** - watch activity logs to see what triggers

3. **Adjust timing if needed** - 48h follow-up too soon? Change it to 72h

4. **Customize email templates** - make them sound like you

5. **Use automations as a safety net** - don't rely on them exclusively

6. **Review "bad lead" bookings monthly** - make sure nothing valuable was marked wrong

7. **Test before going live** - create test bookings and watch automations fire

---

## 📈 Expected Results

With all rules enabled:

**Week 1**:
- 80% of inquiries called within 24h (Rule 1 reminder)
- 60% of quotes followed up (Rule 3)
- 0 forgotten deposit payments (Rules 4-5)

**Month 1**:
- 15-20% increase in response rate
- 10% more reviews collected
- Cleaner pipeline (stale leads auto-marked)

**Long Term**:
- Consistent follow-up process
- Fewer "I forgot to pay" excuses
- More customer touchpoints
- Better reviews

---

## 🎯 Quick Reference

| Rule | Trigger | Delay | Action |
|------|---------|-------|--------|
| 1 | Status = inquiry | 24h | Email admin |
| 2 | Status = called_not_answered | 48h | Email admin |
| 3 | Quote sent, no response | 48h | Email customer |
| 4 | Invoice due soon | 3d before | Email customer |
| 5 | Invoice overdue | 1d after | Email customer |
| 6 | Move day approaching | 2d before | Email customer |
| 7 | Job completed | 2d after | Email customer |
| 8 | Stale inquiry | 7d | Update status |

---

**Remember**: Automations work for you 24/7. Set them up once, then focus on delivering great service.
