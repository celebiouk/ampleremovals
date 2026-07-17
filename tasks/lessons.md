# Lessons Log

## Lesson 14 — The `pg` driver turns DATE columns into local-midnight JS Dates
**What happened:** A live E2E test read `bookings.move_date` (a `date` column) via
node-postgres and got `2026-08-14T23:00:00.000Z` for a stored `2026-08-15`,
looking like an off-by-one shift. It wasn't — the DB value was correct.
**Root cause:** node-postgres parses `date` (OID 1082) into a JS `Date` at the
TEST MACHINE's local midnight (BST here = UTC+1), so `.toISOString()` rolls back
an hour into the previous day. The real app never sees this: it reads through
Supabase/PostgREST, which serves a `date` as the plain string `"2026-08-15"`.
**Rule going forward:** When verifying `date` columns via `pg`, select
`col::text` (or compare calendar parts) — never `.toISOString().slice(0,10)`.
Trust the PostgREST/supabase-js read path (plain YYYY-MM-DD string), which is
what production uses. Related: [[lesson-13]], [[lesson-12]].

## Lesson 13 — Serialise picked dates as local YYYY-MM-DD, never let JSON.stringify hit a Date
**What happened:** A customer picking a summer move date on the website had it
stored **one day early** (pick 20 Jul → stored 19 Jul). The calendar hands back a
Date at the customer's LOCAL midnight; `JSON.stringify` serialises it via
`toISOString()` (UTC), and in BST (UTC+1) local midnight is 23:00 the previous
day UTC — so the day rolls back. `createBooking` then kept that with
`toISOString().slice(0,10)`. Winter (GMT) dates were unaffected, which is why it
hid. The admin app was already correct (`toDateKey` subtracts the tz offset).
**Root cause:** A `Date` object crossed the client→server boundary. Any UTC
serialisation of a local-midnight Date shifts BST dates back a day — the exact
trap [[lesson-12]] warned about, but on the WRITE path, not the read/compare path.
**Rule going forward:** For a date-only field, never send a `Date`. Format it to
`YYYY-MM-DD` from LOCAL components at the submit boundary (`toISODate` in
`lib/utils.ts`) so no timezone is ever attached. On the server resolve dates in
UK time (`ukDateString` from `lib/dates.ts`), never raw `toISOString().slice(0,10)`.

## Lesson 12 — Dates: store/compare as YYYY-MM-DD strings; compute "today" in UK tz
**What happened:** A job dated today showed as "past"/missing in the driver app
at 2am. Two bugs: (1) the web portal compared `new Date(move_date)` (parsed as
**UTC midnight**) against a local-midnight `today`, so in BST every job was off by
an hour and fell into the wrong tab; (2) the mobile jobs API computed "today" via
`new Date().toISOString()` (UTC) on Vercel, rolling over at the wrong time.
**Root cause:** Mixing `Date` objects (UTC-parsed) with local time, and using UTC
for a UK business.
**Rule going forward:** Use `lib/dates.ts` (`ukToday`, `ukWeekRange`, `dateOnly`).
Compare date-only values as YYYY-MM-DD **strings**; never `new Date("YYYY-MM-DD")`
for comparisons. Filter scope in JS, not fragile PostgREST `.or()` date casts.

## Lesson 11 — Don't SELECT columns the schema may not have
**What happened:** The driver jobs API 500'd ("column addresses.lat does not
exist") the moment a driver had an assigned job — `addresses.lat/lng` were assumed
during the driver build but no migration ever added them.
**Root cause:** Explicit `select(... lat, lng)` hard-depends on columns existing.
**Rule going forward:** For optional/newer columns, select the relation with `(*)`
so a missing column can't 500 the query; add the migration AND make the read
resilient. Verify assumed columns exist in `supabase/migrations/`.

