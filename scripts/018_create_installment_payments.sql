-- Create installment payments table
CREATE TABLE IF NOT EXISTS public.installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_interest_id UUID NOT NULL REFERENCES public.property_interests(id) ON DELETE CASCADE,
  
  -- Installment details
  installment_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  transaction_reference TEXT,
  payment_proof_url TEXT,
  
  -- Admin management
  admin_notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_installment_payments_property_interest ON public.installment_payments(property_interest_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_status ON public.installment_payments(status);
CREATE INDEX IF NOT EXISTS idx_installment_payments_due_date ON public.installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_installment_payments_installment_number ON public.installment_payments(installment_number);

-- RLS Policies
CREATE POLICY "Users can view their own installment payments"
  ON public.installment_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.property_interests pi
    WHERE pi.id = property_interest_id AND pi.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  ));

CREATE POLICY "Users can update their own installment payments with proof"
  ON public.installment_payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.property_interests pi
    WHERE pi.id = property_interest_id AND pi.user_id = auth.uid()
  ))
  WITH CHECK (payment_proof_url IS NOT NULL);

CREATE POLICY "Admins can manage all installment payments"
  ON public.installment_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role in ('super_admin', 'admin', 'manager')
  ));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_installment_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_installment_payments_updated_at
  BEFORE UPDATE ON public.installment_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_installment_payments_updated_at();

-- Function to automatically create installment schedule
CREATE OR REPLACE FUNCTION create_installment_schedule(
  p_property_interest_id UUID,
  p_total_amount DECIMAL,
  p_payment_plan TEXT,
  p_timeframe_months INTEGER
) RETURNS VOID AS $$
DECLARE
  v_amounts DECIMAL[];
  v_amount DECIMAL;
  v_due_date DATE;
  v_i INTEGER;
BEGIN
  -- Calculate installment amounts based on payment plan
  CASE p_payment_plan
    WHEN 'full' THEN
      v_amounts := ARRAY[p_total_amount];
    WHEN '30-30-40' THEN
      v_amounts := ARRAY[
        p_total_amount * 0.30,
        p_total_amount * 0.30,
        p_total_amount * 0.40
      ];
    WHEN '25x4' THEN
      v_amounts := ARRAY[
        p_total_amount * 0.25,
        p_total_amount * 0.25,
        p_total_amount * 0.25,
        p_total_amount * 0.25
      ];
  END CASE;

  -- Create installment records
  FOR v_i IN 1..array_length(v_amounts, 1) LOOP
    -- Calculate due date based on installment number and timeframe
    v_due_date := CURRENT_DATE + INTERVAL '1 month' * 
      CASE 
        WHEN p_payment_plan = 'full' THEN 0
        ELSE (v_i - 1) * (p_timeframe_months / array_length(v_amounts, 1))
      END;
    
    INSERT INTO public.installment_payments (
      property_interest_id,
      installment_number,
      amount,
      due_date
    ) VALUES (
      p_property_interest_id,
      v_i,
      v_amounts[v_i],
      v_due_date
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;