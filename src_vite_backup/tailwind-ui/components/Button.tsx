import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface JudoooButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'jd:bg-judooo-ink jd:text-judooo-paper hover:jd:bg-judooo-ember focus-visible:jd:outline-judooo-ember',
  secondary:
    'jd:bg-judooo-paper jd:text-judooo-ink jd:ring-1 jd:ring-judooo-ink/12 hover:jd:bg-judooo-mist focus-visible:jd:outline-judooo-ember',
  ghost:
    'jd:bg-transparent jd:text-judooo-smoke jd:ring-1 jd:ring-transparent hover:jd:bg-judooo-mist hover:jd:text-judooo-ink focus-visible:jd:outline-judooo-ember',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'jd:h-10 jd:px-4 jd:text-[11px]',
  md: 'jd:h-12 jd:px-5 jd:text-xs',
  lg: 'jd:h-14 jd:px-6 jd:text-sm',
};

export const JudoooButton = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  ...props
}: PropsWithChildren<JudoooButtonProps>) => (
  <button
    type={type}
    className={cn(
      'jd:inline-flex jd:items-center jd:justify-center jd:gap-2 jd:rounded-full jd:border-0 jd:font-mono jd:font-semibold jd:uppercase jd:tracking-[0.22em] jd:transition-all jd:duration-200 focus-visible:jd:outline focus-visible:jd:outline-2 focus-visible:jd:outline-offset-2',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'jd:w-full',
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
