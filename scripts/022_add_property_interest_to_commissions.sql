-- Add property_interest_id to commissions table
-- This allows commissions to be tracked by property interest instead of requiring a purchase record

-- Add the column (nullable initially for existing records)
alter table public.commissions
  add column if not exists property_interest_id uuid references public.property_interests(id) on delete cascade;

-- Create index for better query performance
create index if not exists idx_commissions_property_interest_id 
  on public.commissions(property_interest_id);

-- Make purchase_id nullable since we can now have commissions based on property_interest_id
alter table public.commissions
  alter column purchase_id drop not null;

-- Add a check constraint to ensure either purchase_id or property_interest_id is set
alter table public.commissions
  add constraint commissions_reference_check
  check (
    (purchase_id is not null and property_interest_id is null) or
    (purchase_id is null and property_interest_id is not null)
  );

-- Update RLS policy to allow viewing commissions by property interest
drop policy if exists "Agents can view their own commissions" on public.commissions;

create policy "Agents can view their own commissions"
  on public.commissions for select
  using (
    agent_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
