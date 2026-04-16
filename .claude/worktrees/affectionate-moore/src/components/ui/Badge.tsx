import { cva, type VariantProps } from 'class-variance-authority';
import { cn as cx } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em]',
  {
    variants: {
      tone: {
        default: 'border-border bg-card text-secondary-foreground',
        accent: 'border-foreground bg-foreground text-background',
        success: 'border-border bg-card text-success',
        warning: 'border-border bg-card text-warning',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge = ({ className, tone, ...props }: BadgeProps) => (
  <span className={cx(badgeVariants({ tone }), className)} {...props} />
);
