alter table public.reservation_requests
  add column if not exists reservation_date timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists submitted_notification_sent_at timestamptz,
  add column if not exists approval_notification_sent_at timestamptz,
  add column if not exists reminder_notification_sent_at timestamptz,
  add column if not exists expiration_notification_sent_at timestamptz;

alter table public.reservation_requests
  drop constraint if exists reservation_requests_status_check;

update public.reservation_requests
set reservation_date = coalesce(reservation_date, created_at),
    expires_at = coalesce(expires_at, created_at + interval '7 days'),
    status = case when status = 'rejected' then 'cancelled' else status end
where reservation_date is null
   or expires_at is null
   or status = 'rejected';

alter table public.reservation_requests
  alter column reservation_date set default now(),
  alter column reservation_date set not null,
  alter column expires_at set default (now() + interval '7 days'),
  alter column expires_at set not null;

alter table public.reservation_requests
  add constraint reservation_requests_status_check
  check (status in ('pending', 'approved', 'expired', 'cancelled'));

create index if not exists reservation_requests_expires_at_idx
  on public.reservation_requests (expires_at)
  where status in ('pending', 'approved');

create or replace function public.set_reservation_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.reservation_date := now();
    new.expires_at := now() + interval '7 days';
    new.status := 'pending';
    new.requester_email := coalesce(
      (select email from auth.users where id = new.user_id),
      new.requester_email
    );
  end if;
  return new;
end;
$$;

drop trigger if exists set_reservation_defaults on public.reservation_requests;
create trigger set_reservation_defaults
  before insert on public.reservation_requests
  for each row execute function public.set_reservation_defaults();

create or replace function public.protect_customer_reservation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.user_id
     and not exists (
       select 1 from public.profiles
       where profiles.id = auth.uid()
         and profiles.role in ('admin', 'staff')
     ) then
    if new.status <> 'cancelled'
       or old.status not in ('pending', 'approved') then
      raise exception 'Customers may only cancel an active reservation';
    end if;

    new.user_id := old.user_id;
    new.plot_id := old.plot_id;
    new.requester_name := old.requester_name;
    new.requester_phone := old.requester_phone;
    new.requester_email := old.requester_email;
    new.notes := old.notes;
    new.reservation_date := old.reservation_date;
    new.expires_at := old.expires_at;
    new.payment_method := old.payment_method;
    new.payment_status := old.payment_status;
    new.plot_price := old.plot_price;
    new.reservation_fee := old.reservation_fee;
    new.total_amount := old.total_amount;
    new.decision_note := coalesce(new.decision_note, old.decision_note);
  end if;
  return new;
end;
$$;

drop trigger if exists protect_customer_reservation_fields on public.reservation_requests;
create trigger protect_customer_reservation_fields
  before update on public.reservation_requests
  for each row execute function public.protect_customer_reservation_fields();

create or replace function public.expire_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer;
begin
  with expired as (
    update public.reservation_requests
    set status = 'expired', updated_at = now()
    where status in ('pending', 'approved')
      and expires_at <= now()
    returning plot_id
  )
  update public.plots
  set status = 'available'
  where id in (select plot_id from expired)
    and not exists (
      select 1
      from public.burial_records
      where burial_records.plot_id = plots.id
    );

  get diagnostics expired_count = row_count;
  return coalesce(expired_count, 0);
end;
$$;

revoke all on function public.expire_reservations() from public, anon, authenticated;
grant execute on function public.expire_reservations() to service_role;

-- Supabase projects provide pg_cron. Running this function in the database means
-- expiration does not depend on a customer's browser being open.
create extension if not exists pg_cron with schema extensions;

do $$
begin
  perform cron.unschedule('expire-reservations-every-15-minutes')
  where exists (
    select 1 from cron.job where jobname = 'expire-reservations-every-15-minutes'
  );
  perform cron.schedule(
    'expire-reservations-every-15-minutes',
    '*/15 * * * *',
    $job$select public.expire_reservations();$job$
  );
exception when undefined_table or undefined_function then
  raise notice 'pg_cron is unavailable; schedule public.expire_reservations() from a trusted server job.';
end;
$$;

-- Keep the existing customer/admin RLS model while allowing customers to cancel
-- only their own active reservation. Status and dates remain server-controlled.
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
    or (user_id = auth.uid() and status in ('pending', 'approved'))
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'staff')
    )
    or (user_id = auth.uid() and status = 'cancelled')
  );

drop policy if exists "Customers can cancel own reservations" on public.reservation_requests;
create policy "Customers can cancel own reservations"
  on public.reservation_requests for update
  to authenticated
  using (user_id = auth.uid() and status in ('pending', 'approved'))
  with check (user_id = auth.uid() and status = 'cancelled');

-- Existing restrictive policies must allow this narrow customer cancellation.
drop policy if exists "Customers can cancel own reservations boundary" on public.reservation_requests;
create policy "Customers can cancel own reservations boundary"
  on public.reservation_requests as restrictive for update
  to authenticated
  using (user_id = auth.uid() and status in ('pending', 'approved'))
  with check (user_id = auth.uid() and status = 'cancelled');
