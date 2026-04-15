'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useEventsCatalog } from '@/features/events/hooks/useEventsCatalog';
import { isApprovedEvent, isCurrentEvent } from '@/features/events/utils/event-utils';
import { EventsGrid } from '@/features/events/components/EventsGrid';
import type { ArtEvent } from '@/features/events/types/event.types';

interface SavedEventsPageProps {
  initialEvents?: ArtEvent[];
}

export const SavedEventsPage = ({ initialEvents = [] }: SavedEventsPageProps) => {
  const router = useRouter();
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const { events, savedEventIds, savedEvents, toggleSavedEvent } = useEventsCatalog(initialEvents, {
    currentUser,
    onAuthRequired: openAuthDialog,
  });

  const currentSaved = useMemo(
    () => savedEvents.filter((e) => isApprovedEvent(e) && isCurrentEvent(e)),
    [savedEvents],
  );
  const pastSaved = useMemo(
    () => savedEvents.filter((e) => isApprovedEvent(e) && !isCurrentEvent(e)),
    [savedEvents],
  );

  if (!currentUser) {
    return (
      <SiteShell>
        <Container size="lg" className="py-16 text-center">
          <h1 className="section-heading">Sign in to see your saved events</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Save events from the directory and they will appear here.
          </p>
          <Button className="mt-6" onClick={openAuthDialog}>
            Sign in
          </Button>
        </Container>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 sm:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">{language === 'vi' ? 'Đã lưu' : 'Your collection'}</p>
            <h1 className="section-heading mt-2">{language === 'vi' ? 'Sự kiện đã lưu' : 'Saved events'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {savedEvents.length === 0
                ? (language === 'vi' ? 'Chưa có sự kiện nào được lưu.' : 'No events saved yet.')
                : language === 'vi'
                  ? `Đã lưu ${savedEvents.length} sự kiện`
                  : `${savedEvents.length} event${savedEvents.length === 1 ? '' : 's'} saved`}
            </p>
          </div>
          {savedEvents.length > 0 ? (
            <Link href="/route-planner">
              <Button variant="outline" size="sm">
                Plan route
              </Button>
            </Link>
          ) : null}
        </div>

        {savedEvents.length === 0 ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground">
              Tap the heart icon on any event to save it here.
            </p>
            <Link href="/events">
              <Button className="mt-4" variant="outline" size="sm">
                Browse events
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {currentSaved.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Current ({currentSaved.length})
                </h2>
                <div className="mt-4">
                  <EventsGrid
                    events={currentSaved}
                    savedEventIds={savedEventIds}
                    onOpenEvent={(slug) => router.push(`/events/${slug}`)}
                    onToggleSave={(id) => void toggleSavedEvent(id)}
                    emptyMessage=""
                  />
                </div>
              </section>
            ) : null}

            {pastSaved.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Past ({pastSaved.length})
                </h2>
                <div className="mt-4">
                  <EventsGrid
                    events={pastSaved}
                    savedEventIds={savedEventIds}
                    onOpenEvent={(slug) => router.push(`/events/${slug}`)}
                    onToggleSave={(id) => void toggleSavedEvent(id)}
                    emptyMessage=""
                  />
                </div>
              </section>
            ) : null}
          </div>
        )}
      </Container>
    </SiteShell>
  );
};
