const readEnv = (primary: string, fallback?: string): string | undefined => {
  const primaryValue = process.env[primary];
  if (primaryValue) return primaryValue;
  if (!fallback) return undefined;
  return process.env[fallback];
};

export const supabaseUrl =
  readEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL') || '';

export const supabaseAnonKey =
  readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') || '';

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
