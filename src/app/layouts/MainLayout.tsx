import { useState, type PropsWithChildren } from 'react';
import { Container, Stack } from '@components/layout/index';
import { branding } from '@assets/branding';
import { appTabs } from '@app/routes/tabs';
import { Avatar, Button } from '@ui/index';
import type { Language, TabId, User } from '@types';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleTabs = appTabs.filter((tab) => (tab.adminOnly ? canAccessAdmin : true));

  const handleTabChange = (tab: TabId) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="page-shell">
      <header className="main-shell__header">
        <Container className="main-shell__header-inner">
          <button type="button" className="brand-lockup" onClick={() => handleTabChange('marketplace')}>
            <img src={branding.icon} alt="Judooo icon" />
            <img src={branding.logo} alt="Judooo" className="brand-lockup__logo" />
          </button>

          <button
            type="button"
            className="main-shell__menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`main-shell__menu-icon ${mobileMenuOpen ? 'main-shell__menu-icon--open' : ''}`} />
          </button>

          <nav className={`main-shell__nav ${mobileMenuOpen ? 'main-shell__nav--open' : ''}`}>
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`main-shell__nav-item ${activeTab === tab.id ? 'main-shell__nav-item--active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className={`main-shell__header-actions ${mobileMenuOpen ? 'main-shell__header-actions--open' : ''}`}>
            <div className="main-shell__language" role="group" aria-label="Language selection">
              <button
                type="button"
                className={language === 'vn' ? 'main-shell__language--active' : ''}
                onClick={() => onLanguageChange('vn')}
                aria-pressed={language === 'vn'}
              >
                VN
              </button>
              <button
                type="button"
                className={language === 'en' ? 'main-shell__language--active' : ''}
                onClick={() => onLanguageChange('en')}
                aria-pressed={language === 'en'}
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
