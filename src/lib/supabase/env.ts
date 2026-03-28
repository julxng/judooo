// Next.js only inlines NEXT_PUBLIC_* env vars when accessed with static dot
// notation — dynamic bracket access (process.env[key]) is NOT replaced at
// build time by webpack's DefinePlugin.
export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Canonical site origin used for auth redirects.
 * Set NEXT_PUBLIC_SITE_URL in Vercel env vars to your custom domain
 * (e.g. "https://judooo.art") so OAuth callbacks redirect correctly
 * instead of landing on the *.vercel.app URL.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || '';
