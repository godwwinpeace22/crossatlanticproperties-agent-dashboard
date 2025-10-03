-- Add payment_pending and payment_failed statuses to property_interests
ALTER TABLE public.property_interests 
DROP CONSTRAINT IF EXISTS property_interests_status_check;

ALTER TABLE public.property_interests
ADD CONSTRAINT property_interests_status_check 
CHECK (status IN ('payment_pending', 'payment_failed', 'pending', 'approved', 'rejected', 'withdrawn', 'completed'));

-- Add comment
COMMENT ON COLUMN public.property_interests.status IS 'Interest status: payment_pending (awaiting payment), payment_failed (payment failed), pending (awaiting review), approved, rejected, withdrawn, completed';
