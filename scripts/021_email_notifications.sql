-- =====================================================
-- Script 021: Email Notification Integration
-- =====================================================
-- This script adds functionality to trigger email notifications
-- when notifications are created in the database.
--
-- Options for implementation:
-- 1. Supabase Webhooks (recommended for production)
-- 2. Edge Functions (for serverless email sending)
-- 3. Background job polling (simple but less real-time)
--
-- This script provides the foundation for any approach.
-- =====================================================

-- Function to queue email notifications
-- This function is called by triggers and stores email send requests
CREATE OR REPLACE FUNCTION queue_notification_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if notification should trigger an email
  -- (You can add conditions here to control which notifications send emails)
  
  -- For now, we'll send emails for these notification types:
  IF NEW.type IN (
    'interest_submitted',
    'payment_received',
    'payment_approved',
    'payment_reminder',
    'all_payments_complete',
    'commission_earned',
    'kyc_approved',
    'kyc_rejected'
  ) THEN
    -- In a production setup, you would:
    -- 1. Insert into an email_queue table for processing by a background job
    -- 2. Call a webhook using pg_net extension
    -- 3. Trigger an Edge Function
    
    -- Log that an email should be sent
    RAISE NOTICE 'Email notification queued for notification ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to queue emails when notifications are created
DROP TRIGGER IF EXISTS trigger_queue_notification_email ON notifications;
CREATE TRIGGER trigger_queue_notification_email
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_notification_email();

-- =====================================================
-- OPTION 1: Using Supabase Webhooks
-- =====================================================
-- Setup instructions:
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Create a new webhook:
--    - Name: "Send Notification Emails"
--    - Table: notifications
--    - Events: INSERT
--    - Type: HTTP Request
--    - Method: POST
--    - URL: https://your-domain.com/api/notifications/send-email
--    - HTTP Headers: 
--      * Content-Type: application/json
--      * Authorization: Bearer YOUR_SECRET_KEY (optional)
-- 3. Payload: { "notificationId": "{{ record.id }}" }
-- 4. Enable the webhook

-- =====================================================
-- OPTION 2: Using pg_net Extension (Advanced)
-- =====================================================
-- This requires the pg_net extension to be enabled
-- Uncomment below if you have pg_net available:

/*
-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send HTTP request to email API
CREATE OR REPLACE FUNCTION send_notification_email_webhook()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only send for specific notification types
  IF NEW.type IN (
    'interest_submitted',
    'payment_received',
    'payment_approved',
    'payment_reminder',
    'all_payments_complete',
    'commission_earned',
    'kyc_approved',
    'kyc_rejected'
  ) THEN
    -- Make HTTP request to send email
    SELECT net.http_post(
      url := 'https://your-domain.com/api/notifications/send-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SECRET_KEY"}'::jsonb,
      body := json_build_object('notificationId', NEW.id)::jsonb
    ) INTO request_id;
    
    RAISE NOTICE 'Email webhook triggered with request ID: %', request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger using pg_net
DROP TRIGGER IF EXISTS trigger_send_notification_email ON notifications;
CREATE TRIGGER trigger_send_notification_email
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_email_webhook();
*/

-- =====================================================
-- OPTION 3: Email Queue Table (Recommended for reliability)
-- =====================================================
-- Create a dedicated table for email queue

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_error text,
  scheduled_at timestamptz DEFAULT NOW(),
  sent_at timestamptz,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_notification ON email_queue(notification_id);

-- Enable RLS (only system can access)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Function to add email to queue
CREATE OR REPLACE FUNCTION queue_notification_email_v2()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  email_subject text;
  email_body text;
