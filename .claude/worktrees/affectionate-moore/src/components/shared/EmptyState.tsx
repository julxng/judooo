import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Card className="empty-state">
    <h3>{title}</h3>
    <p className="muted-text">{description}</p>
    {action}
  </Card>
);
