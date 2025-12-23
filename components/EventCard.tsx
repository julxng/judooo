
import React from 'react';
import { ArtEvent } from '../types';

interface EventCardProps {
  event: ArtEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 mb-5 rounded-sm">
        <img 
          src={event.imageUrl} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 backdrop-blur-sm text-brand-orange text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 font-black border border-brand-orange/20 rounded-sm shadow-sm">
            {event.category}
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-serif font-bold group-hover:text-brand-orange transition-colors leading-snug">{event.title}</h3>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
          {event.organizer} <span className="mx-2 text-slate-200">|</span> {event.location}
        </p>
        <p className="text-slate-500 text-xs mt-3 italic">
          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — 
          {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default EventCard;
