alter table public.plots
  add column if not exists reservation_fee numeric(12, 2) not null default 100;

alter table public.plots
  alter column reservation_fee set default 100;

update public.plots
set reservation_fee = 100
where reservation_fee = 0;

alter table public.reservation_requests
  add column if not exists plot_price numeric(12, 2) not null default 0,
  add column if not exists reservation_fee numeric(12, 2) not null default 0,
  add column if not exists total_amount numeric(12, 2) not null default 0;
