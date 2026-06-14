# Ample Driver — native builds (background GPS, push, foreground service) + store release

Background GPS, the Android foreground-service, and push notifications **cannot run in
Expo Go** — they need a native build via EAS. This is the exact sequence. Steps marked
**(you)** need your own accounts/logins and can't be scripted from here; the config they
rely on is already in the repo (`eas.json`, `app.json`, `lib/push.ts`).

## One-time accounts you need
- **Expo account** — free. Required for any EAS build.
- **Firebase project** — free. Required for **Android push** (FCM credentials).
- **Apple Developer Program** — £79/$99 a year. Required for **iOS push** and the App Store.
- **Google Play Console** — $25 one-off. Required to publish on the Play Store.

(Background GPS + foreground service need *only* the Expo account. Push + stores need the rest.)

---

## 1. Link the project to EAS **(you)**
```bash
cd driver-app
npm i -g eas-cli            # or use: npx eas-cli@latest
eas login                  # your Expo account
eas init                   # creates the EAS project + writes extra.eas.projectId into app.json
```
`eas init` is what gives the app its push `projectId` — `lib/push.ts` reads it automatically.

## 2. Development build — gets background GPS + foreground service working **(you run, no extra accounts)**
```bash
# Android (fastest to test on a real device):
eas build --profile development --platform android

# iOS (needs the Apple account from step 4; simulator build doesn't):
eas build --profile development --platform ios
```
Install the resulting build on the phone (EAS gives a QR/link). Then:
```bash
npx expo start --dev-client          # instead of Expo Go
```
The dev build loads JS from your Metro server, so it still uses your local `.env`
(`EXPO_PUBLIC_SITE_URL=http://192.168.0.75:3000`) to reach the dev API. Background GPS and
the foreground-service notification now work for real.

## 3. Android push — Firebase / FCM **(you)**
1. Create a Firebase project → add an Android app with package `com.ampleremovals.driver`.
2. Download `google-services.json` → place it in `driver-app/` (gitignored; do **not** commit).
3. In Firebase → Project settings → Service accounts → generate a private key JSON.
4. Upload it to EAS so Expo's push service can deliver via FCM v1:
   ```bash
   eas credentials            # Android → Google Service Account → upload the JSON
   ```
Expo push tokens then deliver to Android. (`admin_push_tokens`/`driver_push_tokens` already
exist server-side; `sendAdminPush` and the driver token endpoint are wired.)

## 4. iOS push + APNs **(you — needs Apple Developer)**
```bash
eas credentials             # iOS → let EAS manage the Push Key (APNs) + provisioning
```
EAS creates the APNs key against your Apple account automatically once you're logged in there.

## 5. Production store builds **(you)**
```bash
eas build --profile production --platform android   # .aab for Play
eas build --profile production --platform ios       # for App Store

eas submit --profile production --platform android   # uploads to Play Console
eas submit --profile production --platform ios        # uploads to App Store Connect
```

---

## What's already done in the repo
- `eas.json` — development / preview (APK) / production profiles, prod `EXPO_PUBLIC_SITE_URL`.
- `app.json` — bundle IDs (`com.ampleremovals.driver`), iOS `UIBackgroundModes: [location, fetch]`
  + location/camera usage strings, Android location/camera/**foreground-service** permissions,
  `expo-location` (background + foreground-service enabled), `expo-notifications` (icon + brand
  colour), `expo-camera`. App icon + splash use your `public/logo.png`.
- `lib/location-task.ts` — `startLocationUpdatesAsync` with `foregroundService` (60s, high accuracy).
- `lib/push.ts` — registers the Expo push token via `extra.eas.projectId` and POSTs it to
  `/api/drivers/push-token`.

## Notes
- **Notification icon:** Android renders the status-bar notification icon as a white
  silhouette — the full-colour `logo.png` will show as a white square there. Optional polish:
  drop a 96×96 transparent white-on-clear `notification-icon.png` into `assets/` and point the
  `expo-notifications` plugin `icon` at it. Cosmetic only.
- Keep `google-services.json`, APNs keys, and any service-account JSON **out of git**.
