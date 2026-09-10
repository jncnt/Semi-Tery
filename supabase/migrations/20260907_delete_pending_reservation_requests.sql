create policy "Users can delete their pending reservation requests"
  on public.reservation_requests for delete
  to authenticated
  using (
    user_id = auth.uid()
    and status = 'pending'
  );
