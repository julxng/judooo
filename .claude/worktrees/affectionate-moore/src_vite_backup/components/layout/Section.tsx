import type { HTMLAttributes, ReactNode } from 'react';
import { Container } from './Container';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
}

export const Section = ({
  children,
  title,
  description,
  kicker,
  actions,
  ...props
}: SectionProps) => (
  <section {...props}>
    <Container>
      {(title || description || kicker || actions) && (
        <div className="section-header">
          <div>
            {kicker ? <p className="eyebrow">{kicker}</p> : null}
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="muted-text">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </Container>
  </section>
);
