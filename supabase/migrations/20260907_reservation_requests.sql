create table if not exists public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null,
  requester_phone text not null,
  requester_email text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_requests_user_id_idx
  on public.reservation_requests (user_id, created_at desc);

create index if not exists reservation_requests_status_idx
  on public.reservation_requests (status, created_at desc);

alter table public.reservation_requests enable row level security;

create policy "Users can submit reservation requests"
  on public.reservation_requests for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users and staff can view reservation requests"
  on public.reservation_requests for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );

create policy "Staff can decide reservation requests"
  on public.reservation_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );
