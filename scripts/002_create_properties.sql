-- Create properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(12,2) not null,
  location text,
  property_type text,
  status text not null default 'available' check (status in ('available', 'sold', 'reserved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.properties enable row level security;

-- RLS Policies for properties
create policy "Anyone can view available properties"
  on public.properties for select
  using (status = 'available' or exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
  ));

create policy "Only admins can manage properties"
  on public.properties for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );
