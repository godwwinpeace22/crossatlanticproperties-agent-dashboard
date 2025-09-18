-- Add image support to property types table

-- Add image_url column to property_types table
alter table public.property_types add column if not exists image_url text;

-- Add comment for documentation
comment on column public.property_types.image_url is 'URL to the property type image stored in Supabase storage';

-- Update existing property types with placeholder image URLs (optional)
-- These can be updated later through the admin interface
update public.property_types set image_url = '/placeholder.svg' where image_url is null;