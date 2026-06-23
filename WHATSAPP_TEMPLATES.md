# WhatsApp Message Templates — Ample Removals (Twilio + Meta)

This is the paste-ready list of WhatsApp templates to create in
**Twilio Console → Messaging → Content Template Builder**.

## Why these are needed

WhatsApp does **not** let a business send free-form messages first. You can only
send free text within **24 hours of the customer messaging you**. Every automated
message our platform sends (quote ready, reminders, driver ETA, review, etc.) is
**business-initiated**, so WhatsApp requires a **pre-approved template**.

> Proof: a free-form test send was *accepted* by Twilio but came back
> `undelivered` with **error 63016** ("outside the allowed window — send a Message
> Template"). Templates fix this.

## Rules to follow when creating each one (so Meta approves them)

- **Name:** lowercase letters, numbers and underscores only — no spaces, no
  capitals. Use the names below **exactly**.
- **Category:** pick **UTILITY** for transactional messages (tied to a specific
  job) and **MARKETING** for promotions. Tagged per template below. Meta prices
  UTILITY lower and approves it faster.
- **Variables:** numbered `{{1}}`, `{{2}}`, … Meta won't approve a body that
  **starts or ends with a variable**, or that has **two variables touching**. The
  bodies below already obey this (they end in fixed text).
- **Sample values:** Twilio asks for an example for each `{{n}}` on submission —
  use the samples shown.
- **Language:** English (UK) — `en_GB`.

---

## A. Core customer journey — create first (Category: UTILITY)

### `quote_ready`
Variables: `{{1}}` first name · `{{2}}` service · `{{3}}` total · `{{4}}` reference
```
Hi {{1}}, your Ample Removals quote is ready!

Service: {{2}}
Total: {{3}}
Ref: {{4}}

Full details and your confirmation link have been emailed to you. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `Home & Business Removals` · `GBP 485.00` · `RMV-2026-X8K4P`

### `quote_followup`
Variables: `{{1}}` first name · `{{2}}` total · `{{3}}` confirm link · `{{4}}` reference
```
Hi {{1}}, just following up on your Ample Removals quote of {{2}} (ref {{4}}).

To confirm your booking, tap here: {{3}}

Prefer to talk it through? Call us on 0333 577 2070.
```
Sample: `Sam` · `GBP 485.00` · `https://www.ampleremovals.com/confirm-quote/...` · `RMV-2026-X8K4P`

### `booking_confirmed`
Variables: `{{1}}` first name · `{{2}}` reference · `{{3}}` service · `{{4}}` date
```
Booking confirmed!

Hi {{1}}, your Ample Removals booking is all set:

Ref: {{2}}
Service: {{3}}
Date: {{4}}

There's nothing else you need to do right now — we'll be in touch as your date approaches. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `RMV-2026-X8K4P` · `Home & Business Removals` · `30/06/2026`

### `final_invoice_sent`
Variables: `{{1}}` first name · `{{2}}` invoice number · `{{3}}` amount · `{{4}}` reference
```
Hi {{1}}, your Ample Removals final balance invoice {{2}} for {{3}} has been emailed to you (ref {{4}}).

Please pay by bank transfer — the details are in the email. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `INV-2026-00123` · `GBP 1,250.00` · `RMV-2026-X8K4P`

### `review_request`
Variables: `{{1}}` first name · `{{2}}` review link
```
Hi {{1}}, thank you for choosing Ample Removals! We hope your move went smoothly.

If you were happy with our service, a quick Google review would mean the world to us: {{2}}

Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `https://g.page/r/Cc7Zw55gchwDEAI/review`
> Note: Meta sometimes re-classifies review requests as **MARKETING**. If it gets
> rejected as UTILITY, resubmit it as MARKETING.

### `address_confirmation_request`
Variables: `{{1}}` first name · `{{2}}` confirm link · `{{3}}` reference
```
Hi {{1}}, please confirm your pickup and delivery addresses for your upcoming move with Ample Removals (ref {{3}}).

Confirm here: {{2}}

It only takes a moment. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `https://www.ampleremovals.com/confirm-address/...` · `RMV-2026-X8K4P`

### `booking_details_updated`
Variables: `{{1}}` first name · `{{2}}` what changed · `{{3}}` reference
```
Hi {{1}}, we've updated the {{2}} on your Ample Removals booking (ref {{3}}).

If anything doesn't look right, please call us on 0333 577 2070.
```
Sample: `Sam` · `move date` · `RMV-2026-X8K4P`

### `reschedule_confirmed`
Variables: `{{1}}` first name · `{{2}}` new date · `{{3}}` reference
```
Hi {{1}}, your Ample Removals move has been rescheduled to {{2}} (ref {{3}}).

We've got you covered. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `05/07/2026` · `RMV-2026-X8K4P`

---

## B. Driver ETA & move-day updates (Category: UTILITY)

### `driver_on_the_way`
Variables: `{{1}}` driver name · `{{2}}` ETA · `{{3}}` reference · `{{4}}` tracking link
```
Your Ample Removals driver {{1}} is on the way! Estimated arrival: {{2}} (job {{3}}).

Track them live here: {{4}}

See you soon!
```
Sample: `James` · `10:30` · `RMV-2026-X8K4P` · `https://www.ampleremovals.com/track/...`

### `driver_20_mins_away`
Variables: `{{1}}` reference · `{{2}}` tracking link
```
Your Ample Removals driver is about 20 minutes away (job {{1}}). Please get ready.

Track live: {{2}}

See you shortly!
```
Sample: `RMV-2026-X8K4P` · `https://www.ampleremovals.com/track/...`

### `driver_10_mins_away`
Variables: `{{1}}` reference
```
Almost there! Your Ample Removals driver is about 10 minutes away for job {{1}}. Please be ready.
```
Sample: `RMV-2026-X8K4P`

### `driver_15_mins_to_delivery`
Variables: `{{1}}` delivery address · `{{2}}` reference
```
Your Ample Removals driver will arrive at your delivery address ({{1}}) in about 15 minutes for job {{2}}. Please be ready to receive your items.
```
Sample: `12 High St, Manchester, M1 2AB` · `RMV-2026-X8K4P`

### `driver_arrived`
Variables: `{{1}}` reference
```
Your Ample Removals driver has arrived for job {{1}}. Please come to the door.
```
Sample: `RMV-2026-X8K4P`

### `driver_running_late`
Variables: `{{1}}` first name · `{{2}}` minutes · `{{3}}` reference
```
Hi {{1}}, quick update — your Ample Removals driver is running about {{2}} minutes behind schedule (job {{3}}). Sorry for the delay, we'll be with you shortly. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `15` · `RMV-2026-X8K4P`

### `move_reminder_7_day`
Variables: `{{1}}` first name · `{{2}}` date · `{{3}}` reference
```
Hi {{1}}, your move with Ample Removals is one week away ({{2}}, ref {{3}}).

This week: start packing non-essentials, order materials and declutter. We'll send more reminders as the day gets closer. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `30/06/2026` · `RMV-2026-X8K4P`

### `move_reminder_5_day`
Variables: `{{1}}` first name · `{{2}}` date · `{{3}}` reference
```
Hi {{1}}, five days to go until your move ({{2}}, ref {{3}}).

Today's tip: notify your utilities (gas, electric, water, internet) and update your address with banks, the DVLA and your GP. Any questions, call us on 0333 577 2070.
```
Sample: `Sam` · `30/06/2026` · `RMV-2026-X8K4P`

### `move_reminder_3_day`
Variables: `{{1}}` first name · `{{2}}` date · `{{3}}` reference
```
Hi {{1}}, your move with Ample Removals is in three days ({{2}}, ref {{3}}).

Start packing non-essentials, notify your utilities and arrange any parking permits. Need help? Call us on 0333 577 2070.
```
Sample: `Sam` · `30/06/2026` · `RMV-2026-X8K4P`

### `move_reminder_1_day`
Variables: `{{1}}` first name · `{{2}}` reference
```
Hi {{1}}, moving day is tomorrow! (Ref {{2}}.)

Final checklist: pack an essentials box, clear pathways, ensure parking access and take meter readings. We'll update you as our driver heads your way. Call us on 0333 577 2070.
```
Sample: `Sam` · `RMV-2026-X8K4P`

### `weather_alert`
Variables: `{{1}}` date · `{{2}}` weather type · `{{3}}` reference
```
Weather update for your move on {{1}}: {{2}} is expected (ref {{3}}).

Don't worry — we're prepared and will protect your items. Need to reschedule? Call us on 0333 577 2070.
```
Sample: `30/06/2026` · `heavy rain` · `RMV-2026-X8K4P`

---

## C. Driver-facing (Category: UTILITY)

### `driver_job_assigned`
Variables: `{{1}}` driver name · `{{2}}` reference · `{{3}}` date · `{{4}}` respond link
```
Hi {{1}}, you've been assigned a new job with Ample Removals.

Ref: {{2}}
Date: {{3}}

View the details and accept or decline here: {{4}}

Thank you.
```
Sample: `James` · `RMV-2026-X8K4P` · `30/06/2026` · `https://www.ampleremovals.com/drivers/respond/...`

### `driver_jobs_tomorrow`
Variables: `{{1}}` driver name · `{{2}}` job count · `{{3}}` date
```
Hi {{1}}, you have {{2}} job(s) tomorrow ({{3}}) with Ample Removals.

Open the driver app for full details and live tracking.
```
Sample: `James` · `2` · `30/06/2026`

---

## D. Promotional — optional / later (Category: MARKETING)

### `anniversary_offer`
Variables: `{{1}}` first name
```
Happy one-year move anniversary, {{1}}!

Enjoy 15% off your next move or service with Ample Removals. Valid 30 days. Call 0333 577 2070 and mention: 1-YEAR ANNIVERSARY.
```
Sample: `Sam`

### `loyalty_offer_3_month`
Variables: `{{1}}` first name · `{{2}}` reference
```
Hi {{1}}, it's been three months since your move!

As a valued Ample Removals customer, enjoy 20% off your next move. Valid 30 days. Quote {{2}} when you call 0333 577 2070.
```
Sample: `Sam` · `RMV-2026-X8K4P`

### `referral_invite`
Variables: `{{1}}` first name · `{{2}}` referral code · `{{3}}` referral link
```
Hi {{1}}, refer a friend to Ample Removals and you BOTH get £20!

Your code: {{2}}
Share: {{3}}

No limit — refer as many friends as you like.
```
Sample: `Sam` · `SAM20` · `https://www.ampleremovals.com/r/SAM20`

### `seasonal_campaign`
Variables: `{{1}}` first name · `{{2}}` offer text
```
Hi {{1}}, a special seasonal offer from Ample Removals: {{2}}

Call 0333 577 2070 to book. T&Cs apply.
```
Sample: `Sam` · `20% off all house clearances booked in June`

---

## Templates you do NOT need

The WhatsApp alerts that go to **your own phone** (new booking, low-rating, driver
running late, addresses-not-confirmed) don't need templates — those still arrive by
**SMS + push notification**, and you can WhatsApp your Twilio number once to keep
that 24-hour thread open.

---

## After the templates are approved

Once these are **Approved** in Twilio, each gets a **Content SID** (`HX…`). The
final step is on the code side: switch `sendWhatsApp` to send by **Content SID +
variables** instead of free text, and map each message type to its template.
Ask Claude to "wire up the approved WhatsApp templates" and provide the SIDs (or
they can be fetched from the Twilio API).

**Summary:** 20 customer/driver templates (UTILITY) + 4 promotional (MARKETING) =
24 total. Start with section A, then B and C; D is optional.
