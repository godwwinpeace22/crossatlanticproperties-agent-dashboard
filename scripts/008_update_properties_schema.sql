-- Update properties table schema
-- Change property_type to category and add estate field

-- Add new columns
alter table public.properties add column if not exists category text;
alter table public.properties add column if not exists estate text;
alter table public.properties add column if not exists purpose text check (purpose in ('sale', 'rent'));
alter table public.properties add column if not exists address text;
alter table public.properties add column if not exists city text;
alter table public.properties add column if not exists state text;
alter table public.properties add column if not exists zip_code text;
alter table public.properties add column if not exists bedrooms integer;
alter table public.properties add column if not exists bathrooms integer;
alter table public.properties add column if not exists square_feet integer;

-- Migrate data from property_type to category
update public.properties set category = property_type where category is null and property_type is not null;

-- Create property_categories table for admin management
create table if not exists public.property_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  type text not null default 'general' check (type in ('general', 'estate')),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default categories
insert into public.property_categories (name, description, type) values
  ('Residential', 'Single-family homes, condos, townhouses', 'general'),
  ('Commercial', 'Office buildings, retail spaces, warehouses', 'general'),
  ('Land', 'Vacant lots and development land', 'general'),
  ('Industrial', 'Manufacturing facilities and industrial complexes', 'general')
on conflict (name) do nothing;

-- Insert default estates
insert into public.property_categories (name, description, type) values
  ('Luxury Estates', 'Premium luxury residential developments', 'estate'),
  ('Waterfront Properties', 'Properties with water access or views', 'estate'),
  ('Golf Course Estates', 'Properties within golf course communities', 'estate'),
  ('Mountain View Estates', 'Properties with mountain views and elevated locations', 'estate'),
  ('Ocean View Residences', 'Coastal properties with ocean views', 'estate'),
  ('Heritage Park', 'Historic preservation community', 'estate'),
  ('Sunset Gardens', 'Family-oriented residential community', 'estate'),
  ('Royal Palm Estate', 'Tropical luxury estate community', 'estate'),
  ('Crystal Lake Community', 'Lakefront residential development', 'estate')
on conflict (name) do nothing;

-- Enable RLS for property_categories
alter table public.property_categories enable row level security;

-- RLS Policies for property_categories
create policy "Anyone can view active categories"
  on public.property_categories for select
  using (is_active = true or exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Only admins can manage categories"
  on public.property_categories for all
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

create trigger update_property_categories_updated_at
  before update on public.property_categories
  for each row execute function update_updated_at_column();