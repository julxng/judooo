
import React, { useState } from 'react';
import { ArtEvent, Artwork, SaleType, EventMedia, User } from '../types';

interface AdminDashboardProps {
  events: ArtEvent[];
  artworks: Artwork[];
  currentUser: User | null;
  onAddEvent: (event: ArtEvent) => void;
  onAddArtwork: (artwork: Artwork) => void;
  onUploadEvents: (events: ArtEvent[]) => void;
  onUploadArtworks: (artworks: Artwork[]) => void;
  onUpdateEvent: (id: string, event: Partial<ArtEvent>) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ events, artworks, currentUser, onAddEvent, onAddArtwork, onUploadEvents, onUploadArtworks, onUpdateEvent, onUploadImage }) => {
  const [activeForm, setActiveForm] = useState<'none' | 'event' | 'artwork'>('none');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<Partial<ArtEvent>>({
    category: 'exhibition',
    location: 'HCMC',
    lat: 10.7769,
    lng: 106.7009
  });
  const [eventHeroFile, setEventHeroFile] = useState<File | null>(null);

  const [artworkForm, setArtworkForm] = useState<Partial<Artwork>>({
    saleType: 'fixed',
    available: true
  });
  const [artworkHeroFile, setArtworkHeroFile] = useState<File | null>(null);

  const [mediaString, setMediaString] = useState('');

  const parseMedia = (str: string): EventMedia[] => {
    return str.split(',').map(url => {
      const trimmed = url.trim();
      const isVideo = trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.includes('vimeo') || trimmed.includes('youtube') || trimmed.includes('mixkit');
      const mediaItem: EventMedia = {
        type: isVideo ? 'video' : 'image',
        url: trimmed
      };
      return mediaItem;
    }).filter(m => m.url !== '');
  };

  const handleManualEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    let heroUrl = eventForm.imageUrl;
    if (eventHeroFile) {
      const uploaded = await onUploadImage(eventHeroFile);
      if (uploaded) heroUrl = uploaded;
    }
    const base: ArtEvent = {
      ...eventForm as ArtEvent,
      id: editingEventId || 'manual-e-' + Date.now(),
      media: parseMedia(mediaString),
      startDate: eventForm.startDate || new Date().toISOString().split('T')[0],
      endDate: eventForm.endDate || new Date().toISOString().split('T')[0],
      createdBy: currentUser?.id,
      imageUrl: heroUrl || eventForm.imageUrl || '',
    };

    if (editingEventId) {
      onUpdateEvent(editingEventId, base);
    } else {
      onAddEvent(base);
    }
    setActiveForm('none');
    setEditingEventId(null);
    setEventForm({ category: 'exhibition', location: 'HCMC', lat: 10.7769, lng: 106.7009 });
    setMediaString('');
    setEventHeroFile(null);
  };

  const startEdit = (ev: ArtEvent) => {
    setEditingEventId(ev.id);
    setEventForm(ev);
    setMediaString((ev.media || []).map(m => m.url).join(', '));
    setActiveForm('event');
  };

  const handleManualArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    let heroUrl = artworkForm.imageUrl;
    if (artworkHeroFile) {
      const uploaded = await onUploadImage(artworkHeroFile);
      if (uploaded) heroUrl = uploaded;
    }
    const newArtwork: Artwork = {
      ...artworkForm as Artwork,
      id: 'manual-a-' + Date.now(),
      available: true,
      price: Number(artworkForm.price) || 0,
      currentBid: artworkForm.saleType === 'auction' ? Number(artworkForm.price) : undefined,
      bidCount: artworkForm.saleType === 'auction' ? 0 : undefined,
      imageUrl: heroUrl || artworkForm.imageUrl || '',
    };
    onAddArtwork(newArtwork);
    setActiveForm('none');
    setArtworkForm({ saleType: 'fixed', available: true });
    setArtworkHeroFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'events' | 'artworks') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1).filter(r => r.trim() !== '');
      
      if (type === 'events') {
        const newEvents: ArtEvent[] = rows.map((r, i) => {
          const cols = r.split(',').map(c => c.trim());
          return {
            id: `csv-e-${Date.now()}-${i}`,
            title: cols[0] || 'New Event',
            organizer: cols[1] || 'Gallery',
            startDate: cols[2] || new Date().toISOString().split('T')[0],
            endDate: cols[3] || new Date().toISOString().split('T')[0],
            location: cols[4] || 'HCMC',
            lat: parseFloat(cols[5]) || 10.7769,
            lng: parseFloat(cols[6]) || 106.7009,
            imageUrl: cols[7] || 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8',
            media: cols[10] ? parseMedia(cols[10]) : [],
            description: cols[8] || '',
            category: (cols[9] as any) || 'exhibition'
          };
        });
        onUploadEvents(newEvents);
      } else {
        const newArtworks: Artwork[] = rows.map((r, i) => {
          const cols = r.split(',').map(c => c.trim());
          return {
            id: `csv-a-${Date.now()}-${i}`,
            title: cols[0] || 'New Artwork',
            artist: cols[1] || 'Artist',
            price: parseFloat(cols[2]) || 1000000,
            saleType: (cols[3] as SaleType) || 'fixed',
            imageUrl: cols[4] || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
            medium: cols[5] || 'Oil on Canvas',
            dimensions: cols[6] || '50 x 50 cm',
            description: cols[7] || '',
            available: true,
            currentBid: cols[3] === 'auction' ? parseFloat(cols[2]) : undefined,
            bidCount: cols[3] === 'auction' ? 0 : undefined
          };
        });
        onUploadArtworks(newArtworks);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in pb-12">
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => setActiveForm(activeForm === 'event' ? 'none' : 'event')}
          className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeForm === 'event' ? 'bg-brand-orange border-brand-orange text-white' : 'border-brand-black text-brand-black hover:bg-slate-50'}`}
        >
          {editingEventId ? 'Edit Exhibition' : activeForm === 'event' ? 'Cancel Show' : '+ Create Exhibition'}
        </button>
        <button 
          onClick={() => setActiveForm(activeForm === 'artwork' ? 'none' : 'artwork')}
          className={`w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeForm === 'artwork' ? 'bg-brand-orange border-brand-orange text-white' : 'border-brand-black text-brand-black hover:bg-slate-50'}`}
        >
          {activeForm === 'artwork' ? 'Cancel Work' : '+ List Artwork'}
        </button>
      </div>

      {activeForm === 'event' && (
        <form onSubmit={handleManualEvent} className="bg-slate-50 p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in shadow-2xl">
          <div className="space-y-4">
             <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Exhibition Title</label>
             <input required value={eventForm.title || ''} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="Lacquer & Light" />
             
             <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Gallery Name</label>
             <input required value={eventForm.organizer || ''} onChange={e => setEventForm({...eventForm, organizer: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="Tia-S Gallery" />
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Category</label>
                  <select value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value as any})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-[10px] uppercase tracking-widest h-12">
                    <option value="exhibition">Exhibition</option>
                    <option value="auction">Live Sale</option>
                    <option value="workshop">Studio Day</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Hero Image</label>
                  <input type="file" accept="image/*" onChange={e => setEventHeroFile(e.target.files?.[0] || null)} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" />
                  <input value={eventForm.imageUrl || ''} onChange={e => setEventForm({...eventForm, imageUrl: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm mt-2" placeholder="...or paste URL" />
                </div>
             </div>
          </div>
          <div className="space-y-4">
             <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Gallery Assets (Media URLs)</label>
             <input value={mediaString} onChange={e => setMediaString(e.target.value)} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="view1.jpg, view2.mp4" />
             
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Open Date</label>
                  <input type="date" required value={eventForm.startDate || ''} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Close Date</label>
                  <input type="date" required value={eventForm.endDate || ''} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" />
                </div>
             </div>

             <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Statement</label>
             <textarea rows={3} value={eventForm.description || ''} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="Artist's message..." />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="w-full bg-brand-orange text-white py-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-brand-black transition-all">
              {editingEventId ? 'Save Changes' : 'Publish Live'}
            </button>
          </div>
        </form>
      )}

      <div className="border border-slate-200 p-6 md:p-8 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl font-black text-brand-black">Existing Exhibitions</h3>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{events.length} shows</span>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map(ev => (
            <div key={ev.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-brand-black">{ev.title}</p>
                <p className="text-[10px] uppercase text-slate-400 font-black tracking-widest">
                  {ev.organizer} <span className="mx-2 text-slate-200">|</span> {ev.location}
                </p>
              </div>
              <button
                onClick={() => startEdit(ev)}
                className="px-3 py-2 text-[9px] font-black uppercase tracking-widest border border-brand-black text-brand-black hover:bg-brand-orange hover:text-white transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <p className="py-6 text-sm text-slate-400">No exhibitions yet.</p>
          )}
        </div>
      </div>

      {activeForm === 'artwork' && (
        <form onSubmit={handleManualArtwork} className="bg-slate-50 p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in shadow-2xl">
           <div className="space-y-4">
              <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Piece Title</label>
              <input required value={artworkForm.title || ''} onChange={e => setArtworkForm({...artworkForm, title: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="Silent Valley #4" />
              
              <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Artist</label>
              <input required value={artworkForm.artist || ''} onChange={e => setArtworkForm({...artworkForm, artist: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="Dang Xuan Hoa" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Medium</label>
                  <input required value={artworkForm.medium || ''} onChange={e => setArtworkForm({...artworkForm, medium: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="Oil on Silk" />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Size</label>
                  <input required value={artworkForm.dimensions || ''} onChange={e => setArtworkForm({...artworkForm, dimensions: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="120 x 150 cm" />
                </div>
              </div>
           </div>
           <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Sale Type</label>
                   <select value={artworkForm.saleType} onChange={e => setArtworkForm({...artworkForm, saleType: e.target.value as any})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-[10px] uppercase tracking-widest h-12">
                     <option value="fixed">Fixed</option>
                     <option value="auction">Auction</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Value ($)</label>
                   <input type="number" required value={artworkForm.price || ''} onChange={e => setArtworkForm({...artworkForm, price: Number(e.target.value)})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="8500" />
                 </div>
              </div>
              
              <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">High-Res Image</label>
              <input type="file" accept="image/*" onChange={e => setArtworkHeroFile(e.target.files?.[0] || null)} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" />
              <input value={artworkForm.imageUrl || ''} onChange={e => setArtworkForm({...artworkForm, imageUrl: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm mt-2" placeholder="...or paste URL" />

              <label className="block text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Show ID (Link to Event)</label>
              <input value={artworkForm.eventId || ''} onChange={e => setArtworkForm({...artworkForm, eventId: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 outline-none focus:border-brand-orange font-bold text-sm" placeholder="e1" />
           </div>
           <div className="md:col-span-2">
            <button type="submit" className="w-full bg-brand-orange text-white py-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-brand-black transition-all">List Artwork</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-slate-50 p-6 md:p-8 border border-slate-200 border-dashed">
          <h3 className="font-serif text-2xl font-black mb-4 text-brand-black">Bulk Upload: Events</h3>
          <p className="text-[10px] text-slate-400 mb-6 uppercase font-black tracking-widest leading-relaxed">
            CSV Schema: Title, Gallery, Start, End, District, Lat, Lng, HeroURL, Statement, Type, Media
          </p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => handleFileUpload(e, 'events')}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-none file:border-0 file:text-[10px] file:font-black file:bg-brand-black file:text-white hover:file:bg-brand-orange file:cursor-pointer"
          />
        </div>

        <div className="bg-slate-50 p-6 md:p-8 border border-slate-200 border-dashed">
          <h3 className="font-serif text-2xl font-black mb-4 text-brand-black">Bulk Upload: Works</h3>
          <p className="text-[10px] text-slate-400 mb-6 uppercase font-black tracking-widest leading-relaxed">
            CSV Schema: Title, Artist, Price, SaleType, HeroURL, Medium, Size, Narrative
          </p>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => handleFileUpload(e, 'artworks')}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-none file:border-0 file:text-[10px] file:font-black file:bg-brand-black file:text-white hover:file:bg-brand-orange file:cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
