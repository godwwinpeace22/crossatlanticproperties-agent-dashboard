-- Expand notification types to include all required events
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'kyc_status', 
  'kyc_approved', 
  'kyc_rejected',
  'interest_submitted', 
  'interest_approved', 
  'interest_rejected',
  'payment_reminder', 
  'payment_received',
  'payment_approved', 
  'payment_confirmed',
  'commission_earned',
  'all_payments_complete',
  'general'
));

-- Add commission_id reference
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS commission_id UUID REFERENCES public.commissions(id);

CREATE INDEX IF NOT EXISTS idx_notifications_commission ON public.notifications(commission_id);

-- ============================================
-- TRIGGER: Property Interest Submitted
-- ============================================
CREATE OR REPLACE FUNCTION notify_interest_submitted()
RETURNS TRIGGER AS $$
DECLARE
  v_property_name TEXT;
  v_user_name TEXT;
  v_admin_id UUID;
BEGIN
  -- Get property and user details
  SELECT p.name INTO v_property_name
  FROM public.properties p
  WHERE p.id = NEW.property_id;

  SELECT pr.full_name INTO v_user_name
  FROM public.profiles pr
  WHERE pr.id = NEW.user_id;

  -- Notify user
  PERFORM create_notification(
    NEW.user_id,
    'interest_submitted',
    'Interest Submitted Successfully',
    format('Your interest in %s has been submitted and is pending review.', v_property_name),
    NEW.id,
    NULL,
    NULL
  );

  -- Notify all admins
  FOR v_admin_id IN 
    SELECT id FROM public.profiles WHERE role in ('super_admin', 'admin', 'manager')
  LOOP
    PERFORM create_notification(
      v_admin_id,
      'interest_submitted',
      'New Property Interest',
      format('%s has expressed interest in %s. Review required.', v_user_name, v_property_name),
      NEW.id,
      NULL,
      NULL
    );
  END LOOP;

  -- If there's a referring agent, notify them too
  IF NEW.referring_agent_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.referring_agent_id,
      'interest_submitted',
      'Your Referral Submitted Interest',
      format('%s used your referral code for %s. Great work!', v_user_name, v_property_name),
      NEW.id,
      NULL,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_interest_submitted
  AFTER INSERT ON public.property_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_interest_submitted();

-- ============================================
-- TRIGGER: Payment Received (Installment)
-- ============================================
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_property_name TEXT;
  v_user_id UUID;
  v_admin_id UUID;
  v_referring_agent_id UUID;
