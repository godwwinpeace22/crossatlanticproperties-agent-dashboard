-- Create purchases table for approved sales
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount decimal(12,2) not null,
  submission_id uuid references public.payment_submissions(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.purchases enable row level security;

-- Create indexes
create index if not exists idx_purchases_buyer_id on public.purchases(buyer_id);
create index if not exists idx_purchases_seller_id on public.purchases(seller_id);
create index if not exists idx_purchases_property_id on public.purchases(property_id);

-- RLS Policies for purchases
create policy "Users can view their own purchases"
  on public.purchases for select
  using (
    buyer_id = auth.uid() or 
    seller_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );

create policy "Only admins can manage purchases"
  on public.purchases for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );
