-- Repair plot permissions for real Supabase admin/staff accounts.
alter table public.plots enable row level security;

drop policy if exists "Staff can manage plots" on public.plots;
drop policy if exists "Only staff can manage plots" on public.plots;

create policy "Staff can manage plots"
  on public.plots
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );
