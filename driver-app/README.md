# Ample Driver — mobile app

Expo (SDK 54) driver app. Same Supabase project, users and sessions as the web
platform and the admin app. Mirrors the web driver portal, then adds the
on-the-road features (smart ETA, chain of custody, live tracking, background GPS,
offline).

## Architecture (hybrid ETA)
The app is the **eyes & hands**; the Next.js server is the **brain**.
- **App:** background GPS upload (60s), "Start Journey" trigger, on-device
  arrived detection (Haversine, 80m), chain-of-custody capture (camera/signature →
  Supabase Storage), offline queue, all UI.
- **Server (`../app/api/drivers/**`):** Call 1 runs synchronously when the driver
  taps start (so the customer gets an instant ETA) — the app calls a thin
  endpoint, the server makes the Google Distance Matrix call (key stays
  server-side) and fires notifications. Calls 2/3 + the arrived-side
  notifications are fired by a 1-minute cron (`/api/cron/eta-engine`) reading
  `scheduled_callN_time`. All calls log to `journey_eta_log`.

The Google Maps key, Resend/Twilio senders, and the `bookings` updates all live
server-side and are reused — the app never holds privileged keys.

## Setup
```bash
cd driver-app
npm install --legacy-peer-deps   # lucide-react-native declares React<=18 but works on 19 (same as admin-app)
cp .env.example .env             # fill EXPO_PUBLIC_* values
npx expo start
```

## Structure
```
app/
  _layout.tsx              auth gate + query persistence + push + background-task registration
  (auth)/login.tsx
  (tabs)/                  Today · Schedule · Alerts · Profile
  job/[id]/index.tsx       detail + journey engine + arrived takeover
  job/[id]/pickup.tsx      pickup chain of custody (name → photos → comments → signature)
  job/[id]/delivery.tsx    delivery chain of custody
  job/[id]/complete.tsx    COMPLETE JOB → invoice trigger
components/  ui kit + JobCard · ClockWidget · OfflineBanner · CameraCapture · SignaturePad · ChainOfCustodyForm · ArrivedModal
hooks/queries.ts           React Query hooks (jobs, clock, profile, stats, notifications)
lib/    supabase · api · auth · env · theme · format · journey · haversine
        location-task (background GPS) · offline-queue · upload · push
store/  authStore (zustand)
```

## Before going live — action items
1. **Run the migration** `../supabase/migrations/add_driver_app.sql` in Supabase
   (adds the journey/chain-of-custody fields on `bookings` + `journey_eta_log`,
   `driver_locations`, `driver_time_entries`, `driver_push_tokens`).
2. **Set `GOOGLE_MAPS_API_KEY`** (server env, Vercel) — Distance Matrix enabled.
   `CRON_SECRET` must be set (the eta-engine cron is already in `vercel.json`).
3. **EAS push:** `eas init` for a projectId so `getExpoPushTokenAsync` works, and
   configure APNs/FCM credentials (same as admin-app).
4. **Storage:** photos/signatures upload via `/api/drivers/upload` (service role)
   into the `driver-documents` bucket under `jobs/<ref>/<leg>/…`.
5. `cp .env.example .env`, fill `EXPO_PUBLIC_*`, then `npx expo start`.

## Known follow-ups (handled by the existing platform, not the app)
- **Branded pickup/delivery receipt PDFs + the permanent evidence-pack PDF** are
  not generated in-app. Completing a job sets `job_completed`, which feeds the
  existing server completion automation (invoice + review request). The pickup
  endpoint emails a plain confirmation. Wiring react-pdf receipt/evidence-pack
  templates into the pickup/complete endpoints is a clean follow-up.
- **Battery mode switching** (significant-location-changes when idle vs high
  accuracy on an active journey) — currently we only run high-accuracy updates
  during an active journey and stop entirely otherwise.
