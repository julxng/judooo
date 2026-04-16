import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './Button';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  className?: string;
};

export const EmptyState = ({ icon: Icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('empty-state-enhanced', className)}>
    {Icon ? (
      <div className="empty-state-enhanced__icon">
        <Icon size={24} />
      </div>
    ) : null}
    <div className="empty-state-enhanced__decoration" />
    <h3 className="empty-state-enhanced__title">{title}</h3>
    {description ? <p className="empty-state-enhanced__body">{description}</p> : null}
    {action ? (
      <Button variant={action.variant ?? 'default'} size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    ) : null}
  </div>
);
