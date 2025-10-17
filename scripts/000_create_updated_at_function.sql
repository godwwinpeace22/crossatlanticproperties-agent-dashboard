-- Create the handle_updated_at function for automatic timestamp updates
-- This function is used by triggers to update the updated_at column when rows are modified

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';