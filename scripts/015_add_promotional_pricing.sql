-- Add promotional pricing fields to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS promotion_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS promotion_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS allowed_payment_plans TEXT[] DEFAULT ARRAY['full'];

-- Update existing properties to use original_price as price if promotional pricing is not set
UPDATE public.properties 
SET original_price = price 
WHERE original_price IS NULL;

-- Create index for promotional properties
CREATE INDEX IF NOT EXISTS idx_properties_promotional ON public.properties(is_promotional, promotion_start_date, promotion_end_date);
CREATE INDEX IF NOT EXISTS idx_properties_payment_plans ON public.properties USING GIN(allowed_payment_plans);