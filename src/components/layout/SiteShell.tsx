'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type PropsWithChildren } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { branding } from '@/assets/branding';
import { Button } from '@/components/ui';
import { useAuth } from '@/app/providers';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';
import {
  canAccessAdmin,
  getRoleLabel,
  hasCreatorWorkspaceAccess,
} from '@/features/auth/utils/roles';

const shellCopy: Record<
  Locale,
  {
    navigation: {
      marketplace: string;
      events: string;
      routePlanner: string;
      submitEvent: string;
      submitArtwork: string;
      profile: string;
      admin: string;
    };
    footerLinks: {
      about: string;
      terms: string;
      privacy: string;
    };
    search: string;
    signIn: string;
    signUp: string;
    signOut: string;
    browse: string;
    company: string;
    contact: string;
    footerTitle: string;
    footerBody: string;
    openMenu: string;
    closeMenu: string;
    languageLabel: string;
  }
> = {
  en: {
    navigation: {
      marketplace: 'Marketplace',
      events: 'Events',
      routePlanner: 'Route Planner',
      submitEvent: 'Submit Event',
      submitArtwork: 'Submit Artwork',
      profile: 'Profile',
      admin: 'Admin',
    },
    footerLinks: {
      about: 'About Us',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy',
    },
    search: 'Search artists, events, and works',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    browse: 'Browse',
    company: 'Company',
    contact: 'Contact',
    footerTitle: 'Discover works and follow the art calendar across Vietnam.',
    footerBody:
      'Judooo helps people find exhibitions, artworks, and route-ready cultural plans across Vietnam.',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageLabel: 'Language',
  },
  vi: {
    navigation: {
      marketplace: 'Tac pham',
      events: 'Su kien',
      routePlanner: 'Lo trinh',
      submitEvent: 'Dang su kien',
      submitArtwork: 'Dang tac pham',
      profile: 'Ho so',
      admin: 'Quan tri',
    },
    footerLinks: {
      about: 'Ve chung minh',
      terms: 'Dieu khoan',
      privacy: 'Bao mat',
    },
    search: 'Tim nghe si, su kien va tac pham',
    signIn: 'Dang nhap',
    signUp: 'Dang ky',
    signOut: 'Dang xuat',
    browse: 'Kham pha',
    company: 'Judooo',
    contact: 'Lien he',
    footerTitle: 'Kham pha tac pham va theo doi lich nghe thuat tren khap Viet Nam.',
    footerBody:
      'Judooo giup moi nguoi tim thay trien lam, tac pham va lo trinh tham quan nghe thuat de len ke hoach de dang hon.',
    openMenu: 'Mo menu',
    closeMenu: 'Dong menu',
    languageLabel: 'Ngon ngu',
  },
};

const languageOptions: { value: Locale; label: 'EN' | 'VN' }[] = [
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VN' },
];

