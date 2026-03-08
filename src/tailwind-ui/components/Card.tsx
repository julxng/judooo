import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { cn } from '../cn';

interface JudoooCardProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title?: string;
  description?: string;
  media?: ReactNode;
  footer?: ReactNode;
}

export const JudoooCard = ({
  className,
  eyebrow,
  title,
  description,
  media,
  footer,
  children,
  ...props
}: PropsWithChildren<JudoooCardProps>) => (
  <article
    className={cn(
      'jd:overflow-hidden jd:rounded-[28px] jd:border jd:border-judooo-ink/8 jd:bg-judooo-paper jd:shadow-judooo-card',
      className,
    )}
    {...props}
  >
    {media ? <div className="jd:aspect-[4/3] jd:overflow-hidden jd:bg-judooo-mist">{media}</div> : null}
    <div className="jd:flex jd:flex-col jd:gap-4 jd:p-6">
      {eyebrow ? (
        <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.26em] jd:text-judooo-ember">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h3 className="jd:m-0 jd:font-serif jd:text-[clamp(1.65rem,3vw,2.2rem)] jd:leading-[0.95] jd:text-judooo-ink">
          {title}
        </h3>
      ) : null}
      {description ? <p className="jd:m-0 jd:text-sm jd:leading-6 jd:text-judooo-smoke">{description}</p> : null}
      {children}
      {footer ? <div className="jd:flex jd:items-center jd:justify-between jd:gap-4">{footer}</div> : null}
    </div>
  </article>
);
