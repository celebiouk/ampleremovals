# API Reference

Complete reference for all API routes in the Ample Removals platform.

---

## 📋 Table of Contents

1. [Public Booking Routes](#public-booking-routes)
2. [Admin Booking Routes](#admin-booking-routes)
3. [Admin Quote Routes](#admin-quote-routes)
4. [Admin Invoice Routes](#admin-invoice-routes)
5. [Admin Document Routes](#admin-document-routes)
6. [Admin User Routes](#admin-user-routes)
7. [Webhook Routes](#webhook-routes)
8. [Utility Routes](#utility-routes)

---

## Public Booking Routes

### POST `/api/bookings/removals`

Submit a new removal booking.

**Auth**: None (public)

**Body**:
```json
{
  "fullName": "John Smith",
  "email": "john@example.com",
  "phone": "+447700900123",
  "moveDate": "2026-07-15",
  "flexibleDate": false,
  "description": "3 bed house move",
  "collectionAddress": {
    "line_1": "123 High St",
    "postcode": "SW1A 1AA",
    "city": "London"
  },
  "deliveryAddress": {
    "line_1": "456 Park Ave",
    "postcode": "M1 1AA",
    "city": "Manchester"
  },
  "propertyType": "house",
  "bedrooms": 3,
  "additionalServices": ["packing", "assembly"]
}
```

**Response (200)**:
```json
{
  "success": true,
  "reference": "RMV-2026-X8K4P"
}
```

**Similar Routes**:
- POST `/api/bookings/man-and-van`
- POST `/api/bookings/house-clearance`
- POST `/api/bookings/house-cleaning`
- POST `/api/bookings/end-of-tenancy`

---

## Admin Booking Routes

### GET `/api/admin/bookings`

List all bookings with filters.

**Auth**: Required (admin session)

**Query Params**:
- `status` - Filter by status (optional)
- `service` - Filter by service type (optional)
- `search` - Search by reference/name (optional)

**Response (200)**:
```json
{
  "success": true,
  "bookings": [
    {
      "id": "uuid",
      "reference": "RMV-2026-X8K4P",
      "service_type": "removals",
      "status": "inquiry",
      "customer": { "full_name": "John Smith" },
      "created_at": "2026-06-07T10:00:00Z"
    }
  ]
}
```

### GET `/api/admin/bookings/[id]`

Get booking detail with all related data.

**Auth**: Required

**Response (200)**:
```json
{
  "success": true,
  "booking": { /* full booking object */ },
  "customer": { /* customer object */ },
  "addresses": { /* collection & delivery */ },
  "invoices": [ /* invoice array */ ],
  "notes": [ /* notes array */ ],
  "history": [ /* status history */ ],
  "activity": [ /* activity log */ ]
}
```

### PATCH `/api/admin/bookings/[id]/status`

Update booking status.

**Auth**: Required

**Body**:
```json
{
  "status": "called"
}
```

**Response (200)**:
```json
{
  "success": true
}
```

### POST `/api/admin/bookings/[id]/notes`

Add internal note.

**Auth**: Required

**Body**:
```json
{
  "content": "Customer prefers morning slot"
}
```

**Response (200)**:
```json
{
  "success": true,
  "note": { /* note object */ }
}
```

### DELETE `/api/admin/bookings/[id]/notes/[noteId]`

Delete internal note.

**Auth**: Required

**Response (200)**:
```json
{
  "success": true
}
```

---

## Admin Quote Routes

### POST `/api/admin/bookings/[id]/quote/save`

Save quote (draft mode).

**Auth**: Required

**Body**:
```json
{
  "lineItems": [
    {
      "description": "Base removal service",
      "quantity": 1,
      "unitPrice": 500,
      "total": 500
    }
  ],
  "subtotal": 500,
  "vatRate": 20,
  "vatAmount": 100,
  "total": 600,
  "validUntil": "2026-07-20",
  "notes": "Quote valid for 14 days"
}
```

**Response (200)**:
```json
{
  "success": true
}
```

### POST `/api/admin/bookings/[id]/quote/send`

Generate PDF and send quote via email, SMS, and WhatsApp.

**Auth**: Required

**Body**: Same as `/quote/save`

**Response (200)**:
```json
{
  "success": true,
  "pdfUrl": "https://...",
  "emailSent": true,
  "smsSent": true,
  "whatsAppSent": true
}
```

---

## Admin Invoice Routes

### POST `/api/admin/invoices/generate`

Generate invoice PDF and create invoice record.

**Auth**: Required

**Body**:
```json
{
  "bookingId": "uuid",
  "type": "deposit",
  "lineItems": [
    { "description": "Deposit payment", "amount": 200 }
  ],
  "total": 200,
  "dueDate": "2026-07-10"
}
```

**Response (200)**:
```json
{
  "success": true,
  "invoiceId": "uuid",
  "reference": "INV-2026-XXXXX",
  "pdfUrl": "https://..."
}
```

### POST `/api/admin/invoices/send`

Send invoice via email with PDF and Stripe payment link.

**Auth**: Required

**Body**:
```json
{
  "invoiceId": "uuid"
}
```

**Response (200)**:
```json
{
  "success": true,
  "paymentLink": "https://checkout.stripe.com/..."
}
```

### POST `/api/admin/invoices/[id]/mark-paid`

Manually mark invoice as paid.

**Auth**: Required

**Response (200)**:
```json
{
  "success": true
}
```

### POST `/api/admin/invoices/[id]/void`

Void an invoice.

**Auth**: Required

**Response (200)**:
```json
{
  "success": true
}
```

---

## Admin Document Routes

### GET `/api/admin/bookings/[id]/documents`

List all documents for a booking.

**Auth**: Required

**Response (200)**:
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "fileName": "survey_photo.jpg",
      "fileSize": 2048000,
      "fileType": "image/jpeg",
      "signedUrl": "https://...",
      "createdAt": "2026-06-07T10:00:00Z"
    }
  ]
}
```

### POST `/api/admin/bookings/[id]/documents`

Upload a new document.

**Auth**: Required

**Body**: `multipart/form-data` with `file` field

**Response (200)**:
```json
{
  "success": true,
  "document": { /* document object with signedUrl */ }
}
```

**Validation**:
- Max size: 10MB
- Allowed types: JPG, PNG, WebP, PDF, Word

### DELETE `/api/admin/bookings/[id]/documents/[docId]`

Delete a document.

**Auth**: Required

**Response (200)**:
```json
{
  "success": true
}
```

---

## Admin User Routes

### GET `/api/admin/users`

List all admin users (super admin only).

**Auth**: Required (super admin)

**Response (200)**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-06-01T10:00:00Z"
    }
  ]
}
```

### POST `/api/admin/users`

Create new admin user (super admin only).

**Auth**: Required (super admin)

**Body**:
```json
{
  "email": "newadmin@example.com",
  "fullName": "New Admin",
  "password": "securepassword",
  "role": "admin"
}
```

**Response (200)**:
```json
{
  "success": true,
  "userId": "uuid"
}
```

### DELETE `/api/admin/users/[id]`

Delete admin user (super admin only).

**Auth**: Required (super admin)

**Response (200)**:
```json
{
  "success": true
}
```

### PATCH `/api/admin/users/[id]`

Update admin user (super admin only).

**Auth**: Required (super admin)

**Body** (partial):
```json
{
  "isActive": false,
  // OR
  "newPassword": "newsecurepassword"
}
```

**Response (200)**:
```json
{
  "success": true
}
```

### GET `/api/admin/activity`

Get admin activity logs (super admin only).

**Auth**: Required (super admin)

**Query Params**:
- `limit` - Max results (default: 50)
- `adminUserId` - Filter by admin (optional)

**Response (200)**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "action": "Created admin user",
      "adminEmail": "admin@example.com",
      "metadata": { /* action details */ },
      "createdAt": "2026-06-07T10:00:00Z"
    }
  ]
}
```

---

## Webhook Routes

### POST `/api/webhooks/stripe`

Stripe webhook handler.

**Auth**: Stripe signature verification

**Events Handled**:
- `payment_intent.succeeded` - Update invoice to paid
- `payment_intent.payment_failed` - Log failure

**Response (200)**:
```json
{
  "received": true
}
```

**Note**: Always returns 200 to prevent Stripe retries.

---

## Utility Routes

### POST `/api/postcode/lookup`

UK postcode lookup (uses postcodes.io).

**Auth**: None (public)

**Body**:
```json
{
  "postcode": "SW1A 1AA"
}
```

**Response (200)**:
```json
{
  "success": true,
  "result": {
    "postcode": "SW1A 1AA",
    "town": "London",
    "region": "Greater London"
  }
}
```

### POST `/api/cron/automations`

Cron job endpoint for automation rules.

**Auth**: Bearer token with `CRON_SECRET`

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response (200)**:
```json
{
  "success": true,
  "processed": 15
}
```

**Runs**:
- Daily at 8am (configured in vercel.json)
- Checks all automation rules
- Sends emails/SMS where conditions match

---

## Error Responses

All routes return structured errors:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**400 Bad Request**:
```json
{
  "success": false,
  "error": "Validation error: email is required"
}
```

**429 Too Many Requests**:
```json
{
  "success": false,
  "error": "Too many requests. Please try again later."
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limits

Public routes are rate-limited by IP:

| Route | Limit |
|-------|-------|
| `/api/bookings/*` | 10 requests / 15 minutes |
| `/api/postcode/lookup` | 30 requests / 60 minutes |

Admin routes have no rate limits (protected by auth).

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary amounts are in pence/cents (e.g., 500 = £5.00)
- All responses include `success: boolean` field
- File uploads use `multipart/form-data`
- All other requests use `application/json`
