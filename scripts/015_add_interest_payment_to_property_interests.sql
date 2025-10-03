-- Add interest_payment_id column to property_interests table
ALTER TABLE property_interests
ADD COLUMN IF NOT EXISTS interest_payment_id UUID REFERENCES interest_payments(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_property_interests_interest_payment_id 
ON property_interests(interest_payment_id);

-- Add comment
COMMENT ON COLUMN property_interests.interest_payment_id IS 'Links to the application fee payment record';
