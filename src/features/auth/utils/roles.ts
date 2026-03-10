import type { SignUpRole, UserRole } from '../types/auth.types';

export const canAccessAdmin = (role?: UserRole): boolean =>
  role === 'admin';

export const canSubmitListings = (role?: UserRole): boolean =>
  role === 'artist_pending' ||
  role === 'artist' ||
  role === 'gallery_manager_pending' ||
  role === 'gallery_manager' ||
  role === 'gallery' ||
  role === 'admin';

export const canPublishWithoutApproval = (role?: UserRole): boolean =>
  role === 'artist' || role === 'gallery_manager' || role === 'gallery' || role === 'admin';

export const hasCreatorWorkspaceAccess = (role?: UserRole): boolean =>
  canSubmitListings(role);

export const isCreatorApplicationPending = (role?: UserRole): boolean =>
  role === 'artist_pending' || role === 'gallery_manager_pending';

export const getRoleLabel = (role?: UserRole): string => {
  switch (role) {
    case 'artist_pending':
      return 'Artist Applicant';
    case 'artist':
      return 'Verified Artist';
    case 'gallery_manager_pending':
      return 'Gallery Manager Applicant';
    case 'gallery_manager':
    case 'gallery':
      return 'Verified Gallery Manager';
    case 'admin':
      return 'Admin';
    default:
      return 'Collector';
  }
};

export const getRoleApplicationCopy = (role?: UserRole): string | null => {
  if (role === 'artist_pending') {
    return 'Artist application pending review. Your submissions will go into moderation until approved.';
  }

  if (role === 'gallery_manager_pending') {
    return 'Gallery manager application pending review. Your submissions will go into moderation until approved.';
  }

  if (role === 'artist') {
    return 'Artist verification approved. New submissions can publish without review.';
  }

  if (role === 'gallery_manager' || role === 'gallery') {
    return 'Gallery manager verification approved. New submissions can publish without review.';
  }

  return null;
};

export const getPendingRoleTarget = (
  role?: UserRole,
): Exclude<UserRole, 'art_lover' | 'admin' | 'artist_pending' | 'gallery_manager_pending'> | null => {
  if (role === 'artist_pending') return 'artist';
  if (role === 'gallery_manager_pending') return 'gallery_manager';
  return null;
};

export const getDefaultRoleFromSignup = (role: SignUpRole): UserRole => role;
