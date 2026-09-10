import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseUrl !== 'your_supabase_url';

if (!isConfigured) {
  console.warn('Supabase credentials are not set. Application might not work correctly.');
}

const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder_key';

export const supabase = createClient(
  isConfigured ? supabaseUrl : defaultUrl,
  isConfigured ? supabaseAnonKey : defaultKey
);

// Debug: show which URL the client is using (helps debug 404/500 on /auth endpoints)
try {
  // print only the host to avoid leaking the key
  const urlToShow = new URL(isConfigured ? supabaseUrl : defaultUrl).host;
  // eslint-disable-next-line no-console
  console.debug('Supabase host in use:', urlToShow);
} catch (e) {
  // ignore
}
