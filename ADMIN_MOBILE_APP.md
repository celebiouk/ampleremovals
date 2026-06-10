# ADMIN MOBILE APP — Build Plan
## React Native (Expo) | iOS & Android

> Status: **PLANNING ONLY** — no React Native code has been written. Await "Start" before building Phase 1.
> Backend: **zero new backend** — the mobile app reuses the existing Next.js API routes and Supabase database 100%.

---

### TECH STACK

| Concern | Choice |
|---|---|
| Framework | React Native with **Expo (SDK 51+)** |
| Navigation | **Expo Router** (file-based, mirrors the Next.js App Router) |
| Styling | **NativeWind** (Tailwind CSS for React Native) |
| State management | **Zustand** (lightweight global stores) |
| Data fetching / caching | **TanStack Query (React Query)** |
| Real-time | **Supabase JS client** (`@supabase/supabase-js`, same as web) |
| Auth | **Supabase Auth** (same users, same sessions as the web app) |
| Push notifications | **Expo Notifications** + Expo Push Service (APNs + FCM) |
| Charts | **Victory Native** |
| Kanban drag & drop | **react-native-draggable-flatlist** |
| File uploads | **Expo Document Picker** + **Expo Image Picker** |
| Camera (document capture) | **Expo Camera** |
| Maps / directions | **Expo Linking** (opens the native maps app) |
| PDF viewing | **Expo WebBrowser** (opens the invoice/quote PDF) |
| Secure token storage | **Expo SecureStore** |
| Preferences storage | **AsyncStorage** |
| Icons | **Expo Vector Icons** + `lucide-react-native` |
| API layer | Existing Next.js `/api/admin/**` routes + direct Supabase reads |
| Backend | **None new** — reuse existing APIs, routes, Supabase, business logic |

**Notes**
- The mobile app talks to the **same Supabase project** and the **same deployed Next.js API** (`NEXT_PUBLIC_SITE_URL`).
- Writes go through the existing `/api/admin/**` routes (which now enforce `requireAdmin`). Reads may go directly to Supabase (RLS already hardened so admins keep full access; drivers are excluded).
- The app is **admin-only**. On login it calls `getUserType()` logic; a `driver` or anonymous user is rejected.

---

### EXISTING APIs BEING REUSED

All routes below already exist and are authenticated (`requireAdmin` or inline session check). The mobile app calls them with the Supabase session's bearer token.

**Auth / Admin users**
| Route | Method | Mobile screen |
|---|---|---|
| Supabase Auth (`signInWithPassword`, `signOut`, `resetPasswordForEmail`) | — | Login, Reset password |
| `/api/admin/users` | GET, POST | Manage Admins |
| `/api/admin/users/[id]` | PATCH, DELETE | Manage Admins |
| `/api/admin/activity` | GET | Admin activity feed |

**Bookings**
| Route | Method | Mobile screen |
|---|---|---|
| `/api/admin/bookings/[id]/status` | PATCH/POST | Booking detail — status |
| `/api/admin/bookings/[id]/update-date` | PATCH | Booking detail — reschedule |
| `/api/admin/bookings/[id]/update-addresses` | PATCH | Booking detail — addresses |
| `/api/admin/bookings/bulk-status` | POST | Pipeline / bulk actions |
| `/api/admin/bookings/[id]/quote/save` | POST | Quote builder |
| `/api/admin/bookings/[id]/quote/send` | POST | Quote builder — send |
| `/api/admin/bookings/[id]/documents` | GET, POST | Booking documents |
| `/api/admin/bookings/[id]/documents/[docId]` | DELETE | Booking documents |
| `/api/admin/bookings/[id]/assign-driver` | POST | Assign driver |
| `/api/admin/bookings/[id]/drivers` | GET, DELETE | Assigned drivers |
| `/api/admin/bookings/[id]/tips` | POST | Record tip |
| `/api/admin/call-back-reminders` | GET, POST | Call-back reminders |
| `/api/admin/call-back-reminders/[id]` | PATCH/DELETE | Call-back reminders |

