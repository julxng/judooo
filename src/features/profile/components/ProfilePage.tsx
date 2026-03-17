'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Tabs } from '@/components/ui/Tabs';
import { useEventsCatalog } from '@/features/events/hooks/useEventsCatalog';
import {
  getRoleApplicationCopy,
  getRoleLabel,
  hasCreatorWorkspaceAccess,
  isCreatorApplicationPending,
} from '@/features/auth/utils/roles';
import { getEventTitle, isCurrentEvent } from '@/features/events/utils/event-utils';
import type { ArtEvent } from '@/features/events/types/event.types';

interface ProfilePageProps {
  initialEvents?: ArtEvent[];
}

export const ProfilePage = ({ initialEvents = [] }: ProfilePageProps) => {
  const { language } = useLanguage();
  const {
    currentUser,
    logout,
    openAuthDialog,
    requestCreatorRole,
  } = useAuth();
  const { savedEvents, routeEvents } = useEventsCatalog(initialEvents, {
    currentUser,
    onAuthRequired: openAuthDialog,
  });
  const [activeTab, setActiveTab] = useState<'saved' | 'account' | 'verified'>('saved');
  const hasCreatorAccess = hasCreatorWorkspaceAccess(currentUser?.role);

  const currentSaved = useMemo(() => savedEvents.filter(isCurrentEvent), [savedEvents]);
  const pastSaved = useMemo(() => savedEvents.filter((event) => !isCurrentEvent(event)), [savedEvents]);
  const roleCopy = getRoleApplicationCopy(currentUser?.role);

  if (!currentUser) {
    return (
      <SiteShell>
        <Container size="lg" className="py-12">
          <Card className="p-8">
            <p className="section-kicker">Profile</p>
            <h1 className="section-heading mt-4">Profile is only for artist or gallery manager accounts.</h1>
            <Button className="mt-6" onClick={openAuthDialog}>
              Sign in / Sign up as creator
            </Button>
          </Card>
        </Container>
      </SiteShell>
    );
  }

  if (!hasCreatorAccess) {
    return (
      <SiteShell>
        <Container size="lg" className="py-12">
          <Card className="p-8">
            <p className="section-kicker">Profile</p>
            <h1 className="section-heading mt-4">Collector accounts do not get a profile workspace.</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Sign up as an artist or gallery manager to access creator tools, submissions, and this profile area.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => void requestCreatorRole('artist_pending')}>
                Apply as artist
              </Button>
              <Button variant="outline" onClick={() => void requestCreatorRole('gallery_manager_pending')}>
                Apply as gallery manager
              </Button>
            </div>
          </Card>
        </Container>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 sm:py-12">
        <section className="grid gap-6 xl:grid-cols-[0.68fr_1.32fr]">
          <Card className="p-8">
            <p className="section-kicker">Profile</p>
            <h1 className="section-heading mt-4">{currentUser.name}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {currentUser.email}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{getRoleLabel(currentUser.role)}</p>
            {roleCopy ? (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{roleCopy}</p>
            ) : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Card className="bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saved</p>
                <p className="mt-2 text-2xl font-semibold">{savedEvents.length}</p>
              </Card>
              <Card className="bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">In Route</p>
                <p className="mt-2 text-2xl font-semibold">{routeEvents.length}</p>
              </Card>
            </div>
          </Card>

          <div className="space-y-6">
            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { id: 'saved', label: 'Saved events' },
                { id: 'account', label: 'Account' },
                { id: 'verified', label: 'Creator access' },
              ]}
            />

            {activeTab === 'saved' ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h2 className="font-display text-[1.3rem] leading-[0.98] tracking-[-0.04em] xl:text-[1.5rem]">Current events</h2>
                  <div className="mt-4 space-y-3">
                    {currentSaved.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No current events saved yet. <Link href="/events" className="font-semibold text-foreground">Browse the directory</Link>.
                      </p>
                    ) : (
                      currentSaved.map((event) => (
                        <Card key={event.id} className="bg-secondary p-4">
                          <p className="font-semibold">{getEventTitle(event, language)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{event.city}</p>
                        </Card>
                      ))
                    )}
                  </div>
                </Card>
                <Card className="p-6">
                  <h2 className="font-display text-[1.3rem] leading-[0.98] tracking-[-0.04em] xl:text-[1.5rem]">Past events</h2>
                  <div className="mt-4 space-y-3">
                    {pastSaved.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Past saved events will appear here automatically.</p>
                    ) : (
                      pastSaved.map((event) => (
                        <Card key={event.id} className="bg-secondary p-4">
                          <p className="font-semibold">{getEventTitle(event, language)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{event.city}</p>
                        </Card>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeTab === 'account' ? (
              <Card className="p-6">
                <p className="section-kicker">Account</p>
                <p className="mt-4 text-lg font-semibold text-foreground">{currentUser.email}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Role: {getRoleLabel(currentUser.role)}
                </p>
                <Button className="mt-6" variant="outline" onClick={() => void logout()}>
                  Sign out
                </Button>
              </Card>
            ) : null}

            {activeTab === 'verified' ? (
              <Card className="p-6">
                <p className="section-kicker">Creator Access</p>
                <h2 className="mt-4 section-heading">Apply to submit events and artworks.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Collector accounts can browse and save. Artist and gallery manager accounts can submit listings, and verified creators publish without waiting for approval.
                </p>
                {currentUser.role === 'art_lover' ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={() => void requestCreatorRole('artist_pending')}>
                      Apply as artist
                    </Button>
                    <Button variant="outline" onClick={() => void requestCreatorRole('gallery_manager_pending')}>
                      Apply as gallery manager
                    </Button>
                  </div>
                ) : isCreatorApplicationPending(currentUser.role) ? (
                  <p className="mt-6 text-sm font-medium text-foreground">
                    Your application is pending admin review.
                  </p>
                ) : (
                  <p className="mt-6 text-sm font-medium text-foreground">
                    This account is verified and can publish directly.
                  </p>
                )}
              </Card>
            ) : null}
          </div>
        </section>
      </Container>
    </SiteShell>
  );
};
