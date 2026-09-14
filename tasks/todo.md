## Task: Access/damage-risk incident reports (driver-captured, admin-visible)

Plan approved: driver hits a specific access/damage risk mid-job, tells the customer, and if they agree
to proceed anyway, the driver captures a typed description + photos + the customer's signature as a
discrete incident record (a job can have multiple). Admin sees everything on the booking detail page.
Full plan: C:\Users\User\.claude\plans\adaptive-conjuring-fox.md

### Plan
- [ ] Migration: `job_incidents` table (`supabase/migrations/add_job_incidents.sql` + mirrored in `scripts/run-migrations.ts`), run it.
- [ ] `app/api/drivers/jobs/[bookingId]/incident/route.ts` — driver-authenticated create (description, photo_paths, signer_name, signature_path), activity_log + admin push/notification.
- [ ] `app/api/admin/bookings/[id]/incidents/route.ts` — admin-authenticated read, resolves storage paths to fresh signed URLs.
- [ ] `driver-app/app/job/[id]/incident.tsx` — new screen (description → photos → signature → submit), modeled on `ChainOfCustodyForm.tsx` + `waiver.tsx`.
- [ ] Entry-point card on `driver-app/app/job/[id]/index.tsx` next to the existing waiver card.
- [ ] New card on `app/(admin)/admin/bookings/[id]/page.tsx` listing incidents (description, photos, signature, signer, timestamp).
- [ ] Typecheck, exercise the driver route with a scripted call, commit, push, deploy the Next.js side; note driver-app needs the user's own `eas build` to reach devices.

### Review
New `job_incidents` table (booking_id, driver_id, description, photo_paths[], signer_name,
signature_path, created_at) — supports multiple incidents per job, unlike the existing
one-per-job `bookings.waiver_signed` blanket waiver, which is untouched. Driver route
(`POST /api/drivers/jobs/[bookingId]/incident`) mirrors the existing waiver/pickup routes'
auth pattern (`requireDriver` + `driverAssignedTo`), logs to activity_log, and pushes an
admin notification immediately (safety/liability-relevant, shouldn't wait to be found).
Admin route (`GET /api/admin/bookings/[id]/incidents`) resolves storage paths to fresh
1-hour signed URLs on each load (same `driver-documents` bucket/pattern as
`evidence-pack/route.ts`). New driver-app screen (`incident.tsx`) reuses `CameraCapture`,
`SignaturePad`, `uploadImage`/`uploadSignature` — same building blocks as
`ChainOfCustodyForm.tsx`/`waiver.tsx`, no new native modules. Entry-point card added next
to the existing "Sign liability waiver" card on the job screen. New admin card
(`AccessIncidentsCard`) added to the booking detail page, renders nothing when a booking
has no incidents.

Verified end-to-end against the live DB/storage (not just typecheck): a scripted insert +
signed-URL resolution using the exact same Supabase calls both routes make — confirmed the
row writes, both photo and signature signed URLs resolve correctly, then cleaned up the
test row/files. Driver-app typechecks clean on its own tsconfig (0 errors). Main-repo
typecheck shows only the two pre-existing, already-documented errors on that page
(`pickup_confirmed`/`delivery_confirmed`), untouched by this change.

**Watch out for:** the driver-app changes are in the repo but won't reach an actual
driver's phone until the user runs their own `eas build` — there's no OTA/`eas update`
channel configured in this project (confirmed in `driver-app/BUILD-AND-RELEASE.md`), and
every native build step needs the user's own Expo/Apple/Google accounts.
