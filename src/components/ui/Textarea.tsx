import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn as cx } from '@/lib/utils';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cx('ui-control ui-control--textarea', className)} {...props} />
));

Textarea.displayName = 'Textarea';
