-- Add floor plan support to properties table

-- Add floor_plan_url column to properties table
alter table public.properties add column if not exists floor_plan_url text;

-- Add comment for documentation
comment on column public.properties.floor_plan_url is 'URL to the floor plan image stored in Supabase storage';