**Messaging**
| Route | Method | Mobile screen |
|---|---|---|
| `/api/admin/send-email` | POST | Booking detail — email |
| `/api/admin/send-sms` | POST | Booking detail — SMS |
| `/api/admin/driver-status` | POST | Booking detail — manual driver status push |

**Drivers**
| Route | Method | Mobile screen |
|---|---|---|
| `/api/admin/drivers` | GET, POST | Drivers list, Create driver |
| `/api/admin/drivers/[id]` | GET, PATCH | Driver profile, Edit |
| `/api/admin/drivers/[id]/documents` | GET, POST | Driver documents |
| `/api/admin/earnings` | GET | Earnings |
| `/api/admin/earnings/[id]/approve` | POST | Earnings — approve |
| `/api/admin/earnings/[id]/pay` | POST | Earnings — mark paid |

**Invoicing / Payments**
| Route | Method | Mobile screen |
|---|---|---|
| `/api/admin/invoices/generate` | POST | Generate invoice |
| `/api/admin/invoices/send` | POST | Send invoice |
| `/api/admin/invoices/resend` | POST | Resend invoice |
| `/api/admin/invoices/[id]/mark-paid` | PATCH | Mark invoice paid |
| `/api/admin/invoices/[id]/void` | POST | Void invoice |
| `/api/admin/invoices/[id]/pdf` | GET | View invoice PDF |
| `/api/admin/invoices/[id]` | GET/DELETE | Invoice detail |

**Postcode helpers (shared)**
| Route | Method | Mobile screen |
|---|---|---|
| `/api/postcode/lookup` | GET/POST | Address editing |
| `/api/postcode/distance` | GET/POST | Quote builder |

**Direct Supabase reads** (no API route needed — RLS allows admin): `bookings`, `customers`, `addresses`, service-detail tables, `invoices`, `payments`, `booking_notes`, `status_history`, `activity_log`, `notifications`, `automation_rules`, `automation_logs`, `settings`, `drivers`, `booking_driver_assignments`, `driver_earnings`, `driver_tips`.

---

### ADMIN CAPABILITY INVENTORY

Confirmed from the codebase audit. This is the master checklist — every item must be delivered across the 10 phases.

**1. Authentication & Admin Accounts**
- Admin login (email + password, Supabase Auth) — `app/(admin)/admin/login`
- Logout — `hooks/useAdminAuth.ts`
- Password reset (deep-link flow) — pattern from `app/(public)/drivers/reset-password`
- Admin vs driver detection — `lib/user-type.ts`, `lib/admin-auth.ts`
- Manage admins (super_admin): list / create / edit role / delete — `/admin/manage-admins`, `/api/admin/users`, `/api/admin/users/[id]`
- Admin activity log feed — `/api/admin/activity`

**2. Dashboard & Analytics** — `app/(admin)/admin/page.tsx`
- KPI stat cards (bookings, revenue, conversions, etc.)
- Line / Bar / Pie charts (Recharts → Victory Native)
- Recent activity feed (reads `activity_log`)
- Reads: `bookings`, `invoices`, `activity_log`

**3. Booking Management** — `app/(admin)/admin/bookings`, `bookings/[id]`
- List with filter, search, status chips — `hooks/useBookingsList.ts`
- Booking detail — `hooks/useBookingDetail.ts`
- Status update (full pipeline) + status history
- Reschedule (update move date)
- Edit pickup/dropoff addresses (postcode lookup)
- Documents: upload / view / delete
- Assigned drivers: view / assign (lead toggle, pay override) / remove
- Record driver tips
- Manual driver-status push to customer (Email+SMS+WhatsApp)
- Internal notes: add / delete (real-time)
- Activity log timeline (real-time)
- Call-back reminders: create / complete / delete
- Quote builder: line items, save, send (PDF + email)

