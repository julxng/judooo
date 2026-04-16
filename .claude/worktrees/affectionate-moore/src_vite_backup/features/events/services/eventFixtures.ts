import type { ArtEvent } from '../types/event.types';
import { shiftIsoDate, todayIso } from '@lib/date';

export const initialEvents: ArtEvent[] = [
  {
    id: 'e1',
    title: 'The Modernist Spirit',
    organizer: 'Galerie Quynh',
    startDate: todayIso(),
    endDate: shiftIsoDate(30),
    location: 'D1, Ho Chi Minh City',
    city: 'Ho Chi Minh City',
    lat: 10.7818,
    lng: 106.6994,
    imageUrl: 'https://images.unsplash.com/photo-1494948141550-256616053995?auto=format&fit=crop&q=80&w=1200',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1200' },
      { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-artist-painting-on-a-canvas-4342-large.mp4' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1518998053502-53cc83e9ce38?auto=format&fit=crop&q=80&w=1200' },
    ],
    description:
      'A survey of Vietnamese modernist painting from 1950 to 1980. This exhibition brings together rare archival lacquer works and private collections to tell the story of a nation in flux.',
    category: 'exhibition',
  },
  {
    id: 'e2',
    title: 'Lacquer & Light',
    organizer: 'Tia-S Gallery',
    startDate: shiftIsoDate(-5),
    endDate: shiftIsoDate(20),
    location: 'Hoan Kiem, Hanoi',
    city: 'Hanoi',
    lat: 21.0285,
    lng: 105.8542,
    imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1200',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1200' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200' },
    ],
    description:
      'Masterworks in traditional son mai by contemporary Hanoi artists. Exploring the interplay between heavy resin and incandescent gold leaf.',
    category: 'exhibition',
    is_free: true,
  },
  {
    id: 'e3',
    title: 'Urban Fragments',
    organizer: 'Sàn Art',
    startDate: todayIso(),
    endDate: shiftIsoDate(15),
    location: 'Binh Thanh, Ho Chi Minh City',
    city: 'Ho Chi Minh City',
    lat: 10.7937,
    lng: 106.7025,
    imageUrl: 'https://images.unsplash.com/photo-1518998053502-53cc83e9ce38?auto=format&fit=crop&q=80&w=1200',
    media: [
      { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-walking-through-a-modern-art-gallery-4458-large.mp4' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1494948141550-256616053995?auto=format&fit=crop&q=80&w=1200' },
    ],
    description:
      'A multi-media exhibition exploring the changing face of Saigon through large-scale sculpture and interactive silk installations.',
    category: 'exhibition',
  },
];
