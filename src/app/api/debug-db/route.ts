import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseUrl, hasSupabaseEnv } from '@/lib/supabase/env';

export async function GET() {
  const info: Record<string, unknown> = {
    hasSupabaseEnv,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : 'MISSING',
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = await createClient();

    const { data: events, error: eventsError, count: eventsCount } = await supabase
      .from('events')
      .select('id, title, moderation_status', { count: 'exact' });

    info.eventsCount = eventsCount ?? events?.length ?? 0;
    info.eventsError = eventsError?.message ?? null;
    info.eventsSample = events?.slice(0, 3).map((e) => ({ id: e.id, title: e.title, status: e.moderation_status })) ?? [];

    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('id, title', { count: 'exact' });

    info.artworksCount = artworks?.length ?? 0;
    info.artworksError = artworksError?.message ?? null;

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role');

    info.profilesCount = profiles?.length ?? 0;
    info.profilesError = profilesError?.message ?? null;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    info.authUser = user ? { id: user.id, email: user.email, role: user.user_metadata?.role } : null;
    info.authError = authError?.message ?? null;

  } catch (err) {
    info.error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(info);
}
