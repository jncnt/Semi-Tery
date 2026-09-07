alter table public.burial_records
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text;

alter table public.burial_records
  alter column full_name drop not null;

-- Backfill existing records before removing or ignoring the old full_name column.
update public.burial_records
set
  first_name = split_part(trim(full_name), ' ', 1),
  middle_name = nullif(trim(regexp_replace(trim(full_name), '^[^ ]+|[^ ]+$', '', 'g')), ''),
  last_name = split_part(trim(full_name), ' ', array_length(string_to_array(trim(full_name), ' '), 1))
where full_name is not null
  and first_name is null;

create index if not exists burial_records_last_name_idx
  on public.burial_records (last_name, first_name);
