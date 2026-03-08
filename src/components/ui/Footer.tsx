import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <Container className="py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Judooo. Vietnamese art marketplace.
          </p>
          <nav className="flex gap-4">
            <Link href="/artists" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Artists
            </Link>
            <Link href="/artworks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Artworks
            </Link>
            <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
