'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import {
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
    updateName,
    updatePassword,
  } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const hasCreatorAccess = hasCreatorWorkspaceAccess(currentUser?.role);

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

  const handleSaveName = async () => {
    await updateName(nameValue);
    setIsEditingName(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return;
    if (newPassword !== confirmPassword) return;
    await updatePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
  };

  return (
    <SiteShell>
      <Container size="md" className="space-y-6 py-8 sm:py-12">
        <div>
          <p className="section-kicker">Account</p>
          <h1 className="section-heading mt-2">Settings</h1>
        </div>

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Name
          </h2>
          {isEditingName ? (
            <div className="mt-3 flex items-center gap-3">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="max-w-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <Button size="sm" onClick={() => void handleSaveName()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3">
              <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
              <button
                type="button"
                className="text-sm text-muted-foreground underline hover:text-foreground"
                onClick={() => {
                  setNameValue(currentUser.name);
                  setIsEditingName(true);
                }}
              >
                Edit
              </button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Email
          </h2>
          <p className="mt-3 text-sm font-medium text-foreground">{currentUser.email}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Password
          </h2>
          {isChangingPassword ? (
            <div className="mt-3 space-y-3 max-w-xs">
              <Input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleChangePassword();
                }}
              />
              {newPassword.length > 0 && newPassword.length < 6 ? (
                <p className="text-xs text-destructive">Password must be at least 6 characters.</p>
              ) : null}
              {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              ) : null}
              <div className="flex gap-3">
                <Button
                  size="sm"
                  onClick={() => void handleChangePassword()}
                  disabled={newPassword.length < 6 || newPassword !== confirmPassword}
                >
                  Update password
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                className="text-sm text-muted-foreground underline hover:text-foreground"
                onClick={() => setIsChangingPassword(true)}
              >
                Change password
              </button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Role
          </h2>
          <p className="mt-3 text-sm font-medium text-foreground">{getRoleLabel(currentUser.role)}</p>
          {!hasCreatorAccess ? (
            <div className="mt-4">
              {currentUser.role === 'art_lover' ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Apply to submit events and artworks to the platform.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button size="sm" onClick={() => void requestCreatorRole('artist_pending')}>
                      Apply as artist
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void requestCreatorRole('gallery_manager_pending')}>
                      Apply as gallery manager
                    </Button>
                  </div>
                </>
              ) : isCreatorApplicationPending(currentUser.role) ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Your application is pending admin review.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Verified — you can publish events and artworks directly.
            </p>
          )}
        </Card>

        <div className="pt-2">
          <Button variant="outline" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </Container>
    </SiteShell>
  );
};
