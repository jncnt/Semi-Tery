create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  phone text not null,
  email text,
  message text,
  plot_number text not null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.inquiries enable row level security;

create policy "Customers can submit inquiries"
  on public.inquiries for insert
  to authenticated
  with check (customer_id = auth.uid());

create policy "Staff can read inquiries"
  on public.inquiries for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('staff', 'admin')
    )
  );

create policy "Staff can update inquiries"
  on public.inquiries for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('staff', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('staff', 'admin')
    )
  );

create policy "Staff can delete inquiries"
  on public.inquiries for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('staff', 'admin')
    )
  );
