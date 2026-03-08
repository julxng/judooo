import { AppProviders } from '@/app/providers/AppProviders';
import ClientApp from '@/components/ClientApp';

export default function Home() {
  return (
    <AppProviders>
      <ClientApp />
    </AppProviders>
  );
}
