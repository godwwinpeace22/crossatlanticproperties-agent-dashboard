-- Create property interests table
CREATE TABLE IF NOT EXISTS public.property_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  kyc_submission_id UUID REFERENCES public.kyc_submissions(id),
  
  -- Interest details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn', 'completed')),
  selected_payment_plan TEXT NOT NULL DEFAULT 'full' CHECK (selected_payment_plan IN ('full', '30-30-40', '25x4')),
  payment_timeframe INTEGER, -- in months
  
  -- Referral information
  referral_code TEXT,
  referring_agent_id UUID REFERENCES public.profiles(id),
  
  -- Admin management
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure user can only express interest once per property
  UNIQUE(user_id, property_id)
);

-- Enable RLS
ALTER TABLE public.property_interests ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_interests_user_id ON public.property_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_property_id ON public.property_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_status ON public.property_interests(status);
CREATE INDEX IF NOT EXISTS idx_property_interests_referral_code ON public.property_interests(referral_code);
CREATE INDEX IF NOT EXISTS idx_property_interests_referring_agent ON public.property_interests(referring_agent_id);

-- RLS Policies
CREATE POLICY "Users can view their own property interests"
  ON public.property_interests FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  ));

CREATE POLICY "Users can create their own property interests"
  ON public.property_interests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending property interests"
  ON public.property_interests FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all property interests"
  ON public.property_interests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role in ('super_admin', 'admin', 'manager')
  ));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_property_interests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_interests_updated_at
  BEFORE UPDATE ON public.property_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_property_interests_updated_at();