**4. CRM Pipeline** — `app/(admin)/admin/pipeline`
- Kanban board by booking status
- Drag a card to change status (→ bulk-status / status route)
- Reads `bookings`

**5. Calendar** — `app/(admin)/admin/calendar`
- Month/scheduling view by `move_date`
- Tap a day to see that day's jobs

**6. Customer Management** — `app/(admin)/admin/customers`, `customers/[id]`
- Customer list + search
- Customer detail with full booking history
- Reads `customers`, `bookings`

**7. Driver Management** — `app/(admin)/admin/drivers`, `drivers/[id]`, `drivers/[id]/edit`, `drivers/new`, `admin/earnings`
- Drivers list + filter tabs (All / Active / Inactive / **Pending Approval**)
- Copy public registration invite link
- Create driver (creates Supabase Auth account + temp password)
- View driver profile (stats, earnings summary)
- Edit driver
- Quick-approve a pending self-registered driver
- Driver documents: profile photo + licence (upload / view)
- Driver earnings: list, filter tabs, **bulk approve**, approve, mark paid, CSV export
- (Assignment + tips also reachable from booking detail)

**8. Invoicing** — `app/(admin)/admin/invoices`
- Invoice list + status
- Generate deposit / full invoice (modal)
- Send / resend invoice (email + Stripe link)
- Mark paid (manual; triggers VAT-net driver earnings)
- Void invoice
- View invoice PDF
- Invoice detail modal

**9. Payments** — `app/(admin)/admin/payments`
- Payments list
- Export (CSV)
- Reads `payments`

**10. Notifications** — `components/admin/NotificationCentre.tsx`
- Notification list (reads `notifications`)
- Mark one read / mark all read
- (Mobile: surfaced via push + an in-app inbox)

**11. Automations** — `app/(admin)/admin/automations`
- View automation rules
- Toggle a rule on/off
- View automation logs
- Reads `automation_rules`, `automation_logs`

**12. Reports** — `app/(admin)/admin/reports`
- Bar / Pie / Area charts
- Date-range filter
- Reads `bookings`

**13. Settings** — `app/(admin)/admin/settings`
- Company info (name, email, phone)
- Google review link
- Notification preferences (`notify_new_booking`, `notify_invoice_paid`, `notify_invoice_overdue`, `notify_move_date_tomorrow`)
- Reads/writes `settings`

**14. Messaging** — send Email / SMS from booking detail; email template library (`lib/email-templates.ts`)

**15. Command Palette / Global Search** — `components/admin/CommandPalette.tsx`
- Search across bookings and customers
- Jump to a record

**16. Real-time** — `lib/realtime.ts`
- Bookings list live updates
- Per-booking activity log (live)
- Per-booking notes (live)
- Notifications (live)

---

### FOLDER STRUCTURE

```
/admin-app                         ← separate Expo project (sibling of the Next.js app)
  app/                             ← Expo Router screens
    (auth)/
      login.tsx
      reset-password.tsx
      reset-password/update.tsx
    (tabs)/
      _layout.tsx                  ← bottom tab bar
      index.tsx                    ← Dashboard
      bookings/
        index.tsx                  ← bookings list
        pipeline.tsx               ← kanban (or its own tab)
      drivers/
        index.tsx
      more/
        index.tsx                  ← hub for Invoices, Payments, Customers,
                                     Calendar, Reports, Automations, Settings,
                                     Manage Admins, Notifications
    booking/[id].tsx               ← booking detail (stack)
    booking/[id]/quote.tsx
    booking/[id]/documents.tsx
    driver/[id].tsx
    driver/[id]/edit.tsx
    driver/new.tsx
    customer/[id].tsx
    invoice/[id].tsx
    calendar/index.tsx
    reports/index.tsx
    automations/index.tsx
    settings/index.tsx
    manage-admins/index.tsx
    notifications/index.tsx
    _layout.tsx                    ← root: providers, auth gate, theme
  components/
    ui/                            ← Button, Card, Badge, Input, Sheet, Dialog, Skeleton
    shared/                        ← Header, EmptyState, ErrorState, PullToRefresh
    booking/                       ← BookingCard, StatusPicker, NotesPanel, ActivityTimeline,
                                     MessageComposer, AssignedDrivers, QuoteBuilder
    driver/                        ← DriverCard, DriverDocuments, EarningsTable
    invoice/                       ← InvoiceCard, GenerateInvoiceSheet
    dashboard/                     ← StatCard, MiniChart
  lib/
    supabase.ts                    ← Supabase client w/ SecureStore adapter
    api.ts                         ← typed fetch wrapper (adds bearer token)
    utils.ts                       ← formatCurrency, formatDate (ported from web)
    constants.ts                   ← STATUS_LABELS, colours, etc. (ported)
    realtime.ts                    ← subscription helpers (ported)
  hooks/                           ← useBookings, useBookingDetail, useDrivers, useEarnings…
  store/                           ← Zustand: authStore, uiStore, filtersStore
  types/                           ← ported from web types/index.ts
  assets/                          ← icons, splash, app icon
  app.json / eas.json              ← Expo + EAS config
```