BEGIN
  -- Only trigger on new payments
  IF TG_OP = 'INSERT' THEN
    -- Get property interest details
    SELECT 
      pi.user_id, 
      pi.referring_agent_id,
      p.name
    INTO v_user_id, v_referring_agent_id, v_property_name
    FROM public.property_interests pi
    JOIN public.properties p ON p.id = pi.property_id
    WHERE pi.id = NEW.property_interest_id;

    -- Notify user
    PERFORM create_notification(
      v_user_id,
      'payment_received',
      'Payment Received',
      format('We have received your payment of ₦%s for %s. It is pending approval.', 
        NEW.amount::TEXT, v_property_name),
      NEW.property_interest_id,
      NULL,
      NEW.id
    );

    -- Notify all admins
    FOR v_admin_id IN 
      SELECT id FROM public.profiles WHERE role in ('super_admin', 'admin', 'manager')
    LOOP
      PERFORM create_notification(
        v_admin_id,
        'payment_received',
        'New Payment Received',
        format('Payment of ₦%s received for %s. Approval required.', 
          NEW.amount::TEXT, v_property_name),
        NEW.property_interest_id,
        NULL,
        NEW.id
      );
    END LOOP;

    -- Notify referring agent if exists
    IF v_referring_agent_id IS NOT NULL THEN
      PERFORM create_notification(
        v_referring_agent_id,
        'payment_received',
        'Referral Payment Progress',
        format('Your referral made a payment of ₦%s for %s.', 
          NEW.amount::TEXT, v_property_name),
        NEW.property_interest_id,
        NULL,
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_payment_received
  AFTER INSERT ON public.installment_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- ============================================
-- TRIGGER: Payment Approved
-- ============================================
CREATE OR REPLACE FUNCTION notify_payment_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_property_name TEXT;
  v_user_id UUID;
  v_referring_agent_id UUID;
  v_all_paid BOOLEAN;
  v_total_installments INT;
  v_paid_installments INT;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get property interest details
    SELECT 
      pi.user_id, 
      pi.referring_agent_id,
      p.name
    INTO v_user_id, v_referring_agent_id, v_property_name
    FROM public.property_interests pi
    JOIN public.properties p ON p.id = pi.property_id
    WHERE pi.id = NEW.property_interest_id;

    -- Check if all payments are complete
    SELECT 
      COUNT(*) = SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END),
      COUNT(*),
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)
    INTO v_all_paid, v_total_installments, v_paid_installments
    FROM public.installment_payments
    WHERE property_interest_id = NEW.property_interest_id;

    IF v_all_paid THEN
      -- All payments complete - notify buyer
      PERFORM create_notification(
        v_user_id,
        'all_payments_complete',
        '🎉 Congratulations! Payment Complete',
        format('You have completed all payments for %s. Our team will contact you for the next steps.', 
          v_property_name),
        NEW.property_interest_id,
        NULL,
        NEW.id
      );

      -- Notify referring agent of completion
      IF v_referring_agent_id IS NOT NULL THEN
        PERFORM create_notification(
          v_referring_agent_id,
          'all_payments_complete',
          'Referral Payment Complete',
          format('Your referral has completed all payments for %s. Commission processing initiated.', 
            v_property_name),
          NEW.property_interest_id,
          NULL,
          NEW.id
        );
      END IF;
    ELSE
      -- Individual payment approved - notify buyer
      PERFORM create_notification(
        v_user_id,
        'payment_approved',
        'Payment Approved',
        format('Your payment of ₦%s for %s has been approved. (%s/%s payments complete)', 
          NEW.amount::TEXT, v_property_name, v_paid_installments::TEXT, v_total_installments::TEXT),
        NEW.property_interest_id,
        NULL,
        NEW.id
      );

      -- Notify referring agent of payment approval
      IF v_referring_agent_id IS NOT NULL THEN
        PERFORM create_notification(
          v_referring_agent_id,
          'payment_approved',
          'Referral Payment Approved',
          format('Payment of ₦%s for your referral has been approved (%s/%s complete).', 
            NEW.amount::TEXT, v_paid_installments::TEXT, v_total_installments::TEXT),
          NEW.property_interest_id,
          NULL,
          NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_payment_approved
  AFTER UPDATE ON public.installment_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_approved();

-- ============================================
-- TRIGGER: Commission Earned
-- ============================================
CREATE OR REPLACE FUNCTION notify_commission_earned()
RETURNS TRIGGER AS $$
DECLARE
  v_property_name TEXT;
BEGIN
  -- Get property name
  SELECT p.name INTO v_property_name
  FROM public.properties p
  JOIN public.property_interests pi ON pi.property_id = p.id
  WHERE pi.id = NEW.property_interest_id;

  -- Notify agent of commission
  PERFORM create_notification(
    NEW.agent_id,
    'commission_earned',
    '💰 Commission Earned!',
    format('Congratulations! You earned ₦%s commission from %s.', 
      NEW.amount::TEXT, COALESCE(v_property_name, 'a property')),
    NEW.property_interest_id,
    NULL,
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_commission_earned
  AFTER INSERT ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_commission_earned();

-- ============================================
-- TRIGGER: KYC Status Changes
-- ============================================
CREATE OR REPLACE FUNCTION notify_kyc_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes
  IF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM create_notification(
        NEW.user_id,
        'kyc_approved',
        '✅ KYC Approved',
        'Your KYC verification has been approved. You can now proceed with property investments.',
        NULL,
        NEW.id,
        NULL
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM create_notification(
        NEW.user_id,
        'kyc_rejected',
        '❌ KYC Rejected',
        format('Your KYC verification was rejected. Reason: %s. Please resubmit with correct information.', 
          COALESCE(NEW.rejection_reason, 'Please check your documents')),
        NULL,
        NEW.id,
        NULL
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_kyc_status
  AFTER UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_kyc_status();

-- Update the create_notification function to handle commission_id
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_property_interest_id UUID DEFAULT NULL,
  p_kyc_submission_id UUID DEFAULT NULL,
  p_installment_payment_id UUID DEFAULT NULL,
  p_commission_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    property_interest_id,
    kyc_submission_id,
    installment_payment_id,
    commission_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_property_interest_id,
    p_kyc_submission_id,
    p_installment_payment_id,
    p_commission_id
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;
