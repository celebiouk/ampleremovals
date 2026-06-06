## Task: Phase 5 — Invoicing, PDF Generation & Stripe Payments

### Context
Phase 1-4B all complete. Phase 5 = full invoicing system.

### Packages confirmed
- @react-pdf/renderer@4.5.1 ✅
- stripe ✅ (in lib/stripe.ts)
- resend ✅, twilio ✅, supabase ✅

### Plan
- [x] Write plan to tasks/todo.md
- [ ] supabase/migrations/phase5.sql — new columns + invoice storage bucket
- [ ] lib/pdf/InvoiceTemplate.tsx — branded A4 PDF component
- [ ] lib/pdf/generate-invoice-pdf.ts — renderToBuffer wrapper
- [ ] lib/storage.ts — uploadInvoicePDF + getInvoiceSignedURL
- [ ] lib/stripe-invoice.ts — createStripePaymentLink + voidStripePaymentLink
- [ ] types/index.ts — add InvoicePDFData interface
- [ ] app/api/admin/invoices/generate/route.ts
- [ ] app/api/admin/invoices/send/route.ts
- [ ] app/api/admin/invoices/resend/route.ts
- [ ] app/api/admin/invoices/[id]/mark-paid/route.ts
- [ ] app/api/admin/invoices/[id]/void/route.ts
- [ ] app/api/admin/invoices/[id]/pdf/route.ts
- [ ] app/api/webhooks/stripe/route.ts — full event handling
- [ ] app/(public)/payment-success/page.tsx
- [ ] components/admin/invoices/GenerateInvoiceModal.tsx
- [ ] components/admin/invoices/InvoiceDetailModal.tsx
- [ ] Update booking detail page — wire invoice buttons
- [ ] app/(admin)/admin/invoices/page.tsx — full rebuild
- [ ] app/(admin)/admin/payments/page.tsx — real data
- [ ] app/api/cron/automations/route.ts — add overdue detection
- [ ] tsc --noEmit clean
- [ ] tasks/lessons.md updated
- [ ] Git commit + push

### Review
(fill in after testing)
