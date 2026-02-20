-- Create agent hierarchy table for upline/downline relationships
create table if not exists public.agent_hierarchy (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  upline_id uuid references public.profiles(id) on delete cascade,
  level integer not null default 1,
  approved boolean not null default false,
  approved_by uuid references public.profiles(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.agent_hierarchy enable row level security;

-- Create indexes for performance
create index if not exists idx_agent_hierarchy_agent_id on public.agent_hierarchy(agent_id);
create index if not exists idx_agent_hierarchy_upline_id on public.agent_hierarchy(upline_id);

-- RLS Policies for agent hierarchy
create policy "Agents can view their own hierarchy"
  on public.agent_hierarchy for select
  using (
    agent_id = auth.uid() or 
    upline_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );

create policy "Only admins can manage hierarchy"
  on public.agent_hierarchy for insert
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );

create policy "Only admins can update hierarchy"
  on public.agent_hierarchy for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );
