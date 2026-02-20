-- Fix payment notification trigger to only fire when payment proof is submitted, not when schedule is created
-- This prevents false notifications when installment schedules are first created

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_notify_payment_received ON public.installment_payments;
DROP FUNCTION IF EXISTS notify_payment_received();

-- Recreate the function with proper conditions
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_property_name TEXT;
  v_user_id UUID;
  v_admin_id UUID;
  v_referring_agent_id UUID;
BEGIN
  -- Only trigger when payment proof is submitted (UPDATE with proof URL added)
  -- OR when a payment is created with proof already (rare case)
  IF (TG_OP = 'UPDATE' AND NEW.payment_proof_url IS NOT NULL AND OLD.payment_proof_url IS NULL) OR
     (TG_OP = 'INSERT' AND NEW.payment_proof_url IS NOT NULL) THEN
    
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

-- Create trigger for both INSERT and UPDATE
CREATE TRIGGER trigger_notify_payment_received
  AFTER INSERT OR UPDATE OF payment_proof_url ON public.installment_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- Add comment
COMMENT ON FUNCTION notify_payment_received() IS 'Notify relevant parties when payment proof is submitted for an installment payment. Only triggers when payment_proof_url is added, not when payment schedule is initially created.';
