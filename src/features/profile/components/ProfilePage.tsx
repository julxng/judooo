'use client';

import { useAuth } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import {
  getRoleApplicationCopy,
  getRoleLabel,
  hasCreatorWorkspaceAccess,
  isCreatorApplicationPending,
} from '@/features/auth/utils/roles';

export const ProfilePage = () => {
  const {
    currentUser,
    logout,
    openAuthDialog,
    requestCreatorRole,
  } = useAuth();
  const hasCreatorAccess = hasCreatorWorkspaceAccess(currentUser?.role);
  const roleCopy = getRoleApplicationCopy(currentUser?.role);

  if (!currentUser) {
    return (
      <SiteShell>
        <Container size="md" className="py-16 text-center">
          <h1 className="section-heading">Sign in to view your profile</h1>
          <Button className="mt-6" onClick={openAuthDialog}>
            Sign in
          </Button>
        </Container>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Container size="md" className="space-y-6 py-8 sm:py-12">
        <div>
          <p className="section-kicker">Account</p>
          <h1 className="section-heading mt-2">{currentUser.name}</h1>
        </div>

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Details
          </h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{currentUser.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{getRoleLabel(currentUser.role)}</dd>
            </div>
          </dl>
          {roleCopy ? (
            <p className="mt-4 text-sm text-muted-foreground">{roleCopy}</p>
          ) : null}
        </Card>

        {!hasCreatorAccess ? (
          <Card className="p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Creator access
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Apply to submit events and artworks to the platform.
            </p>
            {currentUser.role === 'art_lover' ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button size="sm" onClick={() => void requestCreatorRole('artist_pending')}>
                  Apply as artist
                </Button>
                <Button size="sm" variant="outline" onClick={() => void requestCreatorRole('gallery_manager_pending')}>
                  Apply as gallery manager
                </Button>
              </div>
            ) : isCreatorApplicationPending(currentUser.role) ? (
              <p className="mt-4 text-sm font-medium text-foreground">
                Your application is pending admin review.
              </p>
            ) : null}
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Creator access
            </h2>
            <p className="mt-3 text-sm font-medium text-foreground">
              Verified — you can publish events and artworks directly.
            </p>
          </Card>
        )}

        <div className="pt-2">
          <Button variant="outline" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </Container>
    </SiteShell>
  );
};
