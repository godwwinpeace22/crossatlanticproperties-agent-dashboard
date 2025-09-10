-- Create commissions table for tracking earnings
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  amount decimal(12,2) not null,
  percentage decimal(5,2) not null,
  level integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.commissions enable row level security;

-- Create indexes
create index if not exists idx_commissions_agent_id on public.commissions(agent_id);
create index if not exists idx_commissions_purchase_id on public.commissions(purchase_id);

-- RLS Policies for commissions
create policy "Agents can view their own commissions"
  on public.commissions for select
  using (
    agent_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Only admins can manage commissions"
  on public.commissions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
