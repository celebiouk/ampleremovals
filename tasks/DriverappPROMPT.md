## CONTEXT — AMPLE REMOVALS DRIVER MOBILE APP

The Ample Removals platform already has a fully built web version for drivers. 
I now need to build a dedicated mobile app for drivers at the route /driver-app. 
This is a React Native app built with Expo. It must have 100% feature parity with 
the existing web driver portal and then add the new mobile-specific features 
described below.

Do not rebuild what already exists in a different way. Mirror the existing web 
driver portal features exactly — same logic, same API calls, same Supabase tables — 
then layer the new mobile features on top.

---

## TECH STACK

- React Native with Expo (managed workflow)
- Supabase (existing project — same database, same auth, same storage)
- Firebase Cloud Messaging for push notifications
- Google Maps Distance Matrix API for ETA calculations (4 calls maximum per journey leg)
- Device GPS via Expo Location
- Expo Camera for photo capture
- Expo Signatures or react-native-signature-canvas for digital signatures
- Tailwind via NativeWind or StyleSheet for styling
- React Navigation for screen routing
- Async storage for offline data sync

---

## PART 1 — FULL PARITY WITH EXISTING WEB DRIVER PORTAL

Build every feature that already exists in the web driver portal into this mobile 
app with identical functionality. This includes but is not limited to:

### Authentication
- Driver login with email and password via Supabase Auth
- Session persistence — driver stays logged in between app opens
- Secure logout

### Dashboard / Home Screen
- Driver sees their jobs for today in sequence
- Each job card shows: customer name, pickup address, delivery address, 
  time slot, job reference, status, and any special notes
- Jobs ordered by the AI-optimised sequence built the night before
- Driver can see tomorrow's jobs too
- Status indicators per job: Scheduled, In Progress, Completed

### Job Detail Screen
- Full job information: customer name, phone number, pickup address, 
  delivery address, items list, special instructions, access notes
- Parking instructions if available
- Contact customer button (calls or WhatsApps directly)
- Map preview of pickup and delivery locations
- All job documents accessible

### Clock In / Clock Out
- Driver clocks in at start of day
- Driver clocks out at end of day
- Hours tracked automatically in Supabase for payroll
- Break start and break end buttons
- All timestamps stored against driver profile

### Schedule View
- Weekly calendar view of all assigned jobs
- Tap any job to see full detail
- Past jobs visible with completed status

### Notifications
- All push notifications from Firebase displayed correctly
- In-app notification centre showing history of all notifications received
- Job alerts, schedule changes, admin messages all displayed

### Profile & Settings
- Driver profile: name, photo, licence details, vehicle assigned
- Notification preferences
- App version and support contact

---

## PART 2 — NEW MOBILE-SPECIFIC FEATURES

These features do not exist in the web version and are being built for the 
mobile app only. They form the core of the driver's on-the-road experience.

---

### FEATURE 1 — SMART ETA ENGINE (4 API CALLS MAXIMUM PER JOURNEY LEG)

This is the most critical feature of the driver app. The system must calculate 
and trigger ETAs intelligently using a maximum of 4 Google Maps Distance Matrix 
API calls per journey leg (pickup leg and delivery leg are treated separately — 
4 calls each maximum).

The trigger logic works as follows:

---

#### CALL 1 — Driver Starts Journey

Trigger: Driver taps "Start Journey to Pickup" on the job screen.

Actions:
- App captures driver's current GPS coordinates via Expo Location
- App calls Google Maps Distance Matrix API with:
  - Origin: driver current GPS coordinates
  - Destination: pickup location postcode/coordinates
  - Departure time: now
  - Traffic model: best_guess
- API returns: duration in seconds and ETA timestamp
- System stores in Supabase against the job record:
  - journey_start_time (actual timestamp when driver tapped start)
  - call1_eta_timestamp (the exact ETA time returned by API)
  - call1_duration_seconds (total journey duration in seconds)
  - call1_triggered_at (timestamp of this API call)
- System calculates: scheduled_call2_time = NOW minus call1_duration_seconds 
  plus call1_duration_seconds minus 1200 seconds (20 minutes)
  (in plain English: schedule Call 2 for when 20 minutes should remain 
  based on Call 1 duration)
- System fires immediately:
  - Customer notification via email, WhatsApp, and SMS: 
    "Your Ample Removals driver has started their journey to you. 
    Estimated arrival: [call1_eta_timestamp formatted as time]. 
    Track your driver: [live tracking link]"
  - Admin dashboard notification: 
    "Driver [Name] has started journey to Pickup — [customer name] 
    [pickup postcode]. ETA: [time]"

---

#### CALL 2 — 20-Minute Warning Trigger

Trigger: System timer fires at scheduled_call2_time calculated from Call 1.

Actions:
- App captures driver's current GPS coordinates
- App calls Google Maps Distance Matrix API with:
  - Origin: driver current GPS coordinates
  - Destination: pickup location coordinates
  - Departure time: now
  - Traffic model: best_guess
- API returns: updated duration in seconds and updated ETA timestamp
- System stores:
  - call2_eta_timestamp
  - call2_duration_seconds
  - call2_triggered_at
- System evaluates the result:
  - If duration is between 1320 seconds (22 minutes) and 900 seconds 
    (15 minutes) → fire 20-minute notification
  - If duration is greater than 1320 seconds → driver is still more than 
    22 minutes away, delay Call 2 notification, reschedule check for 
    5 minutes later
  - If duration is less than 900 seconds → driver is less than 15 minutes 
    away, skip 20-minute notification, go straight to scheduling Call 3
- If 20-minute notification fires:
  - Customer email: "Hi [Name], your Ample Removals driver is approximately 
    20 minutes away. Please ensure everything is ready. Job ref: [REF]. 
    Track live: [link]"
  - Customer WhatsApp: "Your driver is 20 minutes away. Get ready! 
    Track live: [link]"
  - Customer SMS: "Ample Removals: Driver [Name] is 20 mins away. 
    Job [REF]. Track: [link]"
  - Admin dashboard notification: "Driver [Name] — 20 mins from 
    Pickup [customer name] [postcode]"
- System calculates scheduled_call3_time:
  - Take call2_eta_timestamp
  - Subtract 10 minutes
  - That is the exact time to fire Call 3
  - Store scheduled_call3_time in Supabase

---

#### CALL 3 — 10-Minute Warning Trigger

Trigger: System timer fires at scheduled_call3_time calculated from Call 2.

Actions:
- App captures driver's current GPS coordinates
- App calls Google Maps Distance Matrix API with:
  - Origin: driver current GPS coordinates
  - Destination: pickup location coordinates
  - Departure time: now
  - Traffic model: best_guess
- API returns: updated duration in seconds and updated ETA timestamp
- System stores:
  - call3_eta_timestamp
  - call3_duration_seconds
  - call3_triggered_at
- System evaluates the result:
  - If duration is between 720 seconds (12 minutes) and 480 seconds 
    (8 minutes) → fire 10-minute notification
  - If duration is greater than 720 seconds → driver still more than 
    12 minutes away, reschedule check for 3 minutes later
  - If duration is less than 480 seconds → driver under 8 minutes away, 
    skip 10-minute notification, activate GPS proximity monitoring for arrival
- If 10-minute notification fires:
  - Customer email: "Hi [Name], your driver is now 10 minutes away. 
    Please be ready at [address]."
  - Customer WhatsApp: "Almost there! Your driver is 10 minutes away."
  - Customer SMS: "Ample Removals: Driver 10 mins away. Job [REF]"
  - Admin dashboard notification: "Driver [Name] — 10 mins from 
    Pickup [customer name] [postcode]"
- After Call 3 fires, activate GPS proximity monitoring (Call 4 logic)

---

#### CALL 4 — ARRIVED DETECTION (GPS Only — No API Call)

Trigger: Continuous GPS comparison — no Google Maps API call used here.

This is pure device GPS logic. No API cost.

Actions:
- After Call 3 completes, app begins checking driver GPS every 10 seconds
- App compares driver GPS coordinates against pickup location coordinates
- Uses Haversine formula to calculate straight-line distance between 
  driver and pickup location
- When driver is within 80 metres of the pickup location coordinates:
  - Arrived screen automatically pops up full screen on driver app
  - Screen cannot be dismissed — driver must interact with it
  - Driver taps "I Have Arrived" button to confirm
- On driver tapping confirmed arrived:
  - Job status updates to Arrived in Supabase
  - Timestamp stored: arrived_at
  - Customer notification fires:
    - Email: "Your Ample Removals driver has arrived at your location. 
      Please come to the door."
    - WhatsApp: "Your driver is outside!"
    - SMS: "Ample Removals: Driver has arrived. Job [REF]"
  - Admin dashboard notification: 
    "Driver [Name] — Arrived at Pickup [customer name] [postcode] [time]"
  - App immediately transitions to Pickup Confirmation Screen 
    (chain of custody flow)

---

#### SAME 4-CALL LOGIC APPLIES TO DELIVERY LEG

When driver taps "Start Journey to Delivery" after completing pickup 
confirmation, the exact same 4-call ETA engine runs again independently 
for the delivery leg with delivery location as the destination.

All 4 calls reset. All timers reset. All notifications use delivery 
language instead of pickup language.

---

#### IMPORTANT RULES FOR ETA ENGINE

- Store every API call result in Supabase immediately — never rely on 
  in-memory state for ETA data
- If app goes to background during a journey, timers must persist and 
  fire correctly using background tasks via Expo TaskManager
- If driver loses internet connection, queue the API call and fire it 
  the moment connection is restored
- Never fire the same notification twice — store notification_sent flags 
  in Supabase for call2_notification_sent and call3_notification_sent
- If driver somehow arrives before Call 2 or Call 3 fire, GPS proximity 
  detection overrides everything and goes straight to arrived screen
- Log every API call with: timestamp, driver coordinates sent, 
  destination coordinates, duration returned, ETA returned, 
  notification fired yes or no — all stored in a journey_eta_log table

---

### FEATURE 2 — PICKUP CHAIN OF CUSTODY SCREEN

This screen appears immediately after driver taps "I Have Arrived" at 
pickup location. Driver hands phone to customer or authorised contact 
at the pickup address.

Screen flow in exact order:

Step 1 — Full Name Entry
- Large prominent text input
- Label: "Please enter your full name to confirm you are authorised 
  to release these items"
- Keyboard opens automatically
- Name cannot be blank — validation required
- Continue button only activates when name is entered
- Once submitted: name locked with timestamp, cannot be edited

Step 2 — Photo Capture
- Camera opens automatically via Expo Camera
- Full screen camera view
- Instruction text at top: "Take photos of all items before collection"
- Each photo taken is shown as a thumbnail at the bottom
- Add more photos button always visible
- Minimum 1 photo required — cannot proceed without at least 1
- No maximum — unlimited photos allowed
- Each photo automatically:
  - Timestamped with exact time of capture
  - GPS tagged with exact coordinates of pickup location
  - Uploaded immediately to Supabase Storage in folder: 
    jobs/[job_ref]/pickup/photos/
  - Visible to admin in real time on dashboard
  - Cannot be deleted after upload
- Continue button only activates after minimum 1 photo uploaded

Step 3 — Comments
- Large multi-line text area
- Label: "Please note any existing damage, condition issues, or 
  anything relevant about the items before collection"
- Placeholder: "Example: sofa has existing scratch on left arm, 
  box 3 contents are loose"
- Optional — can be left blank
- Continue button always active on this screen

Step 4 — Digital Signature
- Full width signature canvas using react-native-signature-canvas
- Label: "Please sign below to confirm these items have been 
  released for collection"
- Clear button to redo signature
- Confirm button to submit
- Signature must not be blank — validation checks canvas is not empty
- On confirm:
  - Signature saved as PNG image to Supabase Storage:
    jobs/[job_ref]/pickup/signature.png
  - Exact timestamp stored: pickup_signature_at
  - All pickup data locked — name, photos, comments, signature 
    all frozen and cannot be modified after this point
  - pickup_confirmed set to true in jobs table

Step 5 — Pickup Receipt Generated
- System auto-generates branded pickup receipt
- Sent to customer via their preferred channels immediately
- Stored in Supabase Storage: jobs/[job_ref]/pickup/receipt.pdf
- App shows confirmation screen to driver:
  "Pickup confirmed. Customer has been sent their receipt. 
  Tap below to start journey to delivery."
- Button: "Start Journey to Delivery"
- Tapping this button resets and starts the 4-call ETA engine 
  for the delivery leg

---

### FEATURE 3 — DELIVERY CHAIN OF CUSTODY SCREEN

Identical flow to pickup chain of custody with these differences:

- All labels reference receiving not releasing
- Step 1 label: "Please enter your full name to confirm you are 
  authorised to receive these items"
- Step 2 instruction: "Take photos of all items on delivery"
- Photos stored in: jobs/[job_ref]/delivery/photos/
- Step 3 label: "Please note any concerns about the condition of 
  items received"
- Step 4 label: "Please sign below to confirm you have received 
  these items"
- Signature stored in: jobs/[job_ref]/delivery/signature.png
- delivery_confirmed set to true in jobs table

After receiving person signs, screen returns to driver and shows:

"Delivery confirmed by [Receiving Person Name] at [timestamp].
Tap below to mark this job as complete."

Large prominent button: COMPLETE JOB

Driver must manually tap COMPLETE JOB — this does not happen 
automatically.

On COMPLETE JOB tapped:
- Job status set to Completed in Supabase
- completed_at timestamp stored
- Invoice generation triggered automatically by system
- Full delivery receipt PDF generated and emailed to customer
- Review request scheduled for 30 minutes after completion
- Admin dashboard notification: 
  "Job [REF] completed — [time]. Invoice triggered."
- App returns driver to main job list
- Completed job shown with green completed status

---

### FEATURE 4 — LIVE TRACKING LINK FOR CUSTOMERS

When driver starts any journey leg, system generates a unique 
live tracking URL for that job:
ampleremovals.com/track/[unique_token]

This page shows:
- Driver first name only (not full name)
- Vehicle type
- Live map with driver location updating every 60 seconds
- Estimated arrival time (updated from each ETA API call)
- Job reference
- Company branding

The tracking page is publicly accessible via the unique token 
— no login required for the customer.

Driver location on tracking page updates from the GPS coordinates 
stored in Supabase every 60 seconds by the driver app.

---

### FEATURE 5 — BACKGROUND GPS & TASK MANAGEMENT

Driver app must continue functioning correctly when in background:

- GPS coordinates sent to Supabase every 60 seconds even when 
  app is in background using Expo TaskManager and 
  Expo Location startLocationUpdatesAsync
- ETA timer triggers fire correctly from background using 
  Expo TaskManager defineTask
- Push notifications received and displayed when app is in background 
  or closed
- If driver locks their phone mid-journey all tracking continues uninterrupted
- Battery optimisation handled correctly — use significant location 
  changes mode when not on active journey to preserve battery, 
  switch to high accuracy mode when journey is active

---

### FEATURE 6 — OFFLINE RESILIENCE

Driver app must handle loss of internet connection gracefully:

- Core job information downloaded and cached locally when driver 
  starts their day so jobs are viewable without internet
- GPS coordinates queued locally when offline and bulk-synced to 
  Supabase when connection restored
- Photos taken offline queued and uploaded when connection restored
- ETA API calls queued and fired when connection restored with 
  note that ETA may have changed
- Signature captures stored locally and synced when connection restored
- Offline status banner shown clearly to driver when no connection detected
- All offline actions logged with the timestamp they were performed 
  not the timestamp they were synced

---

## DATABASE — NEW TABLES & FIELDS REQUIRED

Add these to the existing Supabase schema:

journey_eta_log table:
- id
- job_id (foreign key to jobs)
- driver_id (foreign key to drivers)
- journey_leg (pickup or delivery)
- call_number (1, 2, 3, or arrived)
- triggered_at (timestamp)
- driver_lat (decimal)
- driver_lng (decimal)
- destination_lat (decimal)
- destination_lng (decimal)
- duration_seconds_returned (integer)
- eta_timestamp_returned (timestamp)
- notification_fired (boolean)
- notification_type (20min, 10min, arrived, journey_started)
- scheduled_next_call_at (timestamp)
- created_at

