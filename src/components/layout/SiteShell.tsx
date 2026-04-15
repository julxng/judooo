'use client';

import { Suspense, useEffect, useRef, useState, type FormEvent, type PropsWithChildren } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { branding } from '@/assets/branding';
import { Button } from '@/components/ui';
import { useAuth } from '@/app/providers';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
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
      saved: string;
      routePlanner: string;
      workspace: string;
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
      saved: 'Saved',
      routePlanner: 'Route Planner',
      workspace: 'Workspace',
      submitEvent: 'Submit Event',
      submitArtwork: 'Submit Artwork',
      profile: 'Profile',
      admin: 'Dashboard',
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
    footerTitle: 'Your local companion to Vietnam\'s artworld.',
    footerBody:
      'Find shows, build a route, and just show up. No more endless scrolling.',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageLabel: 'Language',
  },
  vi: {
    navigation: {
      marketplace: 'Tác phẩm',
      events: 'Sự kiện',
      saved: 'Đã lưu',
      routePlanner: 'Lộ trình',
      workspace: 'Không gian',
      submitEvent: 'Đăng sự kiện',
      submitArtwork: 'Đăng tác phẩm',
      profile: 'Hồ sơ',
      admin: 'Bảng điều khiển',
    },
    footerLinks: {
      about: 'Về chúng mình',
      terms: 'Điều khoản',
      privacy: 'Bảo mật',
    },
    search: 'Tìm nghệ sĩ, sự kiện và tác phẩm',
    signIn: 'Đăng nhập',
    signUp: 'Đăng ký',
    signOut: 'Đăng xuất',
    browse: 'Khám phá',
    company: 'Judooo',
    contact: 'Liên hệ',
    footerTitle: 'Người bạn đồng hành cùng bạn khám phá thế giới nghệ thuật Việt Nam.',
    footerBody:
      'Tìm triển lãm, tìm địa chỉ, và lên lịch đi coi trong một nốt nhạc. Không cần loay hoay tìm kiếm.',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    languageLabel: 'Ngôn ngữ',
  },
};

const languageOptions: { value: Locale; label: 'EN' | 'VN' }[] = [
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VN' },
];

const SearchQuerySync = ({
  pathname,
  onChange,
}: {
  pathname: string;
  onChange: (value: string) => void;
}) => {
  const searchParams = useSearchParams();

  useEffect(() => {
    const searchEnabledRoutes = pathname === '/events' || pathname === '/marketplace' || pathname === '/search';
    onChange(searchEnabledRoutes ? searchParams.get('search') ?? '' : '');
  }, [onChange, pathname, searchParams]);

  return null;
};

