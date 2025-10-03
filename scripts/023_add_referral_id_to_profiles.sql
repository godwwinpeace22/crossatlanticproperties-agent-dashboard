-- Add referral_id column to profiles table
-- This creates a unique, user-friendly referral code for each user

-- Add the referral_id column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_id TEXT UNIQUE;

-- Create a function to generate a unique 8-character referral code
CREATE OR REPLACE FUNCTION generate_referral_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  done BOOLEAN := FALSE;
BEGIN
  WHILE NOT done LOOP
    -- Generate 8 character alphanumeric code (uppercase)
    new_id := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Check if it already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_id = new_id) THEN
      done := TRUE;
    END IF;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Update existing profiles without referral_id
UPDATE public.profiles
SET referral_id = generate_referral_id()
WHERE referral_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_id ON public.profiles(referral_id);

-- Update the handle_new_user function to generate referral_id on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, referral_id)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'agent'),
    generate_referral_id()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Add comment explaining the referral_id column
COMMENT ON COLUMN public.profiles.referral_id IS 'Unique 8-character referral code for sharing with potential buyers';

-- Create a function to look up agent by referral_id
CREATE OR REPLACE FUNCTION get_agent_by_referral_id(ref_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  agent_id UUID;
BEGIN
  SELECT id INTO agent_id
  FROM public.profiles
  WHERE referral_id = upper(ref_id)
  AND role = 'agent';
  
  RETURN agent_id;
END;
$$;

COMMENT ON FUNCTION get_agent_by_referral_id(TEXT) IS 'Look up agent user ID by referral code (case-insensitive)';