Add to existing jobs table:
- journey_started_at (timestamp)
- call1_eta_timestamp (timestamp)
- call1_duration_seconds (integer)
- scheduled_call2_time (timestamp)
- call2_eta_timestamp (timestamp)
- call2_duration_seconds (integer)
- call2_notification_sent (boolean)
- scheduled_call3_time (timestamp)
- call3_eta_timestamp (timestamp)
- call3_duration_seconds (integer)
- call3_notification_sent (boolean)
- arrived_at (timestamp)
- pickup_confirmed (boolean)
- pickup_confirmed_at (timestamp)
- pickup_contact_name (text)
- pickup_comments (text)
- pickup_signature_url (text)
- delivery_started_at (timestamp)
- delivery_arrived_at (timestamp)
- delivery_confirmed (boolean)
- delivery_confirmed_at (timestamp)
- delivery_contact_name (text)
- delivery_comments (text)
- delivery_signature_url (text)
- completed_at (timestamp)
- live_tracking_token (text, unique)

---

## BUILD ORDER

Build in this exact sequence:

1. Project setup — Expo app at /driver-app, Supabase client configured, 
   Firebase push notifications configured, navigation structure in place

2. Database — add all new tables and fields listed above to existing 
   Supabase schema with correct RLS policies so drivers only see 
   their own jobs

3. Authentication — driver login, session persistence, logout

4. Part 1 parity features — mirror all existing web driver portal 
   features exactly: dashboard, job list, job detail, clock in/out, 
   schedule view, notifications, profile

5. Background GPS — implement Expo TaskManager GPS tracking sending 
   coordinates to Supabase every 60 seconds, test in background mode

6. Smart ETA Engine — implement all 4 calls with timer logic, 
   Supabase logging, and notification triggers for pickup leg first, 
   then delivery leg

7. Live tracking page — build the public customer tracking page 
   at ampleremovals.com/track/[token]

8. Pickup chain of custody — name entry, photo capture, comments, 
   signature, receipt generation

9. Delivery chain of custody — same flow for delivery, complete 
   job button, invoice trigger

10. Offline resilience — implement queuing, local cache, sync logic, 
    offline banner

11. End to end test — simulate a full job from driver tapping start 
    journey through to job completed, verify every notification fires 
    correctly, every photo and signature saves correctly, every ETA 
    call fires at the right time

Start with step 1. Show me the full project structure and Expo 
initialisation command before writing any feature code.






## CONTEXT — AMPLE REMOVALS PLATFORM

I am building a powerful, full-stack removal company management platform for my own business called **Ample Removals** (ampleremovals.com). This is NOT a SaaS product yet — it is being built exclusively for our own internal use first. We will test, refine, and perfect every feature on our own operations before eventually productising it.

The platform must work on:
- **Web app** — for admin (full featured)
- **Mobile app (admin)** — full admin capabilities on the go
- **Mobile app (driver)** — driver-specific portal for the road

**Tech Stack:**
- Next.js 14 (App Router)
- Supabase (database, auth, realtime, storage)
- Stripe (payments and invoicing)
- Resend (email notifications)
- Twilio (WhatsApp Business API and SMS)
- Firebase Cloud Messaging (push notifications)
- HERE Maps API (ETA calculation — 250k free calls/month)
- Device GPS via mobile app (raw coordinate tracking — free)
- Tailwind CSS
- React Native or Expo for mobile apps

---

## WHAT WE ARE BUILDING NOW

We are adding four major interconnected feature pillars to the existing platform. Build them in the order listed. Each pillar must be fully functional, tested, and production-ready before moving to the next.

---

## PILLAR 1 — AI LEAD QUALIFICATION & SALES CONVERSION

### Overview
Every enquiry that comes into Ample Removals — whether through the AI chatbot or a standard booking form — must be instantly qualified, scored, and acted on automatically. The goal is zero leads falling through the cracks and maximum conversion with minimal manual effort from the admin.

### Two Entry Points

**Entry Point A — AI Chatbot**
- An AI-powered chat widget lives on the Ample Removals website
- When a visitor starts a chat, the AI engages them in natural friendly conversation
- AI extracts the following through conversation (BANT qualification):
  - Move date
  - Move size (1-bed, 2-bed, 3-bed house, office, single items etc)
  - Pickup postcode
  - Delivery postcode
  - Services needed (packing, dismantling, storage, specialist items)
  - How they found us
  - Urgency signals from their language
  - Budget (asked naturally — "do you have a rough budget in mind?")
  - Authority (are they the decision maker?)
  - Timeline (when exactly do they need this done?)
- AI maintains a natural human tone throughout — not robotic
- Once sufficient data is collected AI generates a lead record and scores it

**Entry Point B — Booking Form Submission**
- Customer fills in and submits the standard enquiry/booking form without chatting
- The moment the form is submitted AI instantly reads all submitted fields
- AI analyses the data exactly as it would a chatbot conversation
- AI cross-references postcode data to estimate property type, access difficulty, and distance
- AI calculates job complexity and estimated duration
- AI generates a competitive quote recommendation for the admin based on:
  - Distance between postcodes
  - Job size and complexity
  - Services requested
  - Current demand and time of year
  - Our historical average margin on similar jobs
- This appears in the admin dashboard as a one-click action card:

