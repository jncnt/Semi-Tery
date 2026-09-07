alter table public.reservation_requests
  add column if not exists receipt_url text;

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', true)
on conflict (id) do update set public = true;

create policy "Authenticated users can upload payment receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view payment receipts"
  on storage.objects for select
  to public
  using (bucket_id = 'payment-receipts');
