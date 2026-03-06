import type { ReactNode } from 'react';
import { Container } from './Container';

interface DashboardLayoutProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const DashboardLayout = ({
  title,
  description,
  actions,
  children,
}: DashboardLayoutProps) => (
  <Container>
    <div className="dashboard-layout">
      <div className="dashboard-layout__header">
        <div>
          <p className="eyebrow">Admin Surface</p>
          <h2 className="section-title">{title}</h2>
          <p className="muted-text">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  </Container>
);
