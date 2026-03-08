'use client';

import type { PropsWithChildren } from 'react';
import { Container, Stack } from '@components/layout/index';
import { branding } from '@assets/branding';
import { appTabs } from '@app/routes/tabs';
import { Avatar, Button } from '@ui/index';
import type { TabId, User } from '@/types';
import type { Locale as Language } from '@/lib/i18n/translations';

interface MainLayoutProps extends PropsWithChildren {
  activeTab: TabId;
  currentUser: User | null;
  language: Language;
  canAccessAdmin: boolean;
  onTabChange: (tab: TabId) => void;
  onLanguageChange: (language: Language) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const MainLayout = ({
  children,
  activeTab,
  currentUser,
  language,
  canAccessAdmin,
  onTabChange,
  onLanguageChange,
  onOpenAuth,
  onLogout,
}: MainLayoutProps) => {
  const visibleTabs = appTabs.filter((tab) => (tab.adminOnly ? canAccessAdmin : true));

  return (
    <div className="page-shell">
      <header className="main-shell__header">
        <Container className="main-shell__header-inner">
          <button type="button" className="brand-lockup" onClick={() => onTabChange('marketplace')}>
            <img src={branding.icon} alt="Judooo icon" />
            <img src={branding.logo} alt="Judooo" className="brand-lockup__logo" />
          </button>

          <nav className="main-shell__nav">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`main-shell__nav-item ${activeTab === tab.id ? 'main-shell__nav-item--active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="main-shell__header-actions">
            <div className="main-shell__language">
              <button
                type="button"
                className={language === 'vi' ? 'main-shell__language--active' : ''}
                onClick={() => onLanguageChange('vi')}
              >
                VN
              </button>
              <button
                type="button"
                className={language === 'en' ? 'main-shell__language--active' : ''}
                onClick={() => onLanguageChange('en')}
              >
                EN
              </button>
            </div>
            {currentUser ? (
              <Stack gap={12} direction="row" align="center">
                <div className="main-shell__user-copy">
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.role.replace('_', ' ')}</span>
                </div>
                <Avatar src={currentUser.avatar} alt={currentUser.name} />
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Sign Out
                </Button>
              </Stack>
            ) : (
              <Button variant="secondary" size="sm" onClick={onOpenAuth}>
                Join
              </Button>
            )}
          </div>
        </Container>
      </header>

      <main className="main-shell__body">
        <Container>{children}</Container>
      </main>

      <footer className="main-shell__footer">
        <Container className="main-shell__footer-inner">
          <div>
            <p className="eyebrow">Judooo</p>
            <p className="muted-text">
              Judooo builds the discovery, collecting, and archive layer for Vietnam art.
            </p>
          </div>
          <div className="main-shell__footer-links">
            <a href="https://www.facebook.com/judooo.art" target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href="https://www.instagram.com/judooo.art/" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://www.tiktok.com/@judooo.art" target="_blank" rel="noreferrer">
              TikTok
            </a>
          </div>
        </Container>
      </footer>
    </div>
  );
};