---

### 10-PHASE BUILD PLAN

---

## Phase 1 — Foundation & Design System

**Goal:** A running Expo app with navigation, theming, Supabase wired, and a base component kit — but no business features yet.

**Screens to build:**
- `app/_layout.tsx` (root providers, theme, fonts)
- A placeholder `(tabs)/index.tsx` to prove navigation
- Loading / error / empty-state primitives

**Features covered:**
- Project scaffold (Expo + Expo Router + TypeScript)
- NativeWind configured with brand tokens (purple `#6b21a8`, green `#16a34a`)
- Dark mode from day one (system + manual toggle)
- Ported `types/`, `constants.ts`, `utils.ts`
- Supabase client with SecureStore session persistence
- TanStack Query provider + Zustand stores skeleton

**API routes used:** none yet (Supabase client initialised, not queried)

**Supabase tables touched:** none (connection smoke-test only)

**Components to build:** `Button`, `Card`, `Badge`, `Input`, `Skeleton`, `EmptyState`, `ErrorState`, `StatusBadge`, `ServiceBadge`

**Dependencies to install:** `expo`, `expo-router`, `nativewind`, `tailwindcss`, `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `expo-secure-store`, `@react-native-async-storage/async-storage`, `lucide-react-native`, `expo-font`

**Deliverable:** App launches on iOS & Android, shows a themed placeholder screen, connects to Supabase, light/dark mode works.

---

## Phase 2 — Authentication & App Shell

**Goal:** An admin can log in, the app rejects non-admins, and the full navigation shell (tabs + stack + "More" hub) exists.

**Screens to build:**
- `(auth)/login.tsx`
- `(auth)/reset-password.tsx` + `reset-password/update.tsx`
- `(tabs)/_layout.tsx` (bottom tabs: Dashboard, Bookings, Pipeline, Drivers, More)
- `more/index.tsx` (hub list)
- `manage-admins/index.tsx` (super_admin only)

**Features covered:**
- Email/password login (Supabase Auth)
- **Admin-only gate** (reject drivers via `getUserType` logic; sign them out)
- Session persistence + auto-refresh (SecureStore)
- Logout
- Password reset via deep link (`admin-app://reset-password/update`)
- Manage admins: list, create, change role, delete; admin activity feed

**API routes used:** Supabase Auth; `/api/admin/users` (GET/POST), `/api/admin/users/[id]` (PATCH/DELETE), `/api/admin/activity` (GET)

**Supabase tables touched:** `admin_users` (via API), `drivers` (type detection)

**Components to build:** `AuthGate`, `LoginForm`, `TabBar`, `MoreHubItem`, `AdminUserRow`

**Dependencies to install:** `expo-linking`, `expo-web-browser`

