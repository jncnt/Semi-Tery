alter table public.reservation_requests
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed'));
