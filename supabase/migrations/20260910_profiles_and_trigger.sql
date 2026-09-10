-- Create profiles table if it does not exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'visitor' check (role in ('admin', 'staff', 'visitor')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Drop existing policies if any to avoid duplication
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create RLS Policies for public.profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  to public
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to public
  with check (auth.uid() = id or auth.uid() is null);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Function to handle auto-creation of profiles when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'visitor'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run handle_new_user on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
