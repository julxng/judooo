'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getRoleLabel } from '@/features/auth/utils/roles';
import type { User, UserRole } from '@/features/auth/types/auth.types';

type UserManagementViewProps = {
  profiles: User[];
  onUpdateRole: (profile: User, newRole: UserRole) => Promise<void>;
};

const ALL_ROLES: UserRole[] = ['art_lover', 'artist_pending', 'artist', 'gallery_manager_pending', 'gallery_manager', 'gallery', 'admin'];

const roleBadgeTone = (role: UserRole) => {
  if (role === 'admin') return 'accent' as const;
  if (role === 'artist' || role === 'gallery_manager' || role === 'gallery') return 'success' as const;
  if (role.includes('pending')) return 'warning' as const;
  return 'default' as const;
};

export const UserManagementView = ({ profiles, onUpdateRole }: UserManagementViewProps) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roleChange, setRoleChange] = useState<{ profile: User; newRole: UserRole } | null>(null);

  const filtered = useMemo(() => {
    let result = profiles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q),
      );
    }
    if (roleFilter) {
      result = result.filter((p) => p.role === roleFilter);
    }
    return result;
  }, [profiles, search, roleFilter]);

  const handleRoleSelect = (profile: User, newRole: UserRole) => {
    if (newRole === profile.role) return;
    setRoleChange({ profile, newRole });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all user accounts and roles.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((profile) => (
                <tr key={profile.id} className="border-b border-border/50 transition-colors hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                          {profile.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="font-medium">{profile.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={roleBadgeTone(profile.role)}>{getRoleLabel(profile.role)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Select
                        value={profile.role}
                        onChange={(e) => handleRoleSelect(profile, e.target.value as UserRole)}
                        className="w-48"
                      >
                        {ALL_ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                      </Select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {roleChange && (
        <ConfirmDialog
          title="Change user role"
          message={`Change ${roleChange.profile.name}'s role from "${getRoleLabel(roleChange.profile.role)}" to "${getRoleLabel(roleChange.newRole)}"?`}
          confirmLabel="Change role"
          onConfirm={() => {
            void onUpdateRole(roleChange.profile, roleChange.newRole);
            setRoleChange(null);
          }}
          onCancel={() => setRoleChange(null)}
        />
      )}
    </div>
  );
};
