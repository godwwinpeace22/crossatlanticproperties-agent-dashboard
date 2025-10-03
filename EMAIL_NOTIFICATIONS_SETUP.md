# Email Notifications Setup Guide

This guide explains how to set up email notifications for the CrossAtlanticProperties MLM Dashboard.

## Overview

The email notification system consists of:

1. **Database triggers** - Automatically create notifications when events occur
2. **Email queue table** - Stores pending emails for reliable delivery
3. **Email service** - Sends emails using your preferred provider
4. **API endpoints** - Process queue and handle retries
5. **Cron job** - Periodically processes the email queue

## Setup Steps

### 1. Run Database Migrations

Run the email notifications SQL script in your Supabase SQL editor:

```bash
# Copy the content of scripts/021_email_notifications.sql
# Paste into Supabase Dashboard > SQL Editor > New Query
# Click "Run"
```

This creates:

- `email_queue` table for queuing emails
- Database triggers to auto-queue emails
- Helper functions for processing and monitoring

### 2. Choose an Email Service Provider

Pick one of these providers:

#### Option A: Resend (Recommended for Next.js)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Install the package:

```bash
pnpm install resend
```

4. Add to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

5. Uncomment the Resend code in `lib/email-notifications.ts` (lines ~30-45)

6. Update the "from" email to match your verified domain:

```typescript
from: 'CrossAtlanticProperties <noreply@your-domain.com>',
```

#### Option B: SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Install the package:

```bash
pnpm install @sendgrid/mail
```

4. Add to `.env.local`:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

5. Uncomment the SendGrid code in `lib/email-notifications.ts` (lines ~47-62)

#### Option C: Nodemailer (SMTP)

1. Get SMTP credentials from your email provider
2. Install the package:

```bash
pnpm install nodemailer
```

