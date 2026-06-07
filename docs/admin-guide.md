# Admin Dashboard User Guide

Complete guide to using the Ample Removals admin CRM dashboard.

---

## 📱 Accessing the Dashboard

**URL**: `https://your-domain.com/admin/login`

**Login Credentials**:
- Email: Your admin email address
- Password: Provided during setup

**First Time Login**:
- You'll receive an email invitation from Supabase
- Click the link and set your password
- Bookmark `/admin` for quick access

---

## 🏠 Dashboard Overview

The dashboard is your central hub for managing all bookings, customers, and operations.

### **Key Metrics (Top Cards)**

1. **Total Bookings** - All-time booking count
2. **Active Jobs** - Bookings currently in progress
3. **Revenue (This Month)** - Total invoiced this month
4. **Conversion Rate** - Inquiry → Paid job conversion

### **Recent Activity**

Shows the latest 10 actions across the platform:
- New bookings
- Status changes
- Invoices sent
- Payments received

---

## 📋 Managing Bookings

### **Bookings List** (`/admin/bookings`)

**Features**:
- Search by booking reference, customer name, or postcode
- Filter by service type (Removals, Man & Van, etc.)
- Filter by status (Inquiry, Called, Confirmed, etc.)
- Sort by date, status, or service

**Quick Actions**:
- Click any row to open booking detail
- Bulk status update (select multiple → change status)

### **Booking Detail Page** (`/admin/bookings/[id]`)

**Left Column: Booking Information**

1. **Customer Details**
   - Full name, email, phone
   - Click phone number to call
   - Click email to send message
   - Click SMS icon to text

2. **Booking Details**
   - Service type
   - Booking date
   - Flexible date indicator
   - Booking reference

3. **Service Details**
   - Service-specific information
   - Collection/delivery addresses (for removals)
   - Property details (for cleaning)
   - Item details (for clearance)

4. **Additional Services**
   - Packing, assembly, storage, etc.
   - Shows what customer requested

5. **Description**
   - Customer's free-text description
   - Special requests or notes

6. **Documents & Files** 🆕
   - Upload survey photos, signed agreements, permits
   - Drag-and-drop or click to browse
   - Max 10MB per file (PDF, Word, JPG, PNG)
   - Download or delete existing documents

7. **Quote**
   - Create line-item quotes
   - Auto-calculates VAT and totals
   - Set validity period
   - Send quote via email, SMS, and WhatsApp simultaneously
   - View/edit existing quotes

8. **Invoices**
   - Generate deposit invoice
   - Generate full balance invoice
   - Send invoice with Stripe payment link
   - Track payment status
   - Download PDF invoices

**Right Column: Admin Tools**

9. **Booking Status**
   - Change status from dropdown
   - Updates status history automatically
   - Common statuses:
     - **Inquiry** - just submitted
     - **Called** - you've contacted them
     - **Processing** - preparing quote
     - **Deposit Invoice Sent** - awaiting deposit
     - **Deposit Paid Job Confirmed** - job locked in
     - **Job Completed** - finished

10. **Status History**
    - Full timeline of status changes
    - Shows who made changes and when

11. **Internal Notes**
    - Private notes only visible to admins
    - Add reminders, observations, follow-up tasks
    - Delete notes you no longer need

12. **Send Email**
    - Choose from pre-written templates
    - Template categories:
      - Follow-up emails
      - Confirmation emails
      - Reminder emails
      - Thank you emails
    - Preview and send

13. **Send SMS**
    - Quick text message to customer
    - Character count shown
    - Send immediately

14. **Activity Log**
    - Complete audit trail
    - Every action logged with timestamp
    - Useful for reviewing what happened

---

## 📊 Pipeline View (`/admin/pipeline`)

**Kanban-style board** with drag-and-drop status changes.

**Columns**:
1. Inquiry - new bookings
2. Called - contacted
3. Processing - preparing quote
4. Pending - awaiting customer
5. Confirmed - job booked
6. Completed - job done

**How to Use**:
- Drag a booking card to a new column to change status
- Click a card to open booking detail
- Filter by service type at the top
- Search by reference or name

**Pro Tip**: This view is fastest for bulk status updates. Drag multiple bookings through the pipeline as you work through them.

---

## 📅 Calendar View (`/admin/calendar`)

**Monthly calendar** showing all bookings by move date.

**Features**:
- Bookings appear on their scheduled date
- Color-coded by service type
- Click any booking to open detail
- Navigate months with arrows
- Today button to return to current month

**Use Cases**:
- See what jobs are scheduled this week
- Check for date conflicts
- Plan team allocation
- Avoid overbooking

---

## 👥 Customers Page (`/admin/customers`)

**Complete customer database** with all contact details.

**Features**:
- Search by name, email, or phone
- See booking count per customer
- Filter by service preference
- View all bookings from one customer

**Customer Detail**:
- Full contact info
- All bookings from this customer
- Total revenue from this customer
- Quick actions (email, SMS, call)

---

## 💰 Invoices Page (`/admin/invoices`)

**All invoices in one place** with advanced filtering.

**Columns**:
- Invoice reference (INV-2026-XXXXX)
- Booking reference
- Customer name
- Type (Deposit or Full Balance)
- Amount
- Status (Draft, Sent, Paid, Overdue, Void)
- Due date
- Actions (View, Download, Resend)

