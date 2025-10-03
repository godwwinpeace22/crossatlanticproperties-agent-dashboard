# Resend Email Setup Instructions

## Quick Start

### 1. Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Navigate to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Give it a name (e.g., "CrossAtlanticProperties Production")
5. Copy the API key (starts with `re_`)

### 2. Add API Key to Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Resend API key:

```env
RESEND_API_KEY=re_your_actual_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production (Vercel, etc.), add these as environment variables in your hosting platform.

### 3. Configure Sender Domain (Important!)

By default, emails will be sent from `noreply@crossatlanticproperties.com`.

**Option A: Use Resend's Testing Domain (Development Only)**

For testing, Resend provides a testing domain. Update the `from` address in `lib/email-notifications.ts`:

```typescript
from: 'onboarding@resend.dev',  // Resend's testing domain
```

**Option B: Use Your Own Domain (Production)**

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `crossatlanticproperties.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings:
   - SPF record
   - DKIM record
   - DMARC record (optional but recommended)
5. Wait for verification (usually takes a few minutes)
6. Use your verified domain in `lib/email-notifications.ts`:

```typescript
from: 'CrossAtlanticProperties <noreply@crossatlanticproperties.com>',
```

### 4. Run Database Migration

Run the email queue SQL script in Supabase:

```bash
# Open Supabase Dashboard > SQL Editor
# Copy and paste the content of scripts/021_email_notifications.sql
# Click "Run"
```

### 5. Test Email Sending

**Method 1: Insert test notification in Supabase**

```sql
-- Replace 'your-user-id' with an actual user ID from your profiles table
INSERT INTO notifications (user_id, type, title, message)
VALUES (
  'your-user-id',
  'payment_received',
  'Test Payment Notification',
  'This is a test notification to verify email delivery via Resend.'
);
```

**Method 2: Use the test API endpoint**

Create a test file:

```bash
# test-email.sh
curl -X POST http://localhost:3000/api/notifications/send-email \
  -H "Content-Type: application/json" \
  -d '{"notificationId": "notification-id-from-database"}'
```

### 6. Set Up Automated Email Processing

**For Vercel:**

Create `vercel.json`:

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

**For other platforms:**

Use an external cron service like [cron-job.org](https://cron-job.org):

- URL: `https://your-domain.com/api/notifications/process-queue?limit=50`
- Schedule: Every 5 minutes
- Method: GET
- Header: `Authorization: Bearer your-cron-secret`

### 7. Monitor Email Delivery

**Check queue status:**

```sql
SELECT * FROM get_email_queue_stats();
```

**View recent emails:**

```sql
SELECT
  id,
  to_email,
  subject,
  status,
  attempts,
  last_error,
  created_at,
  sent_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 20;
```

**Retry failed emails:**

```sql
SELECT retry_failed_emails();
```

## Resend Free Tier Limits

- **100 emails per day**
- **1 domain**
- **No credit card required**

For production use, consider upgrading to a paid plan for higher limits.

## Email Template Customization

The email templates are in `lib/email-notifications.ts`. You can customize:

1. **Colors** - Update the `colors` object for different notification types
2. **Logo** - Add your logo URL in the header section
3. **Footer** - Customize company information and links
4. **Layout** - Modify the HTML structure

Example: Adding a logo:

```typescript
// In generateEmailTemplate function
<tr>
  <td style="background-color: ${color}; padding: 30px; text-align: center;">
    <img
      src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png"
      alt="CrossAtlanticProperties"
      style="max-width: 150px; margin-bottom: 15px;"
    />
    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
      CrossAtlanticProperties
    </h1>
  </td>
</tr>
```

## Troubleshooting

### "RESEND_API_KEY not configured" warning

- Make sure `.env.local` exists in project root
- Verify the API key is correctly pasted
- Restart your development server: `pnpm dev`

### Emails not sending

1. Check Resend dashboard for logs: [resend.com/emails](https://resend.com/emails)
2. Verify your sender domain is verified
3. Check email queue for errors:
   ```sql
   SELECT * FROM email_queue WHERE status = 'failed';
   ```

### Emails going to spam

1. Verify your domain with SPF, DKIM, and DMARC records
2. Use a custom domain (not the testing domain)
3. Avoid spam trigger words in subject lines
4. Add an unsubscribe link (if required by your region)

### Rate limit exceeded

Free tier: 100 emails/day. Solutions:

1. Upgrade to paid plan
2. Reduce email frequency (only critical notifications)
3. Batch notifications into digest emails

## Production Checklist

- [ ] Resend account created
- [ ] API key added to environment variables
- [ ] Custom domain verified (if not using testing domain)
- [ ] DNS records (SPF, DKIM) configured
- [ ] Database migration run successfully
- [ ] Test email sent and received
- [ ] Cron job configured and running
- [ ] Email templates customized with branding
- [ ] Monitoring queries bookmarked
- [ ] Rate limits appropriate for usage
- [ ] Error alerting set up

## Support

- Resend Documentation: [resend.com/docs](https://resend.com/docs)
- Resend API Reference: [resend.com/docs/api-reference](https://resend.com/docs/api-reference)
- Email template examples: [react.email](https://react.email)

## Next Steps

1. ✅ Resend package installed
2. ✅ Email service configured
3. ⏳ Add RESEND_API_KEY to .env.local
4. ⏳ Run database migration (021_email_notifications.sql)
5. ⏳ Configure sender domain in Resend dashboard
6. ⏳ Test email sending
7. ⏳ Set up cron job for automated processing