export const SiteShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, openAuthDialog, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const copy = shellCopy[language];
  const showAdminLink = canAccessAdmin(currentUser?.role);
  const showCreatorLinks = hasCreatorWorkspaceAccess(currentUser?.role);
  const navigation = [
    { href: '/', label: copy.navigation.marketplace },
    { href: '/events', label: copy.navigation.events },
    { href: '/route-planner', label: copy.navigation.routePlanner },
  ];
  const footerLinks = [
    { href: '/about', label: copy.footerLinks.about },
    { href: '/terms', label: copy.footerLinks.terms },
    { href: '/privacy', label: copy.footerLinks.privacy },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/marketplace';
    }

    return pathname === href;
  };

  const creatorLinks = showCreatorLinks
    ? [
        { href: '/submit-event', label: copy.navigation.submitEvent },
        { href: '/submit-artwork', label: copy.navigation.submitArtwork },
        { href: '/profile', label: copy.navigation.profile },
      ]
    : [];

  const utilityLinks = showAdminLink
    ? [...creatorLinks, { href: '/admin', label: copy.navigation.admin }]
    : creatorLinks;

  const allNavItems = [...navigation, ...utilityLinks];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-[120] isolate border-b border-border bg-background">
        <Container size="xl">
          <div className="relative z-[121] flex min-h-[3.5rem] items-center justify-between gap-3 py-2 md:min-h-[4.75rem] md:py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="px-2.5 md:hidden"
                onClick={() => setIsOpen((current) => !current)}
                aria-label={isOpen ? copy.closeMenu : copy.openMenu}
              >
                {isOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>

              <Link
                href="/"
                className="inline-flex h-8 items-center gap-2 sm:h-9 sm:gap-3"
              >
                <img src={branding.icon} alt="Judooo icon" className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
                <img src={branding.logo} alt="Judooo" className="h-4 w-auto object-contain" />
              </Link>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-6 md:flex">
              <Link
                href="/events"
                className="flex h-10 min-w-[16rem] max-w-[25rem] flex-1 items-center gap-3 rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Search size={16} />
                {copy.search}
              </Link>

              <nav className="flex items-center gap-4">
                {allNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'border-b border-transparent pb-1 text-sm transition-colors hover:text-foreground',
                      isActive(item.href) ? 'border-foreground text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div
                className="inline-flex items-center gap-1 rounded-md border border-border p-1"
                aria-label={copy.languageLabel}
              >
                {languageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'rounded-sm px-2.5 py-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground transition-colors',
                      language === option.value ? 'bg-foreground text-background' : 'hover:text-foreground',
                    )}
                    onClick={() => setLanguage(option.value)}
                    aria-pressed={language === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {currentUser ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {getRoleLabel(currentUser.role)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void logout()}>
                    {copy.signOut}
                  </Button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    onClick={openAuthDialog}
                  >
                    {copy.signIn}
                  </button>
                  <Button size="sm" onClick={openAuthDialog}>
                    {copy.signUp}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Container>

        {isOpen ? (
          <div className="relative z-[121] border-t border-border bg-background md:hidden">
            <Container size="xl" className="space-y-4 py-4">
              <Link
                href="/events"
                className="flex h-11 items-center gap-3 rounded-md border border-border px-4 text-sm text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                <Search size={16} />
                {copy.search}
              </Link>

              <nav className="grid gap-3">
                {allNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'text-sm transition-colors',
                      isActive(item.href) ? 'text-foreground' : 'text-muted-foreground',
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {copy.languageLabel}
                </span>
                <div className="inline-flex items-center gap-1 rounded-md border border-border p-1">
                  {languageOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'rounded-sm px-2.5 py-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground transition-colors',
                        language === option.value ? 'bg-foreground text-background' : 'hover:text-foreground',
                      )}
                      onClick={() => setLanguage(option.value)}
                      aria-pressed={language === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-4">
                {currentUser ? (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {getRoleLabel(currentUser.role)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        void logout();
                      }}
                    >
                      {copy.signOut}
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => {
                        setIsOpen(false);
                        openAuthDialog();
                      }}
                    >
                      {copy.signIn}
                    </button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        openAuthDialog();
                      }}
                    >
                      {copy.signUp}
                    </Button>
                  </>
                )}
              </div>
            </Container>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-border bg-background">
        <Container size="xl" className="grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Judooo
            </p>
            <h2 className="max-w-lg font-display text-[1.9rem] leading-[0.96] tracking-[-0.04em] text-foreground">
              {copy.footerTitle}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {copy.footerBody}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {copy.browse}
            </p>
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm text-foreground hover:text-muted-foreground">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {copy.company}
            </p>
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm text-foreground hover:text-muted-foreground">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {copy.contact}
            </p>
            <a href="mailto:judooovietnam@gmail.com" className="block text-sm text-foreground hover:text-muted-foreground">
              judooovietnam@gmail.com
            </a>
            <a href="https://www.instagram.com/judooo.art/" target="_blank" rel="noreferrer" className="block text-sm text-foreground hover:text-muted-foreground">
              Instagram
            </a>
            <a href="https://www.facebook.com/judooo.art" target="_blank" rel="noreferrer" className="block text-sm text-foreground hover:text-muted-foreground">
              Facebook
            </a>
          </div>
        </Container>
      </footer>
    </div>
  );
};