**Filters**:
- By status (Paid, Unpaid, Overdue)
- By type (Deposit, Full)
- By date range

**Actions**:
- **View**: See invoice details
- **Download**: Get PDF
- **Resend**: Send again via email
- **Mark as Paid**: If paid outside Stripe
- **Void**: Cancel invoice

---

## 💳 Payments Page (`/admin/payments`)

**All Stripe payments** received.

**Shows**:
- Payment date
- Customer name
- Amount
- Associated invoice
- Stripe payment ID
- Status

**Use Cases**:
- Reconcile payments
- Check what's been paid
- Track revenue
- Refund tracking (if needed)

---

## 📈 Reports Page (`/admin/reports`)

**Visual analytics** to understand your business.

**Charts Available**:
1. **Bookings Over Time** - trend line
2. **Revenue Over Time** - cash flow
3. **Service Breakdown** - which services are most popular
4. **Status Distribution** - pipeline health
5. **Conversion Funnel** - where leads drop off

**Date Range Selector**:
- Last 7 days
- Last 30 days
- Last 90 days
- This year
- Custom range

---

## ⚙️ Automations Page (`/admin/automations`)

**Pre-built automation rules** that run daily at 8am.

**Built-in Rules**:

1. **Follow-up: Inquiry not called (24h)**
   - Reminds you to call new inquiries

2. **Follow-up: Called but not answered (48h)**
   - Reminds you to try again

3. **Follow-up: Quote sent (48h)**
   - Nudge customer if no response

4. **Reminder: Deposit invoice due soon (3 days)**
   - Remind customer payment is due

5. **Overdue: Deposit invoice overdue (1 day)**
   - Alert customer payment is overdue

6. **Reminder: Move day approaching (2 days)**
   - Confirm details before move day

7. **Follow-up: Job completed (2 days)**
   - Request review/feedback

8. **Stale lead: No activity (7 days)**
   - Mark as bad lead if no progress

**Toggle On/Off**:
- Click the switch to enable/disable any rule
- Rules only run on bookings where conditions match

**How It Works**:
- Runs every day at 8am (UK time)
- Checks all bookings
- Sends email/SMS if conditions match
- Logs action to activity log

**Pro Tip**: Leave all rules ON. They're smart and won't spam customers - they only send when conditions are met.

---

## 🛡️ Manage Admins Page (`/admin/manage-admins`)

**Super Admin Only** - Manage team access.

### **Admin Users Tab**

**Create New Admin**:
1. Click **"Create Admin User"**
2. Fill in:
   - Email
   - Full Name
   - Password (min 6 characters)
   - Role (Admin or Super Admin)
3. Click **"Create User"**
4. New admin can now log in

**Manage Existing Admins**:
- **Activate/Deactivate**: Toggle account access
- **Change Password**: Reset admin password
- **Delete**: Remove admin (cannot delete yourself or main super admin)

### **Activity Log Tab**

**See everything admins do**:
- Who created quotes
- Who changed booking statuses
- Who sent invoices
- Who deleted documents
- Complete audit trail with timestamps

**Use Cases**:
- Track team productivity
- Investigate issues
- Monitor for mistakes
- Training and quality control

---

## ⚙️ Settings Page (`/admin/settings`)

### **Company Details Tab**

Update your business information:
- Company name
- Phone number
- Email address
- Full address
- Google Review link (for customer emails)

### **Notifications Tab**

Toggle email notifications:
- New booking notifications
- Payment received notifications
- Invoice overdue notifications

### **Account Tab**

Change your admin password:
1. Enter current password
2. Enter new password
3. Confirm new password
4. Save

### **Danger Zone Tab**

Sign out from all devices (security feature).

---

## 🔐 Security Best Practices

1. **Never share your admin password**
2. **Log out when done** (especially on shared computers)
3. **Use strong passwords** (mix of letters, numbers, symbols)
4. **Don't screenshot sensitive info** (customer payment details)
5. **Review activity logs weekly** (catch unusual activity)

---

## 🆘 Troubleshooting

### "Session expired" message
→ Log out and log back in

### Can't see a booking
→ Check filters - you might be filtering it out

### Invoice won't generate
→ Check the quote exists first
→ Ensure customer details are complete

### Email not sending
→ Check spam folder
→ Verify customer email is correct
→ Contact support if issue persists

### Payment not updating invoice
→ Wait 2-3 minutes for webhook
→ Check Stripe dashboard
→ Manually mark as paid if needed

---

## 💡 Pro Tips

1. **Use the Pipeline view** for fast status updates - drag and drop is faster than clicking into each booking

2. **Add internal notes** liberally - future you will thank you for the context

3. **Send quotes ASAP** - the faster you respond, the higher your conversion rate

4. **Check automations daily** - they'll remind you of follow-ups you might forget

5. **Upload documents** - attach survey photos, signed forms, parking permits to bookings for easy reference

6. **Use templates** - pre-written email templates save time and ensure consistency

7. **Filter by "Inquiry"** first thing each morning - tackle new leads while they're hot

8. **Review reports weekly** - understand trends and optimize your business

---

## 📞 Getting Help

**Common Issues**: Check this guide first

**Technical Problems**: Check the deployment guide (docs/deployment.md)

**Feature Requests**: Contact development team

---

**You're all set!** The admin dashboard is designed to be intuitive. Spend 15 minutes clicking around and you'll be an expert.
