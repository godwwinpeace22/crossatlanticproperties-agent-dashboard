-- Fix foreign key relationships in user_documents table
-- The uploaded_by column should reference profiles table, not auth.users

-- Drop existing foreign key constraint on uploaded_by column
ALTER TABLE public.user_documents 
DROP CONSTRAINT IF EXISTS user_documents_uploaded_by_fkey;

-- Add the correct foreign key constraint to reference profiles table
ALTER TABLE public.user_documents 
ADD CONSTRAINT user_documents_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Also fix the user_id foreign key if needed to reference profiles
-- First drop the existing constraint
ALTER TABLE public.user_documents 
DROP CONSTRAINT IF EXISTS user_documents_user_id_fkey;

-- Add the correct foreign key constraint for user_id to reference profiles table
ALTER TABLE public.user_documents 
ADD CONSTRAINT user_documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;