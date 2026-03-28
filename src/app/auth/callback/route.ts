import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey, hasSupabaseEnv, siteUrl } from '@/lib/supabase/env';

const sanitizeRedirectPath = (value: string | null): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const origin = siteUrl || url.origin;
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'));
  const type = searchParams.get('type');

  // Handle OAuth/email errors returned by Supabase
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDescription);
    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('auth', 'signin');
    errorUrl.searchParams.set('auth_error', errorDescription || error);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.error('[auth/callback] No code parameter in callback URL');
    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('auth', 'signin');
    errorUrl.searchParams.set('auth_error', 'Authentication failed — no authorization code received.');
    return NextResponse.redirect(errorUrl);
  }

  if (!hasSupabaseEnv) {
    console.error('[auth/callback] Supabase env vars not configured');
    return NextResponse.redirect(`${origin}/?auth=signin&auth_error=Server+configuration+error`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      '[auth/callback] exchangeCodeForSession failed:',
      exchangeError.message,
      exchangeError.status,
    );
    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('auth', 'signin');
    errorUrl.searchParams.set(
      'auth_error',
      exchangeError.message.includes('code')
        ? 'Authentication expired — please try signing in again.'
        : `Authentication failed: ${exchangeError.message}`,
    );
    return NextResponse.redirect(errorUrl);
  }

  // Detect recovery: explicit type param OR recent recovery_sent_at on user
  const isRecovery =
    type === 'recovery' ||
    (() => {
      const sentAt = data.session?.user?.recovery_sent_at;
      if (!sentAt) return false;
      const elapsed = Date.now() - new Date(sentAt).getTime();
      return elapsed < 60 * 60 * 1000; // within last hour
    })();

  if (isRecovery) {
    return NextResponse.redirect(`${origin}/?auth=update-password`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
