-- Property Types Management Schema
-- Current structure:
-- - property_type (existing field): Property categories like "Land", "Commercial Property", "House", etc.
-- - property_types (new table): Admin-managed estate names like "Clearview Estate", "Rivervalley Estate", etc.

-- Add new fields for estate/development tracking
alter table public.properties add column if not exists estate text;
alter table public.properties add column if not exists property_type_id uuid references public.property_types(id);
alter table public.properties add column if not exists purpose text check (purpose in ('sale', 'rent'));
alter table public.properties add column if not exists address text;
alter table public.properties add column if not exists city text;
alter table public.properties add column if not exists state text;
alter table public.properties add column if not exists zip_code text;
alter table public.properties add column if not exists bedrooms integer;
alter table public.properties add column if not exists bathrooms integer;
alter table public.properties add column if not exists square_feet integer;

-- Create property_types table for admin-managed estate names
create table if not exists public.property_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default property types (estate names)
insert into public.property_types (name, description) values
  ('Clearview Estate', 'Premium residential estate with panoramic city views'),
  ('Rivervalley Estate', 'Luxury waterfront estate development'),
  ('Suncity Estate Qwarimpa', 'Modern family-oriented estate community'),
  ('Heritage Park Estate', 'Historic preservation community with modern amenities'),
  ('Golden Gate Gardens', 'Gated community with extensive landscaping'),
  ('Ocean View Residences', 'Coastal development with direct ocean access'),
  ('Mountain Ridge Estate', 'Elevated estate with mountain and valley views'),
  ('Palm Grove Estate', 'Tropical estate with mature palm landscaping'),
  ('Crystal Lake Community', 'Lakefront estate with recreational facilities'),
  ('Royal Gardens Estate', 'Luxury estate with botanical gardens')
on conflict (name) do nothing;

-- Enable RLS for property_types
alter table public.property_types enable row level security;

-- RLS Policies for property_types
create policy "Anyone can view active property types"
  on public.property_types for select
  using (is_active = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Only admins can manage property types"
  on public.property_types for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_properties_updated_at
  before update on public.properties
  for each row execute function update_updated_at_column();

create trigger update_property_types_updated_at
  before update on public.property_types
  for each row execute function update_updated_at_column();

-- Comment explaining the structure:
-- property_type (existing field): Fixed categories like "Land", "Commercial Property", "House", "Apartment", etc.
-- property_types (new table): Admin-managed estate names like "Clearview Estate", "Rivervalley Estate", etc.
-- estate (new field): Will store the selected estate name from property_types table
-- property_type_id (new field): Foreign key reference to property_types table