export const SiteShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');
  const [isManagementMenuOpen, setIsManagementMenuOpen] = useState(false);
  const { currentUser, openAuthDialog, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const managementMenuRef = useRef<HTMLDivElement | null>(null);
  const copy = shellCopy[language];
  const showAdminLink = canAccessAdmin(currentUser?.role);
  const showCreatorLinks = hasCreatorWorkspaceAccess(currentUser?.role);
  const navigation = [
    { href: '/events', label: copy.navigation.events },
    ...(currentUser
      ? [
          { href: '/saved', label: copy.navigation.saved },
          { href: '/route-planner', label: copy.navigation.routePlanner },
        ]
      : []),
  ];
  const footerLinks = [
    { href: '/about', label: copy.footerLinks.about },
    { href: '/terms', label: copy.footerLinks.terms },
    { href: '/privacy', label: copy.footerLinks.privacy },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const creatorLinks = showCreatorLinks
    ? [
        { href: '/submit-event', label: copy.navigation.submitEvent },
        { href: '/submit-artwork', label: copy.navigation.submitArtwork },
      ]
    : [];

  const managementLinks = showAdminLink
    ? [...creatorLinks, { href: '/admin', label: copy.navigation.admin }]
    : creatorLinks;

  const allNavItems = navigation;
  const managementMenuLabel = showAdminLink ? copy.navigation.admin : copy.navigation.workspace;
  const managementRootHref = showAdminLink ? '/admin' : managementLinks[0]?.href ?? '/profile';
  const isManagementActive = managementLinks.some((item) => isActive(item.href));
  const getSearchHref = (query: string) => {
    const params = new URLSearchParams();
    const normalizedQuery = query.trim();

    if (normalizedQuery) {
      params.set('search', normalizedQuery);
    }

    return params.size ? `/search?${params.toString()}` : '/search';
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (managementMenuRef.current && !managementMenuRef.current.contains(target)) {
        setIsManagementMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    setIsManagementMenuOpen(false);
    setIsOpen(false);
  }, [pathname]);

  const handleDesktopSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsOpen(false);
    router.push(getSearchHref(desktopSearchQuery));
  };

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <SearchQuerySync pathname={pathname} onChange={setDesktopSearchQuery} />
      </Suspense>
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

            <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex lg:gap-6">
              <form
                onSubmit={handleDesktopSearchSubmit}
                className="flex min-w-[18rem] max-w-[26rem] flex-1 items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={desktopSearchQuery}
                    onChange={(event) => setDesktopSearchQuery(event.target.value)}
                    placeholder={copy.search}
                    className="h-9 pl-9"
                  />
                </div>
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>

              <nav className="flex min-w-0 items-center gap-3 lg:gap-4">
                {allNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'whitespace-nowrap border-b border-transparent py-1 text-sm transition-colors hover:text-foreground',
                      isActive(item.href) ? 'border-foreground text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {managementLinks.length ? (
                  <div ref={managementMenuRef} className="relative">
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 whitespace-nowrap border-b border-transparent py-1 text-sm transition-colors hover:text-foreground',
                        isManagementActive || isManagementMenuOpen
                          ? 'border-foreground text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      <Link href={managementRootHref} onClick={() => setIsManagementMenuOpen(false)}>
                        {managementMenuLabel}
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center"
                        onClick={() => setIsManagementMenuOpen((current) => !current)}
                        aria-label={managementMenuLabel}
                        aria-expanded={isManagementMenuOpen}
                      >
                        <ChevronDown
                          size={14}
                          className={cn('transition-transform', isManagementMenuOpen ? 'rotate-180' : '')}
                        />
                      </button>
                    </div>
                    {isManagementMenuOpen ? (
                      <div className="absolute right-0 top-full mt-3 min-w-[12rem] rounded-md border border-border bg-background p-1 shadow-sm">
                        {managementLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-secondary hover:text-foreground',
                              isActive(item.href) ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                            )}
                            onClick={() => setIsManagementMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </nav>
            </div>

            <div className="hidden items-center gap-2 md:flex lg:gap-3">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                aria-label={copy.languageLabel}
                onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              >
                {language === 'en' ? 'VN' : 'EN'}
              </button>

              {currentUser ? (
                <>
                  <Link href="/profile" className="shrink-0 text-right transition-colors hover:text-foreground">
                    <p className="max-w-[10rem] truncate text-sm font-medium text-foreground">{currentUser.name}</p>
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {getRoleLabel(currentUser.role)}
                    </p>
                  </Link>
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
              <form onSubmit={handleDesktopSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={desktopSearchQuery}
                    onChange={(event) => setDesktopSearchQuery(event.target.value)}
                    placeholder={copy.search}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" size="sm">
                  Search
                </Button>
              </form>

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

              {managementLinks.length ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {managementMenuLabel}
                  </p>
                  <div className="grid gap-3">
                    {managementLinks.map((item) => (
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
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {copy.languageLabel}
                </span>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs font-semibold tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                >
                  {language === 'en' ? 'VN' : 'EN'}
                </button>
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-4">
                {currentUser ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <p className="text-sm font-medium text-foreground">{currentUser.name}</p>
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        {getRoleLabel(currentUser.role)}
                      </p>
                    </Link>
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
