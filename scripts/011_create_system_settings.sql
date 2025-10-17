-- Create system_settings table for configurable platform parameters
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  setting_type text NOT NULL DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  description text,
  category text DEFAULT 'general',
  is_public boolean DEFAULT false, -- whether this setting can be accessed without admin permissions
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE row level security;

-- RLS Policies
CREATE POLICY "Anyone can view public system settings"
  ON public.system_settings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can view all system settings"
  ON public.system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
  ('application_fee_amount', '10000', 'number', 'Property interest application fee in Naira', 'payments', true),
  ('platform_name', 'Crossatlantic Properties', 'string', 'Platform display name', 'general', true),
  ('support_email', 'support@crossatlanticproperties.com', 'string', 'Support contact email', 'general', true),
  ('kyc_approval_required_for_payment', 'false', 'boolean', 'Whether KYC approval is required before payment', 'payments', true),
  ('max_file_upload_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', 'files', false),
  ('referral_commission_enabled', 'true', 'boolean', 'Whether referral commissions are enabled', 'commissions', true)
ON CONFLICT (setting_key) DO NOTHING;

