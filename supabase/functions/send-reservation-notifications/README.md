# Reservation notifications

This Edge Function is intentionally provider-agnostic at the application layer and uses Resend when configured.

## Required Supabase secrets

Configure these Edge Function secrets in the Supabase project:

- `SUPABASE_SERVICE_ROLE_KEY`: the project service-role key, stored only as a server secret
- `RESEND_API_KEY`: Resend API key
- `RESEND_FROM_EMAIL`: a verified sender, for example `Garden of Peace <notifications@example.com>`

Never place these values in `.env` or frontend JavaScript.

## Deploy

```powershell
supabase functions deploy send-reservation-notifications
```

## Schedule

Invoke the deployed function from a trusted scheduler every 15 minutes. The database migration schedules expiration itself with `pg_cron`; the Edge Function handles email delivery and calls the expiration function before processing notifications. Use the Supabase Dashboard scheduled Edge Function option or a trusted server scheduler to call:

```text
https://bsywhweggncjzpbtpdxx.supabase.co/functions/v1/send-reservation-notifications
```

The scheduler must send the function's authorization header using the Supabase project configuration. Do not expose the service-role key in the browser.

Without `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, reservations and expiration still work, but email notifications remain disabled and the function returns a configuration error rather than pretending delivery succeeded.
