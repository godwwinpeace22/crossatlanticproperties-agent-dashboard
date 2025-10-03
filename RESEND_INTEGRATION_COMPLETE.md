# 📧 Resend Email Integration - Setup Complete

## ✅ What Has Been Installed

1. **Resend Package** - Email service SDK installed
2. **tsx** - TypeScript execution for test scripts
3. **Email Service Library** - Complete email notification system in `lib/email-notifications.ts`
4. **API Endpoints** - Two endpoints for email processing:
   - `/api/notifications/send-email` - Send individual emails
   - `/api/notifications/process-queue` - Process email queue (for cron jobs)
5. **Database Scripts** - Email queue table and triggers in `scripts/021_email_notifications.sql`
6. **Test Script** - Email configuration test in `scripts/test-email.ts`

## 📋 Next Steps (In Order)

### Step 1: Get Your Resend API Key

1. Go to https://resend.com and create a free account
2. Navigate to **API Keys** section
3. Click **"Create API Key"**
4. Name it: "CrossAtlanticProperties Production"
5. Copy the API key (it starts with `re_`)

### Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:

```env
# Your existing Supabase keys
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Add these new variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_paste_your_api_key_here
CRON_SECRET=generate-a-random-secret
```

To generate a CRON_SECRET:

```bash
openssl rand -base64 32
```

### Step 3: Test Email Configuration

Run the test script to verify everything works:

```bash
pnpm test:email
```

You should see:

- ✅ API key validation
- ✅ Test email sent
- ✅ Email ID from Resend

Check your email at https://resend.com/emails to see the test message!

### Step 4: Run Database Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **"New Query"**
4. Copy the entire content of `scripts/021_email_notifications.sql`
5. Paste and click **"Run"**

This creates:

- `email_queue` table
- Automatic email queuing triggers
- Helper functions for monitoring

### Step 5: Update Sender Domain

**For Development/Testing:**

The code is currently set to use `noreply@crossatlanticproperties.com`.

For local testing, update `lib/email-notifications.ts` line 25:

```typescript
// Change this:
from: 'CrossAtlanticProperties <noreply@crossatlanticproperties.com>',

// To Resend's test domain:
from: 'onboarding@resend.dev',
```

**For Production:**

1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain: `crossatlanticproperties.com`
4. Add the DNS records to your domain registrar:
   - SPF record
   - DKIM record
   - DMARC record
5. Wait for verification (5-10 minutes)
6. Keep `noreply@crossatlanticproperties.com` in the code

### Step 6: Set Up Automated Email Processing

Emails are queued in the database and need to be processed periodically.

**Option A: Vercel Cron (if deploying to Vercel)**

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/notifications/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Add `CRON_SECRET` to your Vercel environment variables.

**Option B: External Cron Service**

Use https://cron-job.org (free):

1. Create an account
2. Add new cron job:
   - **Title**: Process Email Queue
   - **URL**: `https://your-domain.com/api/notifications/process-queue?limit=50`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)
   - **Method**: GET
   - **Header**: `Authorization: Bearer your-cron-secret`
3. Enable the job

### Step 7: Test with Real Notifications

Create a test notification in Supabase:

```sql
-- Get a user ID from your profiles table first
SELECT id, email FROM profiles LIMIT 1;

-- Then insert a notification (replace USER_ID with actual ID)
INSERT INTO notifications (user_id, type, title, message)
VALUES (
  'USER_ID_HERE',
  'payment_received',
  'Payment Received - Test',
  'Your payment of ₦500,000 has been received and is being processed.'
);
```

Check:

1. The `email_queue` table should have a new entry
2. Run the cron manually: `curl http://localhost:3000/api/notifications/process-queue`
3. Check Resend dashboard for the sent email

## 🎨 Email Templates

Email templates are fully customizable in `lib/email-notifications.ts`.

Current template features:

- ✅ Responsive HTML design
- ✅ Color-coded by notification type
- ✅ Professional branding
- ✅ Call-to-action buttons
- ✅ Plain text fallback

To customize:

1. Edit the `generateEmailTemplate()` function
2. Update colors in the `colors` object
3. Add your logo
4. Modify footer content

## 📊 Monitoring & Management

### Check Email Queue Status

```sql
SELECT * FROM get_email_queue_stats();
```

### View Recent Emails

```sql
SELECT
  id,
  to_email,
  subject,
  status,
  attempts,
  sent_at,
  last_error
FROM email_queue
ORDER BY created_at DESC
LIMIT 20;
```

### View Failed Emails

```sql
SELECT * FROM email_queue
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

### Retry Failed Emails

```sql
SELECT retry_failed_emails();
```

### Manual Queue Processing

```bash
# Process next 50 emails
curl http://localhost:3000/api/notifications/process-queue?limit=50
```

## 🚦 Notification Types That Trigger Emails

1. ✅ `interest_submitted` - Property interest submitted
2. ✅ `payment_received` - Payment received
3. ✅ `payment_approved` - Payment approved by admin
4. ✅ `payment_reminder` - Payment reminder
5. ✅ `all_payments_complete` - All payments completed
6. ✅ `commission_earned` - Commission earned
7. ✅ `kyc_approved` - KYC approved
8. ✅ `kyc_rejected` - KYC rejected

## 📈 Resend Free Tier

- **100 emails per day**
- **1 verified domain**
- **No credit card required**

For production with higher volume, upgrade to a paid plan.

## 🔍 Troubleshooting

### "RESEND_API_KEY not configured"

- Ensure `.env.local` exists
- Restart dev server: `pnpm dev`

### Test email not sending

- Check API key in Resend dashboard
- Verify internet connection
- Check Resend status: https://resend.com/status

### Emails going to spam

- Verify domain with SPF/DKIM records
- Use custom domain (not testing domain)
- Check email content for spam triggers

### Queue not processing

- Verify cron job is running
- Check for errors in email_queue table
- Manually trigger: POST to `/api/notifications/process-queue`

## 📚 Documentation Files

- `RESEND_SETUP.md` - Detailed Resend setup guide
- `EMAIL_NOTIFICATIONS_SETUP.md` - General email system overview
- `scripts/021_email_notifications.sql` - Database migration
- `lib/email-notifications.ts` - Email service implementation

## ✨ You're All Set!

Your email notification system is ready. Follow the steps above to complete the setup.

**Quick Start Checklist:**

- [ ] Get Resend API key
- [ ] Add to `.env.local`
- [ ] Run `pnpm test:email`
- [ ] Run database migration
- [ ] Set up cron job
- [ ] Test with real notification
- [ ] Configure sender domain for production

Need help? Check the troubleshooting section or documentation files!
