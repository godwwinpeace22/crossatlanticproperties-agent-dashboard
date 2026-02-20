-- Create payment submissions table for pending approvals
create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_email text not null,
  buyer_name text,
  amount decimal(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payment_submissions enable row level security;

-- Create indexes
create index if not exists idx_payment_submissions_submitter_id on public.payment_submissions(submitter_id);
create index if not exists idx_payment_submissions_status on public.payment_submissions(status);

-- RLS Policies for payment submissions
create policy "Agents can view their own submissions"
  on public.payment_submissions for select
  using (
    submitter_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );

create policy "Agents can create submissions"
  on public.payment_submissions for insert
  with check (submitter_id = auth.uid());

create policy "Only admins can update submissions"
  on public.payment_submissions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'admin', 'manager')
    )
  );