┌─────────────────────────────────────────┐
│  NEW Enquiry — Sarah Jones              │
│  3-bed house Reading → Basingstoke      │
│  Date: 20th July | Packing required     │
│                                         │
│  AI Recommended Quote: £485             │
│  Based on: 47 miles, 3-bed, packing,   │
│  current demand, average margin         │
│                                         │
│  [Edit Quote]      [Send Quote]         │
└─────────────────────────────────────────┘

- Admin clicks Send Quote — it fires instantly to the customer
- Admin can edit the amount first then send
- Quote is sent via email and WhatsApp simultaneously

### Lead Scoring (0–100)

AI scores every lead automatically based on these weighted signals:

| Signal | Condition | Score |
|--------|-----------|-------|
| Move date | Within 2 weeks | +20 |
| Form completeness | All fields filled | +15 |
| Job size | Larger job = higher value | +15 |
| Time of enquiry | Business hours | +10 |
| Traffic source | Referral vs cold | +10 |
| Response speed | Replied within 1 hour | +20 |
| Returning customer | Previously booked | +10 |

### Score Routing & Automation

| Score | Label | Immediate Action | If Admin Takes No Action Within 15 Mins |
|-------|-------|-----------------|----------------------------------------|
| 80–100 | Hot | Alert admin immediately with one-click quote card | Auto-send AI recommended quote, then follow up in 2 hours |
| 60–79 | Warm | Auto-send quote, notify admin | Follow-up sequence continues automatically |
| 40–59 | Nurture | Begin 5-day drip email/WhatsApp sequence | Continues automatically |
| Under 40 | Cold | Weekly check-in message | Continues automatically |

The automation only stops when admin manually:
- Marks the lead as Closed — all follow-ups stop immediately
- Marks the lead as Won — follow-ups stop, job creation is triggered
- Sends a manual custom response — system detects this and pauses automation

### Sentiment & Intent Analysis
AI reads the language of every enquiry for intent signals:

High intent (immediate human alert):
- "We need to move by the 15th"
- "How soon can you come?"
- "We've already got a buyer"
- "Can you do this weekend?"

Low intent (nurture sequence):
- "Just getting some prices"
- "Not sure when yet"
- "Might need someone"

### Postcode Enrichment
On every lead, AI automatically:
- Estimates property type from postcode
- Calculates exact distance between pickup and delivery postcodes
- Estimates job duration based on property size and distance
- Flags access difficulty for known difficult postcodes (city centres, narrow streets, no parking zones)

### Continuous Learning
- Every won or lost lead updates the scoring model
- Weekly insight report surfaces to admin: "Leads from Google with 3-bed moves and dates within 10 days convert at 78%"
- Quote accuracy improves over time based on accepted vs rejected quotes
- System learns which follow-up timing and message types convert best

### Lead Pipeline View
- Admin sees all leads in a Kanban-style pipeline
- Columns: New → Quoted → Followed Up → Won → Closed
- Each card shows lead score, job value, source, and next automated action
- Admin can drag leads between columns manually
- All automation history visible on each lead card

---

## PILLAR 2 — INTELLIGENT ROUTE PLANNING ENGINE

### Overview
Every evening the system builds the optimal route plan for the following day for every driver. During the day the system tracks drivers in real time using device GPS and HERE Maps API for ETA calculations. AI handles the intelligence layer — optimisation, sequencing, deviation detection, and end of day analysis.

### Night Before — Route Build (Runs at 10pm Every Night)

AI pulls together for each driver:
- All confirmed jobs for the next day including pickup and delivery postcodes
- Customer requested time slots and hard deadlines
- Job complexity per stop — number of items, stairs, parking notes, specialist items
- Estimated job duration per stop based on historical data for similar jobs
- Driver start location (home postcode)
- Driver contracted hours and legally required break schedule
- Porter assignments and which jobs require two people

AI checks external data:
- Tomorrow's weather forecast for every postcode on the route
- Known roadworks and planned road closures
- Historical traffic patterns for that specific day of week and time of day

AI builds the optimal job sequence using this logic:
- Cluster logic — groups nearby pickups together before moving on geographically
- Time window anchoring — jobs with hard customer deadlines are locked first and everything else built around them
- Load logic — van capacity is tracked throughout the day. AI will not schedule a large pickup if the van will be full. Drop-offs are sequenced to create space for subsequent pickups
- Urgency override — urgent or premium jobs are automatically front-loaded
- Weather front-loading — if heavy rain or poor weather is forecast for the afternoon, heavy outdoor lifts are moved to the morning
- Porter logic — jobs requiring two people are only scheduled when the porter is available at that time

AI outputs for each driver:
- Exact recommended start time for the day
- Full sequenced job list with:
  - Arrival target time per stop
  - Target completion time per stop
  - Estimated travel time between stops
  - Break slot — timed to the most efficient gap in the route
  - Notes per stop (access instructions, specialist items, customer contact)
- Sent to driver via push notification and visible in driver app the night before

### GPS Tracking — Two Layer System

Layer 1 — Raw GPS (Every 60 Seconds, Free)
- Driver app sends GPS coordinates to Supabase every 60 seconds
- Used for live map display in admin dashboard
- Used for straight-line deviation calculation
- Zero API cost — just device GPS

Layer 2 — HERE Maps ETA (Triggered Only, Not Constant)

HERE Maps API is only called on these specific triggers:

| Trigger | Action |
|---------|--------|
| Driver starts day | Calculate ETA to all stops for the day |
| Driver departs each stop | Recalculate ETA to next stop |
| GPS deviation detected (>500 metres from expected route) | Recalculate ETA immediately |
| ETA threshold approaching (25 mins from next stop) | Confirm ETA to fire 20-min notification accurately |
| Customer taps "Where is my driver?" | On-demand ETA calculation |
| Admin requests ETA update | On-demand ETA calculation |

Deviation Detection (Free — No API Call):
Every 60 seconds:
→ Read driver GPS coordinates from database
→ Calculate straight line distance from expected route point
→ If deviation > 500 metres → call HERE Maps API to recalculate
→ If deviation < 500 metres → do nothing, no API call

### Real-Time Late Detection & Response

When AI detects the driver cannot reach the next stop by the scheduled time:
1. Calculates new ETA for every remaining stop in the sequence
2. System fires customer notification automatically (see Pillar 3 for notification detail)
3. Admin dashboard shows a red alert with the delay details
4. AI recalculates whether all remaining jobs can still be completed today
5. If a job is at risk of not being completed, admin is alerted:
   "Alert: At current pace Job 5 (RG26 drop-off) cannot be completed before 6pm. Recommend calling customer now to reschedule or deploying second driver."
6. Admin receives push notification on mobile with recommended action

### Break Management
- System tracks hours worked per driver continuously using clock-in/out and GPS movement data
- Under Working Time Regulations: mandatory 30-minute break after 6 hours
- AI slots the break into the most efficient gap — near a services station, between two jobs with natural dead time
- If driver is approaching 6 hours without a break, driver app alerts:
  "Ahmed has been working 5hrs 45mins. Break required within 15 minutes. Nearest recommended stop: Fleet Services — 8 mins ahead on your route."
- Break compliance logged automatically for legal records

### Job Time Targets
- Every stop has an AI-calculated target completion time
- Driver sees on their app: "Pickup 2 — target: 20 minutes. Arrived 09:05. Target completion: 09:25."
- If driver is still at the stop past target time, app sends a gentle nudge:
  "You are 5 minutes over on this stop. Wrap up now to stay on schedule. Next customer expects you at 09:45."
- Over time AI learns real durations per job type, driver, and area — and auto-corrects future estimates

### End of Day Debrief (Auto-Generated)
At the end of each driver's day AI generates a debrief visible in admin dashboard:
- Planned vs actual time per stop
- Total miles driven vs optimal route miles
- Route efficiency score (percentage)
- Any late arrivals and reason logged
- Driver performance score for the day
- Estimated fuel cost for the day based on miles and vehicle type
- Suggestions for improving tomorrow's route
- Example insight: "3 jobs ran over time today — all involved stairs. Recommend adding 10 minutes to all stair jobs in future scheduling."

---

## PILLAR 3 — PICKUP & DELIVERY NOTIFICATION SYSTEM & CHAIN OF CUSTODY

### Overview
This pillar handles all customer-facing and admin-facing communications throughout the job day, plus the full digital chain of custody at every pickup and delivery point. Everything in this pillar is handled by the system — zero AI involved. This is pure logic, triggers, and rules.

### Notification Channels

| Recipient | Channel |
|-----------|---------|
| Customer | Email (Resend) + WhatsApp (Twilio) + SMS (Twilio) |
| Admin | Dashboard notification only (web + mobile app push via Firebase) |

Customer chooses preferred channels at booking. System respects their preference and only sends through chosen channels.

### Trigger Points & Messages

20 Minutes Before Arrival (System Triggered)
Triggered when HERE Maps ETA reaches 20 minutes or less to next stop.

Customer email:
"Hi [Name], your Ample Removals driver [Driver Name] is approximately 20 minutes away. Please ensure everything is ready. Your job reference is [REF]. Track your driver live: [link]"

Customer WhatsApp:
"Hi [Name] Your driver is 20 mins away! Get ready. Track live: [link]"

Customer SMS:
"Ample Removals: Driver [Name] is 20 mins away. Job [REF]. Track: [link]"

Admin dashboard notification only:
"Driver Ahmed — 20 mins from Pickup 1 (RG1 4AB — Mrs Johnson)"

---

10 Minutes Before Arrival (System Triggered)

Customer email:
"Hi [Name], your driver is now 10 minutes away. Please be ready at [address]."

Customer WhatsApp:
"Almost there! Your driver is 10 mins away"

Customer SMS:
"Ample Removals: Driver 10 mins away. Job [REF]"

Admin dashboard notification only:
"Driver Ahmed — 10 mins from Pickup 1"

---

Driver Arrived (System Triggered)
Triggered when driver taps "I've Arrived" on the driver app.

Customer email:
"Your Ample Removals driver has arrived at your location. Please come to the door."

Customer WhatsApp:
"Your driver is outside!"

Customer SMS:
"Ample Removals: Driver has arrived. Job [REF]"

Admin dashboard notification only:
"Driver Ahmed — Arrived at Pickup 1 (09:14am)"

---

Running Late (System Triggered)
Triggered when recalculated ETA exceeds scheduled arrival time.

Customer email:
"Hi [Name], your driver is running approximately [X] minutes behind schedule. Your updated arrival time is [new ETA]. We apologise for the inconvenience."

Customer WhatsApp:
"Quick update — your driver is running [X] mins late. New ETA: [time]. Sorry for the delay."

Customer SMS:
"Ample Removals: Driver running [X] mins late. New ETA [time]. Job [REF]"

Admin dashboard notification (elevated priority):
"Driver Ahmed running 25 mins late on Job RG14-004. Customer notified automatically."

---

Job Completed (System Triggered)
Triggered when driver manually taps "Complete Job" on driver app.

Customer email:
Full branded delivery receipt as PDF attachment including job reference, timestamps, driver name, pickup contact name and signature, delivery contact name and signature, all photos, and any comments noted.

Customer WhatsApp:
"Your Ample Removals job is complete. Thank you for choosing us. Your receipt has been emailed. We would love your feedback: [review link]"

Customer SMS:
"Ample Removals: Job [REF] complete. Receipt sent to your email. Thank you!"

Admin dashboard notification only:
"Job [REF] completed — 14:32pm. Invoice triggered automatically."

The same trigger structure applies identically for delivery stops.

### Digital Chain of Custody — Pickup Flow

When driver taps "I've Arrived" at a pickup location, the driver app transitions to the Pickup Confirmation Screen. Driver hands phone or tablet to the customer or authorised contact at the pickup location.

Screen 1 — Full Name Entry
- Large text input field
- Label: "Please enter your full name to confirm you are authorised to release these items"
- Name is locked and timestamped on submission — cannot be edited after

Screen 2 — Photo Capture
- Camera opens directly
- Contact photographs all items before they are loaded
- Minimum 1 photo required — no maximum limit
- Each photo is automatically:
  - Timestamped
  - GPS tagged to the exact pickup location
  - Uploaded instantly to Supabase Storage against the job record
  - Visible to admin in real time in the dashboard
- Photos cannot be deleted after upload

Screen 3 — Comments
- Large text area
- Label: "Please note any existing damage, condition issues, or anything relevant about the items before collection"
- Optional but prominently displayed
- Placeholder examples: "Sofa already has scratch on left arm", "Box contents shifting"

Screen 4 — Digital Signature
- Full width signature canvas
- Label: "Please sign below to confirm these items have been released for collection"
- Clear button to redo signature
- Confirm button to lock
- On confirm: signature saved as image, timestamp locked, all data frozen — nothing editable after this point

Screen 5 — Pickup Receipt Auto-Generated and Sent
Immediately after signature is confirmed:
- Branded pickup receipt generated
- Sent to customer via their preferred channels
- Stored permanently against the job record in Supabase

### Digital Chain of Custody — Delivery Flow

Identical structure to pickup flow with these differences:
- Label changes to "confirm you are authorised to receive these items"
- Photos are of items being delivered — condition on arrival
- Comments field label: "Please note any concerns about condition of items received"
- Signature confirms receipt not release

After receiving person signs, driver sees:

"Delivery confirmed by [Receiving Person Name] at [timestamp]. Tap below to mark job as complete."

[COMPLETE JOB button]

Driver manually taps Complete Job. This is the final action that triggers invoice generation, receipt email, and job closure.

### Permanent Job Evidence Pack

Every completed job automatically generates a permanent evidence pack stored in Supabase and accessible forever from the admin dashboard:

JOB #AR-2024-0847
─────────────────────────────────────────
PICKUP
  Time: 09:14am — [date]
  Location: 14 Reading Road, RG1 4AB
  Released by: John Smith
  Signature: [image stored in Supabase]
  Photos: 6 images [view all]
  Comments: "Sofa scratch noted pre-collection"

TRANSIT
  Driver: Ahmed Hassan
  Vehicle: VN23 XYZ
  Departed pickup: 09:58am
  Arrived delivery: 11:12am

DELIVERY
  Time: 11:12am — [date]
  Location: 8 Brook Lane, RG21 7PQ
  Received by: Sarah Jones
  Signature: [image stored in Supabase]
  Photos: 8 images [view all]
  Comments: "All items received in good condition"
─────────────────────────────────────────

- Downloadable as PDF at any time
- Stored for minimum 7 years
- Accessible by admin from web and mobile
- Attached automatically to the final customer receipt email

---

## PILLAR 4 — JOB SCHEDULING & DRIVER/PORTER ASSIGNMENT

### Overview
AI handles the intelligent assignment of every job to the right driver and porter combination. The admin sees a visual board similar to Monday.com where jobs flow through stages and assignments are managed. AI does the heavy thinking — admin has full override control at all times.

### Job Board — Visual Pipeline

Kanban-style board with these columns:
Enquiry → Quoted → Confirmed → Scheduled → In Progress → Completed

Each job card shows:
- Customer name and job reference
- Pickup and delivery postcodes
- Date and time slot
- Job size and services required
- Assigned driver and porter with avatar
- Vehicle assigned
- Job value
- Current status indicator
- Any flags or alerts

Admin can drag cards between columns. Admin can click any card to open the full job detail.

### AI Auto-Assignment Logic

When a job moves to Confirmed status AI immediately suggests the optimal assignment.

Driver selection based on:
- Availability on the job date — no clashing jobs
- Geographic proximity — driver closest to pickup postcode on that morning
- Vehicle match — does the driver's assigned vehicle have capacity for this job size?
- Skill match — does the job require specialist skills such as piano moving, antiques, or office equipment?
- Historical performance — which driver has the best completion record for this job type and area?
- Working hours — will this job breach the driver's contracted hours for that day?

Porter selection based on:
- Is a porter required? AI determines this based on job size and complexity
- Availability on the job date and time
- Which porter pairs best with the assigned driver based on historical job completion speed
- Porter proximity to pickup location

