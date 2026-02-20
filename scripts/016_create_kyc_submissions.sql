-- Create KYC submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_type TEXT NOT NULL CHECK (buyer_type IN ('individual', 'company')),
  
  -- Personal/Company Information
  full_name TEXT,
  company_name TEXT,
  date_of_birth DATE,
  incorporation_date DATE,
  nationality TEXT,
  country_of_incorporation TEXT,
  address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  occupation TEXT,
  nature_of_business TEXT,
  annual_income DECIMAL(15,2),
  investment_source TEXT,
  
  -- Document URLs (stored in Supabase storage)
  government_id_url TEXT,
  proof_of_address_url TEXT,
  business_documents_urls TEXT[], -- Array of URLs for multiple documents
  
  -- KYC Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Application Fee
  application_fee_paid BOOLEAN DEFAULT FALSE,
  application_fee_amount DECIMAL(10,2) DEFAULT 10000.00, -- ₦10,000
  application_fee_payment_proof TEXT, -- URL to payment proof
  application_fee_approved BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON public.kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_email ON public.kyc_submissions(email_address);

-- RLS Policies
CREATE POLICY "Users can view their own KYC submissions"
  ON public.kyc_submissions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agent')
  ));

CREATE POLICY "Users can create their own KYC submissions"
  ON public.kyc_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending KYC submissions"
  ON public.kyc_submissions FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all KYC submissions"
  ON public.kyc_submissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role in ('super_admin', 'admin', 'manager')
  ));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kyc_updated_at
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_updated_at();