import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@lib/cx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = ({
  className,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cx(
      'ui-button',
      `ui-button--${variant}`,
      `ui-button--${size}`,
      fullWidth && 'ui-button--full',
      className,
    )}
    {...props}
  />
);
