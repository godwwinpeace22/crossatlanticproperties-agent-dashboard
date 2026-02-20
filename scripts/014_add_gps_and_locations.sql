-- Add GPS coordinates to properties table
alter table public.properties add column if not exists latitude decimal(10, 8);
alter table public.properties add column if not exists longitude decimal(11, 8);

-- Create locations table for dynamic location management
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert the 4 initial locations
insert into public.locations (name, country) values
  ('Abuja', 'Nigeria'),
  ('Lagos', 'Nigeria'),
  ('Enugu', 'Nigeria'),
  ('Dubai', 'UAE')
on conflict (name) do nothing;

-- Add foreign key relationship between properties and locations
alter table public.properties add column if not exists location_id uuid references public.locations(id);

-- Update existing properties to link with locations (best effort match)
update public.properties 
set location_id = l.id 
from public.locations l 
where public.properties.city ilike '%' || l.name || '%' 
  and public.properties.location_id is null;

-- Enable RLS for locations
alter table public.locations enable row level security;

-- RLS Policies for locations
create policy "Anyone can view active locations"
  on public.locations for select
  using (is_active = true);

create policy "Only admins can manage locations"
  on public.locations for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );

-- Create indexes for better performance
create index if not exists idx_properties_latitude_longitude on public.properties(latitude, longitude);
create index if not exists idx_properties_location_id on public.properties(location_id);
create index if not exists idx_locations_name on public.locations(name);