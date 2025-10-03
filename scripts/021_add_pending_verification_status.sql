-- Add 'pending_verification' status to installment_payments
-- This status indicates that the user has uploaded payment proof and it's awaiting admin verification

ALTER TABLE public.installment_payments
DROP CONSTRAINT IF EXISTS installment_payments_status_check;

ALTER TABLE public.installment_payments
ADD CONSTRAINT installment_payments_status_check 
CHECK (status IN ('pending', 'pending_verification', 'paid', 'overdue', 'waived'));

COMMENT ON COLUMN public.installment_payments.status IS 'Payment status: pending (awaiting payment), pending_verification (proof uploaded, awaiting admin verification), paid (verified and approved), overdue (past due date), waived (payment waived)';
