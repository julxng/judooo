import type { KeyboardEvent, ReactNode } from 'react';
import { Card } from '@ui/Card';
import { Badge, type BadgeProps } from '@ui/Badge';
import { cx } from '@lib/cx';

type BadgeTone = BadgeProps['tone'];

interface MediaCardProps {
  imageUrl: string;
  imageAlt: string;
  aspectRatio?: '4/3' | '4/5' | '1/1';
  badge?: { label: string; tone?: BadgeTone };
  overlay?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
  soldLabel?: string;
  children: ReactNode;
  onClick?: () => void;
  onImageError?: () => void;
  className?: string;
}

export const MediaCard = ({
  imageUrl,
  imageAlt,
  aspectRatio = '4/3',
  badge,
  overlay = false,
  onSave,
  isSaved = false,
  soldLabel,
  children,
  onClick,
  onImageError,
  className,
}: MediaCardProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card className={cx('media-card', className)}>
      <div
        role="button"
        tabIndex={0}
        className="media-card__surface"
        onClick={onClick}
        onKeyDown={handleKeyDown}
      >
        <div className={cx('media-card__image-wrap', `media-card__image-wrap--${aspectRatio.replace('/', '-')}`)}>
          <img
            src={imageUrl}
            alt={imageAlt}
            className="media-card__image"
            loading="lazy"
            onError={onImageError}
          />
          {overlay && <div className="media-card__overlay" />}
          {badge && (
            <Badge tone={badge.tone || 'accent'} className="media-card__badge">
              {badge.label}
            </Badge>
          )}
          {onSave && (
            <button
              type="button"
              className={cx('media-card__save', isSaved && 'media-card__save--active')}
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              aria-label={isSaved ? 'Remove from saved' : 'Save'}
            >
              ♥
            </button>
          )}
          {soldLabel && <div className="media-card__sold">{soldLabel}</div>}
        </div>
        <div className="media-card__body">{children}</div>
      </div>
    </Card>
  );
};

// Sub-components for card body content
export const MediaCardMeta = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('media-card__meta', className)}>{children}</div>
);

export const MediaCardTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="media-card__title">{children}</h3>
);

export const MediaCardSubtitle = ({ children }: { children: ReactNode }) => (
  <p className="media-card__subtitle">{children}</p>
);

export const MediaCardFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('media-card__footer', className)}>{children}</div>
);

export const MediaCardLink = ({ children }: { children: ReactNode }) => (
  <span className="media-card__link">{children}</span>
);

export const MediaCardFlags = ({ children }: { children: ReactNode }) => (
  <div className="media-card__flags">{children}</div>
);