3. Add to `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

4. Uncomment the Nodemailer code in `lib/email-notifications.ts` (lines ~64-85)

### 3. Set Up Cron Job to Process Queue

Choose one of these methods:

#### Method A: Vercel Cron (Recommended for Vercel deployments)

1. Create `vercel.json` in project root:

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

2. Generate a secret key:

```bash
openssl rand -base64 32
```

3. Add to Vercel environment variables:

```env
CRON_SECRET=your-generated-secret
```

4. Update the cron path to include auth:

```json
{
  "crons": [
    {
      "path": "/api/notifications/process-queue?limit=50",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

The cron job will run every 5 minutes automatically.

#### Method B: External Cron Service

Use a free cron service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create an account
2. Add a new cron job:

   - URL: `https://your-domain.com/api/notifications/process-queue?limit=50`
   - Schedule: Every 5 minutes (`*/5 * * * *`)
   - Method: GET
   - Headers: `Authorization: Bearer your-secret-key`

3. Add secret to `.env.local`:

```env
CRON_SECRET=your-secret-key
```

#### Method C: Supabase Database Cron (pg_cron)

If you have pg_cron enabled:

1. Create a cron job in Supabase SQL editor:

```sql
-- Schedule email processing every 5 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$ SELECT * FROM process_email_queue(50); $$
);
```

Note: This requires the database function to actually send emails, not just queue them.

#### Method D: Manual Triggering (Testing)

For testing or manual triggering, call the API directly:

```bash
# As admin user
curl -X POST https://your-domain.com/api/notifications/process-queue \
  -H "Cookie: your-auth-cookie"
```

### 4. Configure Email Templates (Optional)

The default email templates are in `lib/email-notifications.ts`. Customize them:

1. Update the `generateEmailTemplate()` function
2. Modify colors, layout, or content
3. Add company logo: Update the header section

Example customization:

```typescript
// Add logo to header
<tr>
  <td style="background-color: ${color}; padding: 30px; text-align: center;">
    <img
      src="https://your-domain.com/logo.png"
      alt="Logo"
      style="max-width: 200px;"
    />
    <h1 style="margin: 10px 0 0 0; color: #ffffff; font-size: 24px; font-weight: bold;">
      CrossAtlanticProperties
    </h1>
  </td>
</tr>
```

### 5. Test Email Notifications

1. **Test notification creation:**

```sql
-- In Supabase SQL Editor
INSERT INTO notifications (user_id, type, title, message)
VALUES (
  'your-user-id',
  'payment_received',
  'Test Payment Notification',
  'This is a test notification to verify email delivery.'
);
```

2. **Check email queue:**

```sql
SELECT * FROM get_email_queue_stats();
```

3. **Manually process queue:**

```bash
curl https://your-domain.com/api/notifications/process-queue?limit=10
```

4. **Check if email was sent:**

```sql
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;
```

### 6. Monitor Email Delivery

#### View queue statistics:

```sql
SELECT * FROM get_email_queue_stats();
```

#### Check failed emails:

```sql
SELECT * FROM email_queue
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

#### Retry failed emails:

```sql
SELECT retry_failed_emails();
```

#### View recent emails:

```sql
SELECT
  eq.*,
  n.title,
  n.type
FROM email_queue eq
LEFT JOIN notifications n ON n.id = eq.notification_id
ORDER BY eq.created_at DESC
LIMIT 20;
```

## Notification Types

The following notification types trigger emails:

1. **interest_submitted** - User submits property interest
2. **payment_received** - Payment installment received
3. **payment_approved** - Payment approved by admin
4. **payment_reminder** - Upcoming payment reminder
5. **all_payments_complete** - All installments paid
6. **commission_earned** - Agent earns commission
7. **kyc_approved** - KYC verification approved
8. **kyc_rejected** - KYC verification rejected

## Troubleshooting

### Emails not sending

1. **Check queue table:**

   ```sql
   SELECT * FROM email_queue WHERE status = 'pending';
   ```

2. **Check email service credentials:**

   - Verify API keys in environment variables
   - Test API key with provider's dashboard

3. **Check cron job:**

   - Verify cron job is running
   - Check logs in Vercel or your cron service

4. **Check for errors:**
   ```sql
   SELECT * FROM email_queue WHERE last_error IS NOT NULL;
   ```

### Emails going to spam

1. **Verify sender domain** with your email provider
2. **Add SPF and DKIM records** to your DNS
3. **Use a custom domain** for sending (not Gmail/Yahoo)
4. **Add unsubscribe link** to email footer

### High email volume

1. **Implement rate limiting:**

   - Batch process emails in smaller groups
   - Add delays between batches

2. **Use a dedicated queue service:**

   - Bull Queue (Redis-based)
   - AWS SQS
   - Google Cloud Tasks

3. **Optimize cron frequency:**
   - Reduce from every 5 minutes to every 15 minutes
   - Process larger batches less frequently

## Advanced Configuration

### Custom Email Templates

Create template variations for different notification types:

```typescript
// In lib/email-notifications.ts
function getTemplateByType(type: string) {
  switch (type) {
    case "payment_approved":
      return paymentApprovedTemplate;
    case "commission_earned":
      return commissionEarnedTemplate;
    default:
      return defaultTemplate;
  }
}
```

### Email Preferences

Allow users to control which emails they receive:

1. Add `email_preferences` column to profiles table
2. Check preferences before queuing emails
3. Add unsubscribe link to emails

### Email Analytics

Track email opens and clicks:

1. Add tracking pixel to email HTML
2. Create unique tracking URLs for links
3. Store click events in database

## Production Checklist

- [ ] Email service provider configured with valid API keys
- [ ] Sender domain verified with email provider
- [ ] SPF and DKIM records added to DNS
- [ ] Database migrations run successfully
- [ ] Cron job set up and running
- [ ] Test emails sent and received
- [ ] Error monitoring set up
- [ ] Email queue monitored regularly
- [ ] Failed emails retry mechanism tested
- [ ] Email templates customized with branding
- [ ] Unsubscribe functionality implemented (if required)
- [ ] Rate limiting configured for high volume

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review email service provider documentation
3. Check Supabase logs for database errors
4. Review Next.js API route logs

## Environment Variables Summary

Required variables:

```env
# Choose ONE email provider:

# Option 1: Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Option 2: SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# Option 3: Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Required for all:
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional:
CRON_SECRET=your-secret-key-for-cron-protection
```
