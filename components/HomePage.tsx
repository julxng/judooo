import React, { useMemo } from 'react';
import { ArtEvent } from '../types';
import EventCard from './EventCard';

interface HomePageProps {
  events: ArtEvent[];
  featuredEventIds: string[];
  onOpenEvent: (id: string) => void;
  onViewAll: (preset: string) => void;
}

const isCurrent = (e: ArtEvent) => e.endDate >= new Date().toISOString().split('T')[0];

const strip = (s?: string) => (s || '').trim();

const HomePage: React.FC<HomePageProps> = ({ events, featuredEventIds, onOpenEvent, onViewAll }) => {
  const currentEvents = useMemo(() => events.filter(isCurrent), [events]);

  const featured = useMemo(() => {
    const picks = featuredEventIds
      .map((id) => events.find((e) => e.id === id))
      .filter((e): e is ArtEvent => !!e);
    return picks.length > 0 ? picks.slice(0, 5) : currentEvents.slice(0, 5);
  }, [events, featuredEventIds, currentEvents]);

  const lastChance = useMemo(
    () => [...currentEvents].sort((a, b) => a.endDate.localeCompare(b.endDate)).slice(0, 10),
    [currentEvents]
  );

  const newest = useMemo(
    () => [...events].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 10),
    [events]
  );

  const free = useMemo(() => currentEvents.filter((e) => e.is_free).slice(0, 10), [currentEvents]);

  const hot = useMemo(
    () => [...currentEvents].sort((a, b) => (b.saved_count || 0) - (a.saved_count || 0)).slice(0, 10),
    [currentEvents]
  );

  const section = (title: string, items: ArtEvent[], preset: string) => (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
        <button className="text-sm font-semibold text-brand-orange" onClick={() => onViewAll(preset)}>
          View all events
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((event) => (
          <div key={event.id} className="min-w-[320px] max-w-[320px]" onClick={() => onOpenEvent(event.id)}>
            <EventCard event={event} />
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">No events yet.</p>}
      </div>
      <button className="text-sm font-semibold text-brand-black underline" onClick={() => onViewAll(preset)}>
        Xem thêm
      </button>
    </section>
  );

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">Judooo Event Discovery</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((event) => (
            <button
              key={event.id}
              onClick={() => onOpenEvent(event.id)}
              className="relative h-64 md:h-80 overflow-hidden text-left"
            >
              <img src={event.imageUrl} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-xs uppercase tracking-widest">{strip(event.startDate)} - {strip(event.endDate)}</p>
                <p className="text-2xl font-bold">{event.name_vie || event.name_en || event.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {section('Event Sắp hết (Last Chance)', lastChance, 'last-chance')}
      {section('Event Mới (Newly Added)', newest, 'new')}
      {section('Event Free', free, 'free')}
      {section('Event Hot', hot, 'hot')}
    </div>
  );
};

export default HomePage;
