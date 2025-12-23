
import React, { useEffect, useState } from 'react';
import { ArtEvent } from '../types';
import L from 'leaflet';

interface MapViewProps {
  events: ArtEvent[];
  routeIds?: string[];
}

const MapView: React.FC<MapViewProps> = ({ events, routeIds }) => {
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    const initialMap = L.map('art-map', {
        zoomControl: false
    }).setView([10.7769, 106.7009], 13); // Default to HCMC

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO'
    }).addTo(initialMap);

    L.control.zoom({ position: 'bottomright' }).addTo(initialMap);
    setMap(initialMap);

    return () => {
      initialMap.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    const markerGroup = L.layerGroup().addTo(map);

    events.forEach(event => {
      const marker = L.divIcon({
        className: 'judooo-map-pin',
        iconSize: [12, 12]
      });

      L.marker([event.lat, event.lng], { icon: marker })
        .addTo(markerGroup)
        .bindPopup(`
          <div class="p-0 min-w-[200px] overflow-hidden rounded-none border-0">
            <img src="${event.imageUrl}" class="w-full h-32 object-cover" />
            <div class="p-3">
              <h4 class="font-serif font-bold text-base leading-tight">${event.title}</h4>
              <p class="text-[9px] text-slate-400 mt-2 uppercase font-black tracking-widest">${event.organizer}</p>
              <p class="text-[9px] text-brand-orange mt-1 uppercase font-black tracking-widest">${event.location}</p>
            </div>
          </div>
        `, { closeButton: false, className: 'judooo-popup' });
    });

    // Draw route if IDs provided
    let routeLine: L.Polyline | null = null;
    if (routeIds && routeIds.length > 0) {
      const routePoints = routeIds
        .map(id => events.find(e => e.id === id))
        .filter((e): e is ArtEvent => !!e)
        .map(e => [e.lat, e.lng] as [number, number]);

      if (routePoints.length > 1) {
        routeLine = L.polyline(routePoints, {
          color: '#F14C23',
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 10'
        }).addTo(map);
        
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      }
    }

    return () => {
      map.removeLayer(markerGroup);
      if (routeLine) map.removeLayer(routeLine);
    };
  }, [map, events, routeIds]);

  return (
    <div className="relative w-full h-[650px] bg-slate-50 border border-slate-100 overflow-hidden">
        <div id="art-map" className="w-full h-full"></div>
        <div className="absolute top-6 left-6 z-[1000] bg-white p-5 shadow-2xl border border-slate-100 max-w-xs">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-2 text-brand-orange">
              {routeIds ? 'Art Trail' : 'Exhibition Explorer'}
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
              {routeIds ? `Navigating ${routeIds.length} gallery stops.` : `Showing ${events.length} exhibitions across Vietnam.`}
            </p>
        </div>
    </div>
  );
};

export default MapView;