Vehicle selection based on:
- Total cubic footage of items declared
- Number of large or specialist items
- Access restrictions at pickup or delivery postcode
- Whether the vehicle is already assigned that day

AI presents the suggested assignment to admin:

"AI Suggested Assignment
Job: AR-0847 | 3-bed Reading to Basingstoke
Driver: Ahmed Hassan
Porter: James Okafor
Vehicle: Luton Van VN23 XYZ
Reason: Ahmed is 4 mins from pickup, James pairs well with Ahmed averaging 12% faster completion, Luton van sufficient for declared inventory."

[Change Assignment]   [Confirm]

Admin confirms or overrides. If admin overrides, AI re-optimises the rest of the board around that change automatically.

### Conflict Detection (System — No AI)

System automatically detects and flags:
- Same driver assigned to overlapping jobs
- Same vehicle assigned to two jobs simultaneously
- Porter assigned beyond their contracted hours
- Job scheduled on a driver's day off or holiday
- Vehicle not available due to being in service or MOT due

All conflicts shown as red flags on the job card before admin confirms.

### Scheduling Intelligence (AI)

AI continuously monitors the schedule and surfaces insights to admin:
- "Tuesday jobs have a 40% higher cancellation rate — consider overbooking Tuesdays slightly"
- "Jobs over 80 miles are your least profitable after fuel costs"
- "Ahmed and James complete jobs 22% faster than average — prioritise them for time-sensitive bookings"
- "You are under-resourced on 14th July — 6 jobs confirmed, only 2 drivers available"
- "3-bed house moves in RG14 consistently run 25 minutes over estimate — adjust quote duration"

Weekly scheduling report auto-generated every Monday morning covering the week ahead.

### Driver & Porter Profiles

Each driver and porter has a profile in the system containing:
- Personal details and emergency contact
- Licence type and expiry date
- DBS check status and expiry
- Contracted hours and working pattern
- Skills and certifications including HGV, piano moving, specialist packing
- Assigned vehicle
- Holiday and absence calendar
- Historical performance metrics:
  - Average job completion time vs estimate
  - Customer rating average
  - On-time arrival percentage
  - Total jobs completed

### PAYE & Contractor Split

System distinguishes between:
- PAYE employees (drivers and porters on payroll) — hours tracked automatically via clock-in/out in the app, fed directly into payroll calculation
- Contractors (self-employed, pay own tax) — job-based payment tracked, CIS deduction calculated where applicable, payment logged separately from payroll

All hours and job completions logged against each person automatically from driver app activity.

---

## GLOBAL SYSTEM REQUIREMENTS

### Notifications Architecture
- All admin notifications: Supabase Realtime to dashboard notification bell plus Firebase push to admin mobile app
- All customer notifications: Resend for email, Twilio for WhatsApp and SMS
- Notification log: every notification sent is stored with timestamp, channel, recipient, and delivery status
- Failed notifications: system retries automatically and flags persistent failures to admin

### HERE Maps Integration
- Use HERE Maps Routing API and Distance Matrix API
- Never poll on a timer — only call on the specific triggers listed in Pillar 2
- Raw GPS coordinates polled every 60 seconds from driver app and stored in Supabase — this is free
- Straight-line deviation check done in application logic before any API call is made
- Store all route calculations in Supabase to avoid repeat API calls for the same data

### AI Usage — Claude API (claude-sonnet-4-6)
AI is used only in these four specific areas:
1. Lead qualification, scoring, chatbot conversation, quote recommendation, intent analysis, and continuous learning — Pillar 1
2. Nightly route optimisation and sequencing — Pillar 2
3. Real-time deviation analysis and rerouting recommendation — Pillar 2
4. Job scheduling intelligence, assignment recommendation, and insight generation — Pillar 4

Everything else in the platform is handled by system rules, scheduled triggers, and application logic. No AI is used for notifications, bookkeeping, finance, payroll, tax calculations, receipt generation, invoice generation, photo handling, signature capture, or any feature where deterministic rules can achieve the same result.

### Mobile Apps
Both mobile apps — admin and driver — must:
- Work offline for core functions and sync when connection is restored
- Send GPS coordinates every 60 seconds when driver is on an active job
- Support push notifications via Firebase Cloud Messaging
- Support camera access for photo capture in chain of custody flow
- Support signature canvas for pickup and delivery confirmation
- Be built in React Native with Expo for cross-platform iOS and Android deployment

### Data & Storage
- All photos stored in Supabase Storage — never deleted
- All signatures stored as images in Supabase Storage — never deleted
- All job evidence packs stored permanently for minimum 7 years
- All route calculations cached in Supabase to minimise API calls
- All notification logs retained for minimum 2 years
- All lead activity and AI conversation logs retained permanently

---

## BUILD ORDER

Build in this exact sequence. Complete and test each phase fully before starting the next:

1. Database schema — all new tables, fields, relationships, indexes, and RLS policies for all four pillars
2. Pillar 4 — Job Scheduling and Driver/Porter Assignment — this is the foundation everything else sits on
3. Pillar 3 — Pickup and Delivery Notifications and Chain of Custody — this is the driver app core flow
4. Pillar 2 — Intelligent Route Planning Engine — this builds on scheduling and the driver app
5. Pillar 1 — AI Lead Qualification and Sales Conversion — this builds on the job creation flow

Start with the complete database schema for all four pillars. Show me every table, every field, every relationship, every foreign key, and every index before writing any application code.


.