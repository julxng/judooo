import { describe, it, expect } from 'vitest';
import {
  canAccessAdmin,
  canSubmitListings,
  canPublishWithoutApproval,
  getRoleLabel,
  isCreatorApplicationPending,
} from '@/features/auth/utils/roles';

describe('canAccessAdmin', () => {
  it('grants access to admin role', () => {
    expect(canAccessAdmin('admin')).toBe(true);
  });

  it('denies access to all other roles', () => {
    expect(canAccessAdmin('art_lover')).toBe(false);
    expect(canAccessAdmin('artist')).toBe(false);
    expect(canAccessAdmin('gallery_manager')).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });
});

describe('canSubmitListings', () => {
  it('allows all creator roles and admin', () => {
    expect(canSubmitListings('artist')).toBe(true);
    expect(canSubmitListings('artist_pending')).toBe(true);
    expect(canSubmitListings('gallery_manager')).toBe(true);
    expect(canSubmitListings('gallery_manager_pending')).toBe(true);
    expect(canSubmitListings('gallery')).toBe(true);
    expect(canSubmitListings('admin')).toBe(true);
  });

  it('denies art_lover and undefined', () => {
    expect(canSubmitListings('art_lover')).toBe(false);
    expect(canSubmitListings(undefined)).toBe(false);
  });
});

describe('canPublishWithoutApproval', () => {
  it('allows verified roles only', () => {
    expect(canPublishWithoutApproval('artist')).toBe(true);
    expect(canPublishWithoutApproval('gallery_manager')).toBe(true);
    expect(canPublishWithoutApproval('gallery')).toBe(true);
    expect(canPublishWithoutApproval('admin')).toBe(true);
  });

  it('denies pending roles', () => {
    expect(canPublishWithoutApproval('artist_pending')).toBe(false);
    expect(canPublishWithoutApproval('gallery_manager_pending')).toBe(false);
  });
});

describe('getRoleLabel', () => {
  it('returns human-readable labels for all roles', () => {
    expect(getRoleLabel('admin')).toBe('Admin');
    expect(getRoleLabel('artist')).toBe('Verified Artist');
    expect(getRoleLabel('artist_pending')).toBe('Artist Applicant');
    expect(getRoleLabel('gallery_manager')).toBe('Verified Gallery Manager');
    expect(getRoleLabel('gallery')).toBe('Verified Gallery Manager');
    expect(getRoleLabel('gallery_manager_pending')).toBe('Gallery Manager Applicant');
  });

  it('defaults to Collector for unknown/undefined', () => {
    expect(getRoleLabel(undefined)).toBe('Collector');
    expect(getRoleLabel('art_lover')).toBe('Collector');
  });
});

describe('isCreatorApplicationPending', () => {
  it('detects pending application roles', () => {
    expect(isCreatorApplicationPending('artist_pending')).toBe(true);
    expect(isCreatorApplicationPending('gallery_manager_pending')).toBe(true);
  });

  it('returns false for non-pending roles', () => {
    expect(isCreatorApplicationPending('artist')).toBe(false);
    expect(isCreatorApplicationPending('admin')).toBe(false);
    expect(isCreatorApplicationPending(undefined)).toBe(false);
  });
});
