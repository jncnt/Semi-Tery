create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  plot_number text not null unique,
  section text,
  status text not null default 'available' check (status in ('available', 'reserved', 'occupied')),
  type text not null default 'Bone Chamber Unit (Basic)',
  price numeric(12, 2) not null default 28000,
  reservation_fee numeric(12, 2) not null default 100,
  size text,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plots_status_idx
  on public.plots (status, plot_number);

create index if not exists plots_section_idx
  on public.plots (section, plot_number);

alter table public.plots enable row level security;
