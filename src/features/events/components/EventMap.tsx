import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/app/providers';
import { Card } from '@/components/ui/Card';
import type { ArtEvent } from '../types/event.types';
import { getEventLocation, getEventTitle } from '../utils/event-utils';

interface EventMapProps {
  events: ArtEvent[];
  routeIds?: string[];
  routeLabel?: string;
  routeDescription?: string;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
}

const buildPopupNode = (event: ArtEvent, language: 'en' | 'vi') => {
  const root = document.createElement('div');
  root.className = 'map-popup';

  const image = document.createElement('img');
  image.src = event.imageUrl;
  image.alt = getEventTitle(event, language);
  root.appendChild(image);

  const body = document.createElement('div');
  const title = document.createElement('h4');
  title.textContent = getEventTitle(event, language);
  const subtitle = document.createElement('p');
  subtitle.textContent = `${event.organizer} • ${getEventLocation(event, language)}`;
  body.append(title, subtitle);
  root.appendChild(body);

  return root;
};

const EventMap = ({
  events,
  routeIds,
  routeLabel,
  routeDescription,
  selectedEventId,
  onSelectEvent,
}: EventMapProps) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMap = async () => {
      const L = await import('leaflet');
      if (!mounted || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false }).setView([10.7769, 106.7009], 6);
      mapRef.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      setIsMapReady(true);
    };

    void loadMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerLayerRef.current = null;
        routeLayerRef.current = null;
        leafletRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;

    if (!isMapReady || !L || !map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    const routeColor =
      getComputedStyle(document.documentElement).getPropertyValue('--brand-strong').trim() ||
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

    events.forEach((event) => {
      const marker = L.divIcon({
        className: `judooo-map-pin ${selectedEventId === event.id ? 'judooo-map-pin--active' : ''}`,
        iconSize: [12, 12],
      });

      const point = L.marker([event.lat, event.lng], { icon: marker })
        .addTo(markerLayer)
        .bindPopup(buildPopupNode(event, language), { closeButton: false });

      point.on('click', () => {
        onSelectEvent?.(event.id);
      });
    });

    if (routeIds && routeIds.length > 1) {
      const routePoints = routeIds
        .map((id) => events.find((event) => event.id === id))
        .filter((event): event is ArtEvent => Boolean(event))
        .map((event) => [event.lat, event.lng] as [number, number]);

      if (routePoints.length > 1) {
        routeLayerRef.current = L.polyline(routePoints, {
          color: routeColor,
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 10',
        }).addTo(map);
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [32, 32] });
        return;
      }
    }

    if (events.length > 0) {
      const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng]));
      map.fitBounds(bounds, { padding: [32, 32] });
    }
  }, [events, isMapReady, language, onSelectEvent, routeIds, selectedEventId]);

  return (
    <Card className="event-map">
      <div className="event-map__header">
        <p className="eyebrow">{routeIds?.length ? routeLabel || 'Art Trail' : 'Exhibition Explorer'}</p>
        <p className="muted-text">
          {routeIds?.length
            ? routeDescription || `Navigating ${routeIds.length} saved stops.`
            : `Showing ${events.length} exhibitions across Vietnam.`}
        </p>
      </div>
      <div ref={containerRef} className="event-map__canvas" />
    </Card>
  );
};

export default EventMap;
