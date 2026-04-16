import AboutPage from '@/features/about/components/AboutPage';
import { SiteShell } from '@/components/layout/SiteShell';
import { Container } from '@/components/ui/Container';

export default function AboutRoute() {
  return (
    <SiteShell>
      <Container size="xl" className="py-8 sm:py-12">
        <AboutPage />
      </Container>
    </SiteShell>
  );
}
