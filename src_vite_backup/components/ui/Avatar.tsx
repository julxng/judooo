import { cx } from '@lib/cx';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ src, alt, size = 'md' }: AvatarProps) => (
  <span className={cx('ui-avatar', `ui-avatar--${size}`)}>
    {src ? <img src={src} alt={alt} /> : <span>{alt.slice(0, 2).toUpperCase()}</span>}
  </span>
);
