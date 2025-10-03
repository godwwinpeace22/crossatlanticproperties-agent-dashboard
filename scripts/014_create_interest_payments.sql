-- Create interest_payments table to track application fee payments
CREATE TABLE IF NOT EXISTS interest_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_interest_id UUID REFERENCES property_interests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL DEFAULT 10000.00, -- 10k Naira application fee
  currency VARCHAR(3) DEFAULT 'NGN',
  payment_reference VARCHAR(255) UNIQUE NOT NULL, -- Paystack reference
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, abandoned
  paystack_response JSONB, -- Store full Paystack response
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interest_payments_user_id ON interest_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_interest_payments_property_id ON interest_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_interest_payments_property_interest_id ON interest_payments(property_interest_id);
CREATE INDEX IF NOT EXISTS idx_interest_payments_reference ON interest_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_interest_payments_status ON interest_payments(payment_status);

-- Add RLS policies
ALTER TABLE interest_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own interest payments"
  ON interest_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can insert own interest payments"
  ON interest_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all interest payments"
  ON interest_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update all payments
CREATE POLICY "Admins can update all interest payments"
  ON interest_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_interest_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interest_payments_updated_at
  BEFORE UPDATE ON interest_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_interest_payments_updated_at();

-- Add comment
COMMENT ON TABLE interest_payments IS 'Tracks application fee payments for property interests';
