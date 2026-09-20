import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');

const supabase = createClient(supabaseUrl, serviceRoleKey);

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatDate = (value: string) => new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Asia/Manila',
}).format(new Date(value));

const sendEmail = async (to: string, subject: string, body: string) => {
  if (!resendApiKey || !fromEmail) {
    throw new Error('RESEND_API_KEY and RESEND_FROM_EMAIL must be configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html: body,
    }),
  });

  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}`);
};

const emailBody = (reservation: Record<string, unknown>, status: string, nextStep: string) => {
  const plot = Array.isArray(reservation.plots) ? reservation.plots[0] : reservation.plots;
  return `<div style="font-family:Arial,sans-serif;color:#26332D;line-height:1.6">
    <h2 style="color:#1F4035">Garden of Peace Memorial Park</h2>
    <p>Dear ${escapeHtml(reservation.requester_name)},</p>
    <p>Your reservation update is ready.</p>
    <dl>
      <dt><strong>Plot</strong></dt><dd>${escapeHtml(plot?.plot_number || 'Reserved plot')}</dd>
      <dt><strong>Reservation date</strong></dt><dd>${formatDate(String(reservation.reservation_date))}</dd>
      <dt><strong>Valid until</strong></dt><dd>${formatDate(String(reservation.expires_at))}</dd>
      <dt><strong>Status</strong></dt><dd>${escapeHtml(status)}</dd>
    </dl>
    <p>${escapeHtml(nextStep)}</p>
    <p>Garden of Peace Memorial Park</p>
  </div>`;
};

Deno.serve(async () => {
  const now = new Date();
  const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { error: expirationError } = await supabase.rpc('expire_reservations');
  if (expirationError) {
    return new Response(JSON.stringify({ error: expirationError.message }), { status: 500 });
  }

  const { data: reservations, error } = await supabase
    .from('reservation_requests')
    .select('id, user_id, requester_name, requester_email, reservation_date, expires_at, status, submitted_notification_sent_at, approval_notification_sent_at, reminder_notification_sent_at, expiration_notification_sent_at, plots(plot_number)')
    .or(`and(status.eq.pending,submitted_notification_sent_at.is.null),and(status.eq.approved,approval_notification_sent_at.is.null),and(status.in.(pending,approved),expires_at.gte.${reminderStart},expires_at.lte.${reminderEnd},reminder_notification_sent_at.is.null),and(status.eq.expired,expiration_notification_sent_at.is.null)`);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const sent: string[] = [];
  for (const reservation of reservations || []) {
    const { data: userData } = await supabase.auth.admin.getUserById(reservation.user_id);
    const recipient = userData.user?.email || reservation.requester_email;
    if (!recipient) continue;

    let kind: 'submitted_notification_sent_at' | 'approval_notification_sent_at' | 'reminder_notification_sent_at' | 'expiration_notification_sent_at';
    let subject: string;
    let nextStep: string;
    const isReminderWindow = new Date(reservation.expires_at).getTime() - now.getTime() <= 25 * 60 * 60 * 1000;
    if (reservation.status === 'expired') {
      kind = 'expiration_notification_sent_at';
      subject = 'Your Garden of Peace reservation has expired';
      nextStep = 'Please contact the memorial park team if you still need assistance finding an available plot.';
    } else if (isReminderWindow && !reservation.reminder_notification_sent_at) {
      kind = 'reminder_notification_sent_at';
      subject = 'Your Garden of Peace reservation expires tomorrow';
      nextStep = 'Please contact the memorial park team before the expiration date to continue your reservation.';
    } else if (reservation.status === 'approved') {
      kind = 'approval_notification_sent_at';
      subject = 'Your Garden of Peace reservation was approved';
      nextStep = 'Please complete the next steps with the memorial park team before the validity date.';
    } else {
      kind = 'submitted_notification_sent_at';
      subject = 'Your Garden of Peace reservation was submitted';
      nextStep = 'The memorial park team will review your request. Please keep this email for your records.';
    }

    await sendEmail(recipient, subject, emailBody(reservation, reservation.status, nextStep));
    await supabase.from('reservation_requests').update({ [kind]: new Date().toISOString() }).eq('id', reservation.id);
    sent.push(reservation.id);
  }

  return new Response(JSON.stringify({ sent: sent.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
