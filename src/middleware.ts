import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/admin',
  '/events',
  '/login',
  '/marketplace',
  '/privacy',
  '/profile',
  '/route-planner',
  '/signup',
  '/submit-event',
  '/terms',
  '/auth/callback',
];

const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/dashboard/artist': ['artist', 'admin'],
  '/dashboard/buyer': ['buyer', 'admin'],
};

const sanitizeRedirectPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  return value;
};

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, authEnabled } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!authEnabled) {
    return supabaseResponse;
  }

  if (pathname === '/login' || pathname === '/signup') {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = '/';
    authUrl.searchParams.set('auth', pathname === '/signup' ? 'signup' : 'signin');

    const redirectTo = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirectTo'));
    if (redirectTo) {
      authUrl.searchParams.set('redirectTo', redirectTo);
    } else {
      authUrl.searchParams.delete('redirectTo');
    }

    if (!user) {
      return NextResponse.redirect(authUrl);
    }

    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = redirectTo || '/profile';
    nextUrl.search = '';
    return NextResponse.redirect(nextUrl);
  }

  if (!user && !isPublic) {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = '/';
    authUrl.search = '';
    authUrl.searchParams.set('auth', 'signin');
    authUrl.searchParams.set('redirectTo', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(authUrl);
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined;
    for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(routePrefix)) {
        if (!role || !allowedRoles.includes(role)) {
          const nextUrl = request.nextUrl.clone();
          nextUrl.pathname = '/profile';
          nextUrl.search = '';
          return NextResponse.redirect(nextUrl);
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
