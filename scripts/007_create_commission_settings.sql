-- Create commission settings table for configurable commission rates
create table if not exists public.commission_settings (
  id uuid primary key default gen_random_uuid(),
  level integer not null unique,
  percentage decimal(5,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.commission_settings enable row level security;

-- RLS Policies for commission settings
create policy "Anyone can view commission settings"
  on public.commission_settings for select
  using (true);

create policy "Only admins can manage commission settings"
  on public.commission_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Insert default commission rates
insert into public.commission_settings (level, percentage) values
  (1, 10.00),  -- 10% for direct downline
  (2, 5.00),   -- 5% for second level
  (3, 2.50),   -- 2.5% for third level
  (4, 1.00),   -- 1% for fourth level
  (5, 0.50)    -- 0.5% for fifth level
on conflict (level) do nothing;
