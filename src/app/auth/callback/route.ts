import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase/env';

const sanitizeRedirectPath = (value: string | null): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(searchParams.get('next'));

  const type = searchParams.get('type');

  if (code && supabaseUrl && supabaseAnonKey) {
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Detect recovery: explicit type param OR recent recovery_sent_at on user
      const isRecovery = type === 'recovery' || (() => {
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
  }

  return NextResponse.redirect(`${origin}/?auth=signin`);
}
