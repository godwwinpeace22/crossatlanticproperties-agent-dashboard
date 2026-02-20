-- Update profiles table to support additional user roles
-- This expands the role constraint to include buyer, staff, and manager roles

-- Drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new check constraint with expanded roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'manager', 'agent', 'buyer', 'staff'));

-- Update the default role comment
COMMENT ON COLUMN public.profiles.role IS 'User role: super_admin (full access), admin (admin), manager (operations), agent (sales), buyer (customer), staff (support)';