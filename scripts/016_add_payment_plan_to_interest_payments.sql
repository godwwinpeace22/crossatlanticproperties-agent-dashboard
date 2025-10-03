-- Add payment_plan column to interest_payments table
ALTER TABLE interest_payments
ADD COLUMN IF NOT EXISTS payment_plan JSONB;

-- Add comment
COMMENT ON COLUMN interest_payments.payment_plan IS 'Stores the selected payment plan details';
