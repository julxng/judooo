import type { ReactNode } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { cx } from '@lib/cx';

interface DetailLayoutProps {
  media: ReactNode;
  sidebar: ReactNode;
  content: ReactNode;
  mediaStrip?: ReactNode;
  relatedItems?: ReactNode;
  className?: string;
}

export const DetailLayout = ({
  media,
  sidebar,
  content,
  mediaStrip,
  relatedItems,
  className,
}: DetailLayoutProps) => (
  <SidebarLayout sidebar={sidebar}>
    <div className={cx('detail-layout', className)}>
      <div className="detail-hero">
        <div className="detail-hero__media-wrap">{media}</div>
      </div>
      {mediaStrip && <div className="detail-media-strip">{mediaStrip}</div>}
      <div className="detail-grid">{content}</div>
      {relatedItems}
    </div>
  </SidebarLayout>
);

// Sub-components for detail panel content
export const DetailPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cx('detail-panel', className)}>{children}</div>;

export const DetailPanelTitle = ({ children }: { children: ReactNode }) => (
  <p className="eyebrow">{children}</p>
);

export const DetailPanelActions = ({ children }: { children: ReactNode }) => (
  <div className="detail-panel__actions">{children}</div>
);

export const DetailList = ({ children }: { children: ReactNode }) => (
  <div className="detail-list">{children}</div>
);

export const DetailListItem = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export const DetailChipRow = ({ children }: { children: ReactNode }) => (
  <div className="detail-chip-row">{children}</div>
);

export const DetailCopy = ({ children }: { children: ReactNode }) => (
  <div className="detail-copy">{children}</div>
);

export const DetailMediaStripItem = ({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    className={cx('detail-media-strip__item', isActive && 'detail-media-strip__item--active')}
    onClick={onClick}
  >
    {children}
  </button>
);