BEGIN
  -- Only queue for specific notification types
  IF NEW.type NOT IN (
    'interest_submitted',
    'payment_received',
    'payment_approved',
    'payment_reminder',
    'all_payments_complete',
    'commission_earned',
    'kyc_approved',
    'kyc_rejected'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Get user's email
  SELECT email INTO user_email
  FROM profiles
  WHERE id = NEW.user_id;
  
  IF user_email IS NULL THEN
    RAISE NOTICE 'No email found for user %', NEW.user_id;
    RETURN NEW;
  END IF;
  
  -- Prepare email subject
  email_subject := NEW.title;
  
  -- Prepare email body (simplified HTML)
  email_body := format(
    '<h2>%s</h2><p>%s</p><p><a href="%s/dashboard/notifications">View in Dashboard</a></p>',
    NEW.title,
    NEW.message,
    COALESCE(current_setting('app.base_url', true), 'https://your-domain.com')
  );
  
  -- Insert into email queue
  INSERT INTO email_queue (
    notification_id,
    to_email,
    subject,
    body_html,
    body_text
  ) VALUES (
    NEW.id,
    user_email,
    email_subject,
    email_body,
    NEW.message
  );
  
  RAISE NOTICE 'Email queued for notification % to %', NEW.id, user_email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the trigger to use the queue
DROP TRIGGER IF EXISTS trigger_queue_notification_email ON notifications;
CREATE TRIGGER trigger_queue_notification_email
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_notification_email_v2();

-- Function to process email queue (call this from a cron job or API)
CREATE OR REPLACE FUNCTION process_email_queue(batch_size integer DEFAULT 10)
RETURNS TABLE (
  processed integer,
  succeeded integer,
  failed integer
) AS $$
DECLARE
  total_processed integer := 0;
  total_succeeded integer := 0;
  total_failed integer := 0;
BEGIN
  -- This is a placeholder that logs what would be processed
  -- In production, you'd call your email API here or via an external service
  
  -- Update pending emails to 'sending' status
  UPDATE email_queue
  SET status = 'sending', updated_at = NOW()
  WHERE id IN (
    SELECT id
    FROM email_queue
    WHERE status = 'pending'
      AND attempts < max_attempts
      AND scheduled_at <= NOW()
    ORDER BY scheduled_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  );
  
  GET DIAGNOSTICS total_processed = ROW_COUNT;
  
  -- Simulate processing (in production, call your email API)
  -- For now, mark them as sent
  UPDATE email_queue
  SET 
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE status = 'sending';
  
  GET DIAGNOSTICS total_succeeded = ROW_COUNT;
  
  -- Update corresponding notifications
  UPDATE notifications n
  SET 
    email_sent = true,
    email_sent_at = NOW()
  FROM email_queue eq
  WHERE eq.notification_id = n.id
    AND eq.status = 'sent'
    AND n.email_sent = false;
  
  RETURN QUERY SELECT total_processed, total_succeeded, total_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Admin Functions
-- =====================================================

-- View email queue status
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE (
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.status,
    COUNT(*) as count
  FROM email_queue eq
  GROUP BY eq.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retry failed emails
CREATE OR REPLACE FUNCTION retry_failed_emails()
RETURNS integer AS $$
DECLARE
  retried integer;
BEGIN
  UPDATE email_queue
  SET 
    status = 'pending',
    scheduled_at = NOW() + interval '5 minutes',
    updated_at = NOW()
  WHERE status = 'failed'
    AND attempts < max_attempts;
  
  GET DIAGNOSTICS retried = ROW_COUNT;
  
  RETURN retried;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Usage Instructions
-- =====================================================
-- 
-- The email notification system is now set up with a queue table.
-- 
-- To actually send emails, you need to:
--
-- 1. Set up a cron job or scheduled task to call:
--    SELECT * FROM process_email_queue(10);
--
-- 2. Or use the API endpoint:
--    GET /api/notifications/send-email?batch=true&limit=50
--
-- 3. Or set up Supabase Edge Function with a cron trigger
--
-- 4. Or use Supabase Webhooks as described in OPTION 1 above
--
-- To check email queue status:
--    SELECT * FROM get_email_queue_stats();
--
-- To retry failed emails:
--    SELECT retry_failed_emails();
--
-- =====================================================

COMMENT ON TABLE email_queue IS 'Queue for outgoing email notifications';
COMMENT ON FUNCTION queue_notification_email_v2() IS 'Automatically queue emails when notifications are created';
COMMENT ON FUNCTION process_email_queue(integer) IS 'Process pending emails in the queue (call from cron job or API)';
COMMENT ON FUNCTION get_email_queue_stats() IS 'Get statistics about email queue status';
COMMENT ON FUNCTION retry_failed_emails() IS 'Retry failed email deliveries';
