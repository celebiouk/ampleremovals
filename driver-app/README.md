# Ample Driver — mobile app

Expo (SDK 54) driver app. Same Supabase project, users and sessions as the web
platform and the admin app. Mirrors the web driver portal, then adds the
on-the-road features (smart ETA, chain of custody, live tracking, background GPS,
offline).

## Architecture (hybrid ETA — agreed)
The app is the **eyes & hands**; the Next.js server is the **brain**.
- **App:** background GPS upload (60s), "Start Journey" trigger, on-device
  arrived detection (Haversine), chain-of-custody capture (camera/signature →
  Supabase Storage), offline queue, all UI.
- **Server (`../app/api/drivers/**`):** Call 1 runs synchronously when the driver
  taps start (so the customer gets an instant ETA) — the app calls a thin
  endpoint, the server makes the Google Distance Matrix call (key stays
  server-side) and fires notifications. Calls 2/3 + the arrived-side
  notifications are fired by a 1-minute cron reading `scheduled_callN_time`.
  All calls log to `journey_eta_log`.

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
  _layout.tsx            auth gate + providers + (later) background-task registration
  (auth)/login.tsx
  (tabs)/                Today · Schedule · Alerts · Profile
  job/[id].tsx           detail + Start Journey  (step 4/6)
  job/[id]/arrived.tsx   full-screen arrived       (step 6)
  job/[id]/pickup.tsx    chain of custody          (step 8)
  job/[id]/delivery.tsx  chain of custody + complete (step 9)
lib/    supabase · api · auth · env · (later) location-task · haversine · offline-queue · push
store/  authStore (zustand)
```

See `tasks/` and the build order in the spec for the remaining steps.
