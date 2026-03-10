'use client';

import Link from 'next/link';

const navLinks = [
  { href: '/artists', label: 'Artists' },
  { href: '/artworks', label: 'Artworks' },
  { href: '/events', label: 'Events' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold text-foreground transition-colors hover:text-muted-foreground">
          Judooo
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
