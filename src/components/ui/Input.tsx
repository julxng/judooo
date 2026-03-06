import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '@lib/cx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cx('ui-control', className)} {...props} />
  ),
);

Input.displayName = 'Input';