**Deliverable:** Admins log in and land on the shell; non-admins are blocked; super_admins can manage other admins; sessions survive app restarts.

---

## Phase 3 — Dashboard & Analytics

**Goal:** The home tab shows live KPIs, charts, and a recent-activity feed.

**Screens to build:** `(tabs)/index.tsx` (Dashboard)

**Features covered:**
- KPI stat cards (today/week/month bookings, revenue, pending, conversions)
- Line/Bar/Pie charts (Victory Native)
- Recent activity feed
- Pull-to-refresh + real-time booking updates

**API routes used:** none (direct reads)

**Supabase tables touched:** `bookings`, `invoices`, `activity_log` (+ realtime on `bookings`)

**Components to build:** `StatCard`, `MiniChart`, `ActivityFeedItem`, `DashboardHeader`

**Dependencies to install:** `victory-native`, `react-native-svg`

**Deliverable:** A glanceable, auto-updating dashboard matching the web overview.

---

## Phase 4 — Bookings: List & Detail Core

**Goal:** Browse/search/filter all bookings and open a booking to view it and change its core fields.

**Screens to build:**
- `(tabs)/bookings/index.tsx` (list)
- `booking/[id].tsx` (detail — core sections)

**Features covered:**
- Booking list: search, status filter chips, service filter, infinite scroll
- Live list updates (realtime)
- Booking detail: customer, addresses, service details, totals
- Status update (full pipeline) + status history view
- Reschedule (move date)
- Edit pickup/dropoff addresses (postcode lookup)

**API routes used:** `/api/admin/bookings/[id]/status`, `/update-date`, `/update-addresses`, `/api/postcode/lookup`

**Supabase tables touched:** `bookings`, `customers`, `addresses`, service-detail tables, `status_history` (+ realtime on `bookings`)

**Components to build:** `BookingCard`, `BookingFilters`, `StatusPicker`, `AddressEditor`, `DatePickerSheet`, `StatusHistoryList`

**Dependencies to install:** `@shopify/flash-list` (fast lists), `date-fns`

**Deliverable:** Full booking browsing + core editing on mobile.

---

## Phase 5 — Bookings: CRM, Messaging & Documents

**Goal:** Everything else on the booking detail — notes, timeline, messaging, reminders, documents, quotes.

**Screens to build:**
- `booking/[id].tsx` (CRM sections added)
- `booking/[id]/quote.tsx`
- `booking/[id]/documents.tsx`

**Features covered:**
- Internal notes: add / delete (real-time)
- Activity log timeline (real-time)
- Send Email / send SMS (with email template picker)
- Manual driver-status push (Email+SMS+WhatsApp)
- Call-back reminders: create / complete / delete
- Documents: capture/upload (camera + picker), view, delete
- Quote builder: line items, distance calc, save, send (PDF email)

**API routes used:** `/api/admin/send-email`, `/api/admin/send-sms`, `/api/admin/driver-status`, `/api/admin/call-back-reminders` (+ `[id]`), `/api/admin/bookings/[id]/documents` (+ `[docId]`), `/api/admin/bookings/[id]/quote/save` + `/send`, `/api/postcode/distance`

**Supabase tables touched:** `booking_notes`, `activity_log` (realtime), `call_back_reminders`, `booking_documents`

**Components to build:** `NotesPanel`, `ActivityTimeline`, `MessageComposer`, `TemplatePicker`, `CallBackReminderSheet`, `DocumentUploader`, `QuoteBuilder`

**Dependencies to install:** `expo-image-picker`, `expo-document-picker`, `expo-camera`, `expo-web-browser`

**Deliverable:** Booking detail reaches full parity with the web CRM view.

---

## Phase 6 — Pipeline (Kanban) & Calendar

**Goal:** Visual CRM pipeline with drag-to-change-status, plus a calendar of jobs.

**Screens to build:**
- `(tabs)/bookings/pipeline.tsx` (Kanban)
- `calendar/index.tsx`

