import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn as cx } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cx('ui-control', className)} {...props} />
  ),
);

Input.displayName = 'Input';
