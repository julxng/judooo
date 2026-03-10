import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import type { ArtEvent } from '../types/event.types';

interface EventMapProps {
  events: ArtEvent[];
  routeIds?: string[];
  routeLabel?: string;
  routeDescription?: string;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
}

const buildPopupNode = (event: ArtEvent) => {
  const root = document.createElement('div');
  root.className = 'map-popup';

  const image = document.createElement('img');
  image.src = event.imageUrl;
  image.alt = event.title;
  root.appendChild(image);

  const body = document.createElement('div');
  const title = document.createElement('h4');
  title.textContent = event.title;
  const subtitle = document.createElement('p');
  subtitle.textContent = `${event.organizer} • ${event.location}`;
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let map: any = null;

    const loadMap = async () => {
      const L = await import('leaflet');
      if (!mounted || !containerRef.current) return;

      map = L.map(containerRef.current, { zoomControl: false }).setView([10.7769, 106.7009], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      const routeColor =
        getComputedStyle(document.documentElement).getPropertyValue('--brand-strong').trim() ||
        getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

      const markerGroup = L.layerGroup().addTo(map);
      events.forEach((event) => {
        const marker = L.divIcon({
          className: `judooo-map-pin ${selectedEventId === event.id ? 'judooo-map-pin--active' : ''}`,
          iconSize: [12, 12],
        });

        const point = L.marker([event.lat, event.lng], { icon: marker })
          .addTo(markerGroup)
          .bindPopup(buildPopupNode(event), { closeButton: false });

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
          const routeLine = L.polyline(routePoints, {
            color: routeColor,
            weight: 4,
            opacity: 0.6,
            dashArray: '10, 10',
          }).addTo(map);
          map.fitBounds(routeLine.getBounds(), { padding: [32, 32] });
          return;
        }
      }

      if (events.length > 0) {
        const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng]));
        map.fitBounds(bounds, { padding: [32, 32] });
      }
    };

    void loadMap();

    return () => {
      mounted = false;
      if (map) {
        map.remove();
      }
    };
  }, [events, onSelectEvent, routeIds, selectedEventId]);

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