**Features covered:**
- Kanban columns by booking status
- Drag a card between columns → status change (writes history + activity)
- Bulk status actions
- Calendar by `move_date`; tap a day → that day's jobs

**API routes used:** `/api/admin/bookings/[id]/status`, `/api/admin/bookings/bulk-status`

**Supabase tables touched:** `bookings` (+ realtime)

**Components to build:** `KanbanColumn`, `KanbanCard`, `CalendarMonth`, `DayJobsSheet`

**Dependencies to install:** `react-native-draggable-flatlist`, `react-native-calendars`, `react-native-gesture-handler`, `react-native-reanimated`

**Deliverable:** Drag-and-drop pipeline and a tappable calendar on mobile.

---

## Phase 7 — Customers & Global Search

**Goal:** Browse customers with full history, and search across everything from anywhere.

**Screens to build:**
- `(more)` → `customer/index` (list) + `customer/[id].tsx`
- Global search (modal, triggered from header)

**Features covered:**
- Customer list + search
- Customer detail with full booking history
- Command-palette-style search across bookings + customers → deep link to records

**API routes used:** none (direct reads)

**Supabase tables touched:** `customers`, `bookings`

**Components to build:** `CustomerCard`, `CustomerBookingHistory`, `GlobalSearchModal`, `SearchResultRow`

**Dependencies to install:** none new

**Deliverable:** Customer 360 view + fast global search.

---

## Phase 8 — Driver Management & Earnings

**Goal:** Full driver lifecycle and payroll on mobile.

**Screens to build:**
- `(tabs)/drivers/index.tsx` (list + filter tabs + invite link)
- `driver/new.tsx`
- `driver/[id].tsx` (profile, approve, documents)
- `driver/[id]/edit.tsx`
- `more/earnings.tsx` (earnings management)

