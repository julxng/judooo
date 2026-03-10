import { ProfilePage } from '@/features/profile/components/ProfilePage';
import { getInitialEvents } from '@/features/events/api';

export default async function ProfileRoute() {
  const initialEvents = await getInitialEvents();

  return <ProfilePage initialEvents={initialEvents} />;
}
