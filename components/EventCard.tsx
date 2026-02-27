
import React, { useMemo, useState } from 'react';
import { ArtEvent } from '../types';

interface EventCardProps {
  event: ArtEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const imageCandidates = useMemo(() => {
    const mediaImages = (event.media || [])
      .filter((m) => m.type === 'image' && m.url)
      .map((m) => m.url);
    const list = [event.imageUrl, ...mediaImages, 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200'];
    return Array.from(new Set(list.filter(Boolean)));
  }, [event.imageUrl, event.media]);
  const [imageIndex, setImageIndex] = useState(0);
  const activeImage = imageCandidates[imageIndex] || imageCandidates[0];
  const descriptionSnippet = (event.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 170);

  return (
    <div className="group cursor-pointer bg-white border border-slate-200 hover:border-brand-orange/40 hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img 
          src={activeImage}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          onError={() => {
            if (imageIndex < imageCandidates.length - 1) {
              setImageIndex((i) => i + 1);
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="bg-brand-orange text-white text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 font-black shadow">
            {event.event_type || event.category}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
            {event.city || event.location}
          </p>
          <p className="text-[11px] font-semibold">
            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-orange transition-colors">
          {event.name_vie || event.name_en || event.title}
        </h3>
        <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-2">
          {event.organizer}
        </p>
        <p className="text-slate-700 text-sm mt-3 leading-relaxed line-clamp-3 min-h-[64px]">
          {descriptionSnippet || 'No description available yet. Open event for source details.'}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            {event.is_free && <span className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Free</span>}
            {event.is_virtual && <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Virtual</span>}
          </div>
          <span className="text-[11px] font-semibold text-brand-orange">View details →</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