**Features covered:**
- Drivers list with All/Active/Inactive/**Pending Approval** tabs + counts
- Copy/share registration invite link
- Create driver (Auth account + temp password)
- View profile (stats + earnings summary)
- Edit driver
- Quick-approve pending driver
- Driver documents (photo + licence): capture/upload/view
- Earnings: list, filter tabs, bulk approve, approve, mark paid, CSV export
- Assign driver / record tip (reachable from booking detail in Phase 5)

**API routes used:** `/api/admin/drivers` (GET/POST), `/api/admin/drivers/[id]` (GET/PATCH), `/api/admin/drivers/[id]/documents` (GET/POST), `/api/admin/earnings` (GET), `/api/admin/earnings/[id]/approve`, `/pay`

**Supabase tables touched:** `drivers`, `booking_driver_assignments`, `driver_earnings`, `driver_tips`

**Components to build:** `DriverCard`, `DriverFilterTabs`, `CreateDriverForm`, `ApprovalBanner`, `DriverDocuments`, `EarningsTable`, `EarningsFilterTabs`

**Dependencies to install:** `expo-sharing` (invite link + CSV), `expo-file-system` (CSV write)

**Deliverable:** Complete driver onboarding, approval, document, and payroll management on mobile.

---

## Phase 9 — Invoicing & Payments

**Goal:** Create, send, and reconcile invoices and view payments.

**Screens to build:**
- `(more)` → `invoices/index.tsx`
- `invoice/[id].tsx` (detail + PDF)
- `(more)` → `payments/index.tsx`

**Features covered:**
- Invoice list + status
- Generate deposit / full invoice (sheet)
- Send / resend invoice
- Mark paid (manual → triggers VAT-net driver earnings)
- Void invoice
- View invoice PDF (WebBrowser)
- Payments list + CSV export

**API routes used:** `/api/admin/invoices/generate`, `/send`, `/resend`, `/api/admin/invoices/[id]/mark-paid`, `/void`, `/pdf`, `/api/admin/invoices/[id]`

**Supabase tables touched:** `invoices`, `payments` (reads)

**Components to build:** `InvoiceCard`, `GenerateInvoiceSheet`, `InvoiceDetail`, `PaymentRow`

**Dependencies to install:** none new (reuse `expo-web-browser`, `expo-sharing`)

**Deliverable:** Full invoicing + payments workflow on mobile, consistent with the web finance tools.

---

## Phase 10 — Automations, Reports, Settings, Push Notifications & Launch

**Goal:** Finish the remaining admin surfaces, add push notifications, polish, and ship to both stores.

**Screens to build:**
- `automations/index.tsx`
- `reports/index.tsx`
- `settings/index.tsx`
- `notifications/index.tsx` (in-app inbox)

**Features covered:**
- Automations: view rules, toggle on/off, view logs
- Reports: Bar/Pie/Area charts + date-range filter
- Settings: company info, Google review link, notification prefs
- Notifications inbox: list, mark read, mark all read (real-time)
- **Push notifications** (see strategy below): new booking, invoice paid, driver status update, booking status change
- Final polish: empty/error/loading states everywhere, gestures, accessibility, app icon & splash
- **App Store + Play Store submission** via EAS Build

**API routes used:** none new for automations/reports/settings (direct reads/writes); Expo Push registration stored on the device + linked to admin

**Supabase tables touched:** `automation_rules`, `automation_logs`, `settings`, `bookings` (reports), `notifications` (realtime)

**Components to build:** `AutomationRuleRow`, `ReportChart`, `DateRangePicker`, `SettingsForm`, `NotificationRow`, `PushPermissionPrompt`

**Dependencies to install:** `expo-notifications`, `expo-device`, `expo-constants`, `eas-cli` (dev dependency)

**Deliverable:** Feature-complete, polished admin app with push notifications, submitted to the Apple App Store and Google Play.

---

### DESIGN SYSTEM

- **Colours:** brand purple `#6b21a8` (primary), green `#16a34a` (accent/success), white base; status colours ported from `lib/constants.ts` (`STATUS_DOT_COLOURS`, driver/earnings status colours). Full dark-mode palette.
- **Typography:** system fonts (San Francisco / Roboto) with a ported brand size scale; Syne-style weight for headers via a loaded font if desired.
- **Component translation:**
  - Web `Card` → `View` with rounded-2xl, border, subtle shadow.
  - Web `Badge`/`StatusBadge` → pill `View` + `Text` using the same colour tokens.
  - Web `Button` → `Pressable` with purple fill / outline / ghost variants and pressed state.
  - Web tables → `FlashList` of cards (tables don't translate to mobile).
  - Web modals → bottom **sheets** (`@gorhom/bottom-sheet`) for actions; full-screen modals for forms.
- **Navigation pattern:** bottom **tab bar** for the 5 main sections (Dashboard, Bookings, Pipeline, Drivers, More) + **stack** navigation for detail screens + **sheets/modals** for actions (assign driver, generate invoice, compose message).
- **Dark mode:** supported from Phase 1 (system-driven + manual override stored in AsyncStorage).
- **Gestures:** swipe-from-edge to go back, pull-to-refresh on every list, swipe-to-reveal actions on booking/driver cards (e.g. quick status change, call customer).

---

### AUTHENTICATION STRATEGY

- **Token storage:** Supabase session persisted via a **SecureStore** storage adapter passed to `createClient` (`auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false }`).
- **Session refresh:** Supabase auto-refresh enabled; app also calls `supabase.auth.startAutoRefresh()` on foreground and `stopAutoRefresh()` on background (Expo `AppState`).
- **Admin vs driver:** after `signInWithPassword`, run the `getUserType` logic (query `drivers` by `auth_user_id`); a **driver** or **unknown** user is signed out with an "admins only" message — mirrors the web `requireAdmin` boundary. super_admin vs admin gates the Manage Admins screen.
- **Deep links:** password-reset emails point to `admin-app://reset-password/update` (configured in `app.json` scheme + universal links); the update screen consumes the recovery session like the web flow.
- **API calls:** the `lib/api.ts` wrapper attaches `Authorization: Bearer <access_token>` from the current session so the existing `requireAdmin`-guarded routes accept the request.

---

### REAL-TIME STRATEGY

Mirrors `lib/realtime.ts`, ported to the mobile Supabase client.

| Screen | Subscription | Lifecycle |
|---|---|---|
| Dashboard | `bookings` (all changes) | subscribe on focus, unsubscribe on blur |
| Bookings list | `bookings` (all changes) | subscribe on focus, unsubscribe on blur |
| Pipeline | `bookings` (all changes) | subscribe on focus, unsubscribe on blur |
| Booking detail | `activity_log` + `booking_notes` filtered by `booking_id` | subscribe on mount, unsubscribe on unmount |
| Notifications inbox | `notifications` | subscribe while app is foregrounded |

- **Management:** use `useFocusEffect` (Expo Router) to subscribe/unsubscribe so background screens don't hold channels; always `supabase.removeChannel()` on cleanup.
- **Backgrounding:** on `AppState` → `background`, tear down channels and stop auto-refresh; on `active`, re-subscribe and refetch via React Query `invalidateQueries` (covers any missed events). Live deltas are best-effort; **push notifications** are the reliable channel for events that happen while the app is closed.

---

### PUSH NOTIFICATION STRATEGY

- **Service:** Expo Notifications + the **Expo Push Service** (fronts APNs for iOS and FCM for Android).
- **Registration:** on first admin login, request permission, get the Expo push token (`getExpoPushTokenAsync`), and store it against the admin (a small `admin_push_tokens` table — the one piece of new schema, or reuse a column on `admin_users`).
- **Triggers (server-side, hooks into the existing notification system):** the app already writes to `notifications` and runs cron/automation jobs. Add a thin push dispatch wherever a `notifications` row is created:
  - **New booking submitted** (`/api/bookings/*` → already alerts admins via `/api/admin/alerts/new-booking`)
  - **Invoice paid** (Stripe webhook + manual mark-paid)
  - **Driver status update** (`/api/drivers/jobs/[id]/status`)
  - **Booking status change** (status route)
- **Mechanism:** a shared helper (e.g. `lib/push.ts`) reads admin push tokens and POSTs to `https://exp.host/--/api/v2/push/send` when a notification is created — purely additive, no change to existing flows.
- **Tap handling:** notification payload carries `{ type, bookingId }`; tapping deep-links into the relevant screen (`booking/[id]`, `invoice/[id]`).
- **Config notes:** iOS needs an **APNs key** in the Expo/EAS credentials; Android needs the **FCM server key** uploaded to EAS. Both handled through `eas credentials`.

---

### APP STORE SUBMISSION NOTES

**Expo EAS**
- `eas.json` with `development`, `preview`, and `production` build profiles.
- Environment variables in EAS (per profile): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SITE_URL` (the deployed Next.js API base). **Never** ship the service-role key — all privileged work stays behind the existing server routes.
- `eas build --platform all` for binaries; `eas submit` for store upload.

**Apple App Store**
- Apple Developer account; unique **bundle identifier** (e.g. `com.ampleremovals.admin`).
- Provisioning + distribution certificate via `eas credentials` (or EAS-managed).
- APNs key for push.
- App Store Connect listing: name, description, keywords, privacy policy URL, screenshots (6.7" + 5.5"), data-collection disclosures (handles customer PII → declare).

**Google Play Store**
- Play Console account; **application ID** matching the bundle id.
- Upload/signing **keystore** (EAS-managed signing recommended).
- FCM configuration for push.
- Listing: title, short/full description, feature graphic, phone + tablet screenshots, privacy policy, data-safety form.

**Both**
- Admin-only app → may warrant a note to reviewers that it requires existing admin credentials (provide a demo admin login for review).
- Versioning via `app.json` `version` + EAS `autoIncrement` for build numbers.

---

*End of plan. Awaiting "Start" to begin Phase 1.*
