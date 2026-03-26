'use client';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getRoleLabel } from '@/features/auth/utils/roles';
import type { User } from '@/features/auth/types/auth.types';

type CreatorApplicationsViewProps = {
  applications: User[];
  onApprove: (profile: User) => Promise<void>;
  onReject: (profile: User) => Promise<void>;
};

export const CreatorApplicationsView = ({
  applications,
  onApprove,
  onReject,
}: CreatorApplicationsViewProps) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-semibold">Creator Applications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Approve or reject artist and gallery manager role applications.
      </p>
    </div>

    {applications.length === 0 ? (
      <div className="rounded-md border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No pending applications.</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role Applied</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((profile) => (
              <tr key={profile.id} className="border-b border-border/50 transition-colors hover:bg-secondary/20">
                <td className="px-4 py-3 font-medium">{profile.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
                <td className="px-4 py-3">
                  <Badge tone="warning">{getRoleLabel(profile.role)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => void onApprove(profile)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => void onReject(profile)}>
                      Return to collector
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <p className="text-xs text-muted-foreground">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
  </div>
);
