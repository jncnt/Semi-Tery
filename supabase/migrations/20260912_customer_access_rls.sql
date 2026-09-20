-- Customer/admin access boundaries.
-- RESTRICTIVE policies combine with any existing permissive policies, so older
-- broad policies cannot grant customers access to administrative rows.

alter table public.profiles enable row level security;
alter table public.plots enable row level security;
alter table public.burial_records enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.inquiries enable row level security;

-- A profile contains account information and is only needed by its owner.
drop policy if exists "Customer profiles are private" on public.profiles;
create policy "Customer profiles are private"
  on public.profiles as restrictive for select
  to authenticated
  using (id = auth.uid());

-- Customers can browse only plots that can be shown publicly. Staff/admins
-- retain access to all plot rows for management and reservation decisions.
drop policy if exists "Customers can browse public plot availability" on public.plots;
create policy "Customers can browse public plot availability"
  on public.plots as restrictive for select
  to authenticated
  using (
    status in ('available', 'reserved')
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );

-- These permissive policies provide the grant side of the RLS decision; the
-- restrictive policy above remains the row-level ceiling.
drop policy if exists "Authenticated users can read plots" on public.plots;
create policy "Authenticated users can read plots"
  on public.plots for select to authenticated using (true);

drop policy if exists "Staff can manage plots" on public.plots;
create policy "Staff can manage plots"
  on public.plots for all to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'staff'))
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'staff'))
  );

drop policy if exists "Only staff can manage plots" on public.plots;
create policy "Only staff can manage plots"
  on public.plots as restrictive for all
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

-- Burial records are administrative records and never customer-readable.
drop policy if exists "Only staff can access burial records" on public.burial_records;
create policy "Only staff can access burial records"
  on public.burial_records as restrictive for all
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

drop policy if exists "Staff can access burial records" on public.burial_records;
create policy "Staff can access burial records"
  on public.burial_records for all to authenticated
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'staff'))
  )
  with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'staff'))
  );

-- Reservation rows remain private to the requester; staff/admins can manage
-- every request. New requests must target a currently available plot.
drop policy if exists "Reservation rows stay within account boundary" on public.reservation_requests;
create policy "Reservation rows stay within account boundary"
  on public.reservation_requests as restrictive for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );

drop policy if exists "Customers can request available plots only" on public.reservation_requests;
create policy "Customers can request available plots only"
  on public.reservation_requests as restrictive for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.plots
      where plots.id = plot_id
        and plots.status = 'available'
    )
  );

create unique index if not exists reservation_requests_pending_plot_user_idx
  on public.reservation_requests (plot_id, user_id)
  where status = 'pending';

drop policy if exists "Only staff can change reservations" on public.reservation_requests;
create policy "Only staff can change reservations"
  on public.reservation_requests as restrictive for update
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

-- Inquiry content is administrative; customers may submit only their own.
drop policy if exists "Inquiry rows stay within account boundary" on public.inquiries;
create policy "Inquiry rows stay within account boundary"
  on public.inquiries as restrictive for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
  );

drop policy if exists "Customers can submit own inquiries" on public.inquiries;
create policy "Customers can submit own inquiries"
  on public.inquiries as restrictive for insert
  to authenticated
  with check (customer_id = auth.uid());

-- Payment receipts are private objects. Existing public-bucket behavior would
-- otherwise allow anyone with a receipt URL to read customer documents.
update storage.buckets
set public = false
where id = 'payment-receipts';

drop policy if exists "Payment receipts stay within account boundary" on storage.objects;
create policy "Payment receipts stay within account boundary"
  on storage.objects as restrictive for select
  to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role in ('admin', 'staff')
      )
    )
  );
