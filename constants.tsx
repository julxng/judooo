
import { ArtEvent, Artwork } from './types';

const today = new Date();
const pastDate = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const futureDate = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export const INITIAL_EVENTS: ArtEvent[] = [
  {
    id: 'e1',
    title: 'The Modernist Spirit',
    organizer: 'Galerie Quynh',
    startDate: today.toISOString().split('T')[0],
    endDate: futureDate(30),
    location: 'D1, HCMC',
    lat: 10.7818,
    lng: 106.6994,
    imageUrl: 'https://images.unsplash.com/photo-1494948141550-256616053995?auto=format&fit=crop&q=80&w=1200',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=1200' },
      { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-artist-painting-on-a-canvas-4342-large.mp4' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1518998053502-53cc83e9ce38?auto=format&fit=crop&q=80&w=1200' }
    ],
    description: 'A survey of Vietnamese modernist painting from 1950 to 1980. This exhibition brings together rare archival lacquer works and private collections to tell the story of a nation in flux.',
    category: 'exhibition'
  },
  {
    id: 'e2',
    title: 'Lacquer & Light',
    organizer: 'Tia-S Gallery',
    startDate: pastDate(5),
    endDate: futureDate(20),
    location: 'Hoan Kiem, Hanoi',
    lat: 21.0285,
    lng: 105.8542,
    imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=1200',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1200' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200' }
    ],
    description: 'Masterworks in traditional son mai (lacquer) by contemporary Hanoi artists. Exploring the interplay between heavy resin and incandescent gold leaf.',
    category: 'exhibition'
  },
  {
    id: 'e3',
    title: 'Urban Fragments',
    organizer: 'Sàn Art',
    startDate: today.toISOString().split('T')[0],
    endDate: futureDate(15),
    location: 'Binh Thanh, HCMC',
    lat: 10.7937,
    lng: 106.7025,
    imageUrl: 'https://images.unsplash.com/photo-1518998053502-53cc83e9ce38?auto=format&fit=crop&q=80&w=1200',
    media: [
      { type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-walking-through-a-modern-art-gallery-4458-large.mp4' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1494948141550-256616053995?auto=format&fit=crop&q=80&w=1200' }
    ],
    description: 'A multi-media exhibition exploring the changing face of Saigon through large-scale sculpture and interactive silk installations.',
    category: 'exhibition'
  }
];

export const INITIAL_ARTWORKS: Artwork[] = [
  {
    id: 'a1',
    title: 'Neon Saigon #1',
    artist: 'Hoang Le',
    price: 42000000,
    saleType: 'fixed',
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
    medium: 'Lacquer on Board',
    dimensions: '100 x 100 cm',
    description: 'A cyberpunk reinterpretation of District 1 utilizing traditional son mai techniques.',
    available: true,
    eventId: 'e3'
  },
  {
    id: 'a2',
    title: 'Silk Echoes',
    artist: 'Nguyen An',
    price: 12000000,
    currentBid: 14500000,
    bidCount: 7,
    saleType: 'auction',
    endTime: futureDate(2),
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=600',
    medium: 'Pigment on Silk',
    dimensions: '80 x 120 cm',
    description: 'Delicate washes of memory captured on high-grade silk from the northern provinces.',
    available: true,
    eventId: 'e2'
  },
  {
    id: 'a3',
    title: 'Highlands Dusk',
    artist: 'Tran Van Ha',
    price: 85000000,
    saleType: 'fixed',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=600',
    medium: 'Oil on Linen',
    dimensions: '150 x 200 cm',
    description: 'A monumental landscape study of the Central Highlands at the golden hour.',
    available: true,
    eventId: 'e1'
  }
];
