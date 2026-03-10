import { cn as cx } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ src, alt, size = 'md' }: AvatarProps) => (
  <span
    className={cx(
      'inline-flex items-center justify-center overflow-hidden rounded-sm border border-border bg-secondary text-foreground',
      size === 'sm' && 'h-8 w-8 text-xs',
      size === 'md' && 'h-10 w-10 text-sm',
      size === 'lg' && 'h-12 w-12 text-base',
    )}
  >
    {src ? (
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <span>{alt.slice(0, 2).toUpperCase()}</span>
    )}
  </span>
);