## Lesson 10 — Mobile bearer auth must be honoured by the shared server client
**What happened:** The mobile admin app authenticates to `/api/admin/**` with an
`Authorization: Bearer <supabase access_token>`, but the web `createClient()`
(and ~19 routes' inline `auth.getUser()`) only read the **cookie** session. So
every mobile admin ACTION (status change, assign-driver, driver-status, quote,
invoice generate/send/mark-paid/void, manage-admins…) would 401 against the live
backend — a latent, app-wide break that bundling never catches.
**Root cause:** Two auth patterns coexisted (`requireAdmin` vs inline cookie
auth); neither looked at the Authorization header.
**Rule going forward:** Make the shared `createClient()` bearer-aware — if an
`Authorization: Bearer` header is present, inject it as the global header so
`auth.getUser()` validates that JWT and PostgREST runs as that user. One change
fixes every route. Verify mobile action routes against the real backend, not
just that the bundle builds.

## Lesson 8 — NativeWind fontFamily keys must not shadow font-weight utilities
**What happened:** Added `fontFamily: { medium, semibold, bold }` to the mobile
tailwind config to wire DM Sans. Those names collide with Tailwind's built-in
font-WEIGHT utilities (`font-semibold`, `font-bold`, `font-medium`) that existing
screens already use, producing ambiguous `font-*` classes (family + weight on the
same class) — risky on Android variant selection.
**Root cause:** Tailwind generates the same `.font-x` class for a fontFamily key
and a fontWeight value; identical key names merge unpredictably.
**Rule going forward:** Name custom fontFamily keys distinctly (`font-display`,
`font-display-sb`, `font-body`, `font-body-sb`) — never `medium/semibold/bold`.
Drive component typography from `lib/typography.ts` StyleSheet objects, not
className weight utilities, so fonts are explicit.

## Lesson 9 — Verify the mobile bundle on the dev server, not just `expo export`
**What happened:** A `@/` path alias resolved under `expo export` but failed under
`expo start` (different resolver path), so export-only checks gave false confidence.
**Rule going forward:** For the Expo app, verify BOTH `expo export` AND a dev-server
bundle fetch (`/node_modules/expo-router/entry.bundle?platform=ios&dev=true`),
asserting HTTP 200 + `Unable to resolve module` count = 0. "SyntaxError"/"Unexpected
token" string counts are false positives (library text) when the bundle is multi-MB.

## Lesson 1 — Match the CLI to the pinned framework version
**What happened:** `create-next-app@latest` produced Next 16 + Tailwind v4 + the new
base-ui shadcn, which is incompatible with this project's Next 14 / Tailwind v3 spec.
The latest `shadcn` CLI also emitted Tailwind-v4-only utilities.
**Root cause:** Used `@latest` instead of pinning to the spec's stack.
**Rule going forward:** Pin `create-next-app@14` and the classic `shadcn@2.1.8` CLI.
Tailwind v3 + classic Radix components are the supported baseline here.

## Lesson 2 — Tailwind v3 colour tokens must be HSL triplets
**What happened:** A stray shadcn step left `globals.css` with oklch values while the
config used `hsl(var(--token))`, breaking every themed colour.
**Root cause:** Mixed v4 (oklch) tokens with a v3 (`hsl(var())`) config.
**Rule going forward:** In this project, `:root` tokens are space-separated HSL
triplets (e.g. `--primary: 274 67% 39%`) consumed via `hsl(var(--primary))`.

## Lesson 7 — Supabase insert returns a query builder, not a Promise with .catch()
**What happened:** Used `.catch(() => null)` on a Supabase `.insert()` call. TypeScript (and Supabase's types) don't expose `.catch()` on the query builder.
**Root cause:** Supabase query builders are thenables but don't expose `.catch()` directly on the type.
**Rule going forward:** Always wrap Supabase calls in `try { await ... } catch { /* non-critical */ }` blocks instead of chaining `.catch()`.

## Lesson 6 — @react-pdf/renderer renderToBuffer type conflict with React elements
**What happened:** `renderToBuffer(React.createElement(...))` caused TS2345 because the element type doesn't match `ReactElement<DocumentProps>`.
**Root cause:** `@react-pdf/renderer` uses its own JSX types that don't perfectly align with React's.
**Rule going forward:** Use `require("@react-pdf/renderer")` instead of the ESM import for `renderToBuffer` to bypass the type conflict. This is the standard workaround for this library.

## Lesson 5 — Set spread requires --downlevelIteration or es2015 target
**What happened:** `[...mySet]` in a client component caused TS2802.
**Root cause:** TypeScript's spread of iterables requires explicit `downlevelIteration` or ES2015+ target.
**Rule going forward:** Always use `Array.from(mySet)` instead of `[...mySet]` to spread Sets/Maps — it works at all targets.

## Lesson 4 — Exclude standalone scripts from tsconfig
**What happened:** Test scripts in scripts/ used top-level `const` declarations.
TypeScript treated all files as one global scope (no `export {}`) and reported
"Cannot redeclare block-scoped variable" across files.
**Root cause:** tsconfig `include` was `**/*.ts` which caught the scripts dir.
**Rule going forward:** Add `"scripts"` to tsconfig `exclude` for any directory
containing standalone node scripts that are not part of the Next.js app.

## Lesson 3 — framer-motion v12 needs literal easing
**What happened:** `ease: "easeOut"` typed as `string` failed the build.
**Rule going forward:** Type variants as `Variants` and use `ease: "easeOut" as const`.
