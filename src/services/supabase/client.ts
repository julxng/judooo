import { createBrowserClient } from '@supabase/ssr';
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env';

export const supabase = (() => {
  if (!hasSupabaseEnv) {
    console.warn(
      'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
    );
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
})();
