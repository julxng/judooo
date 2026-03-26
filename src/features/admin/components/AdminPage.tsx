'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteShell } from '@/components/layout/SiteShell';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { canAccessAdmin, getRoleLabel } from '@/features/auth/utils/roles';
import { useAdminData } from '@/features/admin/hooks/useAdminData';
import { AdminSidebar } from '@/features/admin/components/AdminSidebar';
import { AdminOverview } from '@/features/admin/components/AdminOverview';
import { EventModerationView } from '@/features/admin/components/EventModerationView';
import { ArtworkModerationView } from '@/features/admin/components/ArtworkModerationView';
import { CreatorApplicationsView } from '@/features/admin/components/CreatorApplicationsView';
import { ManualPublishView } from '@/features/admin/components/ManualPublishView';
import { UserManagementView } from '@/features/admin/components/UserManagementView';
import { EventEditDrawer } from '@/features/admin/components/EventEditDrawer';
import { ArtworkEditDrawer } from '@/features/admin/components/ArtworkEditDrawer';
import type { AdminView } from '@/features/admin/types/admin.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { api } from '@/services/api';

const AdminContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeView = (searchParams.get('view') as AdminView) || 'overview';

  const data = useAdminData();
  const {
    currentUser,
    language,
    events,
    artworks,
    profiles,
    creatorApplications,
    counts,
    eventOps,
    artworkOps,
    profileOps,
  } = data;

  const [editingEvent, setEditingEvent] = useState<ArtEvent | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);

  const navigate = (view: AdminView) => {
    router.push(view === 'overview' ? '/admin' : `/admin?view=${view}`);
  };

  if (!currentUser) {
    return (
      <Container size="lg" className="py-12">
        <Card className="p-8">
          <p className="section-kicker">Admin</p>
          <h1 className="section-heading mt-4">Sign in to manage approvals.</h1>
          <Button className="mt-6" onClick={data.refreshAll}>Sign in</Button>
        </Card>
      </Container>
    );
  }

  if (!canAccessAdmin(currentUser.role)) {
    return (
      <Container size="lg" className="py-12">
        <Card className="p-8">
          <p className="section-kicker">Admin</p>
          <h1 className="section-heading mt-4">This dashboard is admin-only.</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Current role: {getRoleLabel(currentUser.role)}.
          </p>
        </Card>
      </Container>
    );
  }

  const handleSaveEvent = async (id: string, updates: Partial<ArtEvent>) => {
    await eventOps.updateEvent(id, updates);
  };

  const handleSaveArtwork = async (id: string, updates: Partial<Artwork>) => {
    await api.updateArtwork(id, updates);
  };

  const renderView = () => {
    switch (activeView) {
      case 'events':
        return (
          <EventModerationView
            events={events}
            language={language}
            onModerate={eventOps.moderateEvent}
            onBatchModerate={eventOps.batchModerateEvents}
            onEdit={setEditingEvent}
          />
        );
      case 'artworks':
        return (
          <ArtworkModerationView
            artworks={artworks}
            language={language}
            onModerate={artworkOps.moderateArtwork}
            onBatchModerate={artworkOps.batchModerateArtworks}
            onEdit={setEditingArtwork}
          />
        );
      case 'creators':
        return (
          <CreatorApplicationsView
            applications={creatorApplications}
            onApprove={(p) => profileOps.handleRoleApplication(p, true)}
            onReject={(p) => profileOps.handleRoleApplication(p, false)}
          />
        );
      case 'publish':
        return (
          <ManualPublishView
            eventOps={{ createEvent: eventOps.createEvent, uploadImage: eventOps.uploadImage }}
          />
        );
      case 'users':
        return (
          <UserManagementView
            profiles={profiles}
            onUpdateRole={profileOps.updateUserRole}
          />
        );
      default:
        return <AdminOverview counts={counts} onNavigate={navigate} />;
    }
  };

  return (
    <>
      <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-[240px_1fr]">
        <AdminSidebar activeView={activeView} counts={counts} onNavigate={navigate} />
        <main className="p-4 sm:p-6 lg:p-8">{renderView()}</main>
      </div>

      <EventEditDrawer
        event={editingEvent}
        open={editingEvent !== null}
        onClose={() => setEditingEvent(null)}
        onSave={handleSaveEvent}
      />
      <ArtworkEditDrawer
        artwork={editingArtwork}
        open={editingArtwork !== null}
        onClose={() => setEditingArtwork(null)}
        onSave={handleSaveArtwork}
      />
    </>
  );
};

export const AdminPage = () => (
  <SiteShell>
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <AdminContent />
    </Suspense>
  </SiteShell>
);
