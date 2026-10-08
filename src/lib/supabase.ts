import { createClient } from '@supabase/supabase-js';

// A publishable key is deliberately public. Authorization is enforced by RLS
// and PostgreSQL functions, never by trusting a role sent from the browser.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://coghwghshcjaaqrtyvlh.supabase.co',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_wdUttDFRmzJzrFziI9rUzg_4fQCyXK7',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
