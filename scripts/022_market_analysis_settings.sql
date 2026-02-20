-- Create market_analysis_settings table for admin to configure city data
CREATE TABLE IF NOT EXISTS public.market_analysis_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  city_name text NOT NULL,
  base_price decimal(12,2) NOT NULL DEFAULT 35000000,
  growth_rate decimal(5,4) NOT NULL DEFAULT 0.025,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(location_id)
);

-- Insert default settings for existing cities
INSERT INTO public.market_analysis_settings (location_id, city_name, base_price, growth_rate, is_active)
SELECT 
  l.id,
  l.name,
  CASE 
    WHEN l.name = 'Lagos' THEN 55000000
    WHEN l.name = 'Abuja' THEN 48000000
    WHEN l.name = 'Enugu' THEN 32000000
    WHEN l.name = 'Abakaliki' THEN 18000000
    WHEN l.name = 'Dubai' THEN 95000000
    ELSE 35000000
  END as base_price,
  CASE 
    WHEN l.name = 'Lagos' THEN 0.045
    WHEN l.name = 'Abuja' THEN 0.042
    WHEN l.name = 'Enugu' THEN 0.018
    WHEN l.name = 'Abakaliki' THEN 0.015
    WHEN l.name = 'Dubai' THEN 0.038
    ELSE 0.025
  END as growth_rate,
  true
FROM public.locations l
WHERE l.is_active = true
ON CONFLICT (location_id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.market_analysis_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active market analysis settings"
  ON public.market_analysis_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage market analysis settings"
  ON public.market_analysis_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role in ('super_admin', 'admin', 'manager')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_analysis_settings_location ON public.market_analysis_settings(location_id);
CREATE INDEX IF NOT EXISTS idx_market_analysis_settings_active ON public.market_analysis_settings(is_active);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_market_analysis_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_market_analysis_settings_updated_at
  BEFORE UPDATE ON public.market_analysis_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_market_analysis_settings_updated_at();
