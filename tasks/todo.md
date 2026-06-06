## Task: Phase 5 — Invoicing, PDF Generation & Stripe Payments

### Context
Phase 1-4B all complete. Phase 5 = full invoicing system.

### Plan
- [x] Write plan to tasks/todo.md
- [x] supabase/migrations/phase5.sql — new columns + invoice storage bucket
- [x] lib/pdf/InvoiceTemplate.tsx — branded A4 PDF component
- [x] lib/pdf/generate-invoice-pdf.ts — renderToBuffer wrapper
- [x] lib/storage.ts — uploadInvoicePDF + getInvoiceSignedURL
- [x] lib/stripe-invoice.ts — createStripePaymentLink + voidStripePaymentLink
- [x] types/index.ts — add InvoicePDFData interface
- [x] app/api/admin/invoices/generate/route.ts
- [x] app/api/admin/invoices/send/route.ts
- [x] app/api/admin/invoices/resend/route.ts
- [x] app/api/admin/invoices/[id]/mark-paid/route.ts
- [x] app/api/admin/invoices/[id]/void/route.ts
- [x] app/api/admin/invoices/[id]/pdf/route.ts
- [x] app/api/webhooks/stripe/route.ts — full event handling
- [x] app/(public)/payment-success/page.tsx
- [x] components/admin/invoices/GenerateInvoiceModal.tsx
- [x] components/admin/invoices/InvoiceDetailModal.tsx
- [x] Updated booking detail page — invoice buttons wired
- [x] app/(admin)/admin/invoices/page.tsx — full rebuild
- [x] app/api/cron/automations/route.ts — overdue detection added
- [x] tsc --noEmit clean
- [x] tasks/lessons.md updated
- [x] Git commit + push

### Review
Phase 5 fully complete. Full invoice flow:
Admin clicks "Deposit Invoice" → GenerateInvoiceModal opens →
line items + due date filled → Generate & Preview →
PDF generated + stored in Supabase Storage →
Stripe Payment Link created → Invoice record inserted (draft) →
Send to Customer → Resend email with PDF + SMS with payment link →
Invoice status = sent →
Customer clicks Pay Now → Stripe Payment Link page →
Customer completes payment → Stripe fires webhook →
payment_intent.succeeded → invoice = paid →
payment inserted → booking status = deposit_paid_job_confirmed →
admin notification → automation triggered

Architecture notes:
- PDF uses @react-pdf/renderer via require() to avoid TS type conflicts
- Email attachments use spread pattern to avoid Resend type issues
- Joined table arrays use Array.isArray() guard for type safety
- Webhook never returns 500 — always 200 to prevent Stripe retries
