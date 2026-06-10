# Ample Admin — Mobile App (Expo)

React Native admin app that reuses the existing Next.js backend and Supabase
project 100%. See [`../ADMIN_MOBILE_APP.md`](../ADMIN_MOBILE_APP.md) for the full
10-phase plan.

## Status

**Phase 1 — Foundation & Design System** ✅
- Expo (SDK 51) + Expo Router + TypeScript
- NativeWind (Tailwind) with brand tokens + dark mode
- Supabase client (shared project/sessions) with AsyncStorage persistence
- TanStack Query + Zustand stores
- Ported `types` / `constants` / `utils`
- Base UI kit: Button, Card, Badge, StatusBadge, ServiceBadge, Input, Skeleton, EmptyState, ErrorState

## Setup

```bash
cd admin-app
npm install
cp .env.example .env     # then fill in the values (same public values as the web app)
npx expo start           # press i (iOS), a (Android), or scan with Expo Go
```

### Environment (`.env`)

Public values only — never the service-role key:

```
EXPO_PUBLIC_SUPABASE_URL=...          # same as web NEXT_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=...     # same as web NEXT_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SITE_URL=https://www.ampleremovals.com   # deployed Next.js API base
```

## Architecture notes

- **Writes** go through the existing `/api/admin/**` routes (the `apiFetch`
  wrapper attaches the Supabase bearer token, so the server `requireAdmin`
  guard accepts them). The device never holds the service-role key.
- **Reads** can hit Supabase directly — RLS is already hardened (admins keep
  full access; drivers are scoped to their own data).
- **Admin-only:** on login the app runs `getUserType`; drivers are rejected.

## Push notifications (remaining launch work)

The client groundwork is in place: `lib/push.ts` sets the foreground handler
and `registerForPushNotifications()` requests permission + fetches the Expo
push token; the root layout registers on admin login and deep-links to a
booking when a notification is tapped (`data.bookingId`).

To go live with remote push:
1. `cd admin-app && npx eas init` — creates the EAS project + `projectId`
   (token retrieval no-ops until this exists).
2. Add a `admin_push_tokens` table (admin_user_id, expo_token) and an endpoint
   to store the token from `registerForPushNotifications()`.
3. Add a server helper that POSTs to `https://exp.host/--/api/v2/push/send`
   whenever a `notifications` row is created (new booking, invoice paid,
   driver status, booking status change).
4. APNs key (iOS) + FCM key (Android) via `eas credentials`.

## Launch (EAS)

- `eas.json` defines `development` / `preview` / `production` profiles.
- Set EAS env/secrets for `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (the anon key is public but keep it out of
  git via EAS secrets); `EXPO_PUBLIC_SITE_URL` is already in `eas.json`.
- Build: `eas build --platform all`. Submit: `eas submit`.
- App Store: bundle id `com.ampleremovals.admin`; Play: package
  `com.ampleremovals.admin`. Provide a demo admin login to reviewers.

## This is a separate project

`admin-app/` has its own `package.json` and `node_modules`. It is excluded from
the Next.js TypeScript build and ESLint (`../tsconfig.json` + `../.eslintignore`)
so the web app is never affected.
