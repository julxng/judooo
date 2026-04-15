import 'leaflet/dist/leaflet.css';
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
  onEventNavigate?: (slug: string) => void;
  /** When provided, switches to hover-card mode: no popup, emits hover coords instead */
  onHoverEvent?: (eventId: string | null, x: number, y: number) => void;
  /** Renders map without the Card shell — use when embedding in a full-screen layout */
  bare?: boolean;
}

// Used in route-planner mode (no sidebar, no hover card)
const buildPopupNode = (
  event: ArtEvent,
  language: 'en' | 'vi',
  onNavigateRef: { current?: ((slug: string) => void) | undefined },
  slug: string,
) => {
  const root = document.createElement('div');
  root.className = 'map-popup';
  if (onNavigateRef.current) {
    root.style.cursor = 'pointer';
    root.addEventListener('click', () => onNavigateRef.current?.(slug));
  }
  const image = document.createElement('img');
  image.src = event.imageUrl;
  image.alt = getEventTitle(event, language);
  root.appendChild(image);
  const body = document.createElement('div');
  const title = document.createElement('h4');
  title.textContent = getEventTitle(event, language);
  const subtitle = document.createElement('p');
  subtitle.textContent = `${event.organizer} • ${getEventLocation(event, language)}`;
  const cta = document.createElement('p');
  cta.className = 'map-popup__cta';
  cta.textContent = 'View details →';
  body.append(title, subtitle, cta);
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
  onEventNavigate,
  onHoverEvent,
  bare = false,
}: EventMapProps) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const onEventNavigateRef = useRef(onEventNavigate);
  const onHoverEventRef = useRef(onHoverEvent);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => { onEventNavigateRef.current = onEventNavigate; }, [onEventNavigate]);
  useEffect(() => { onHoverEventRef.current = onHoverEvent; }, [onHoverEvent]);

  // Effect 1: Initialize Leaflet map once
  useEffect(() => {
    let mounted = true;
    const loadMap = async () => {
      const L = await import('leaflet');
      if (!mounted || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false }).setView([14.5, 108.0], 6);
      mapRef.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const sovereigntyLabel = (latlng: [number, number], name: string, size: 'sm' | 'lg' = 'sm') =>
        L.marker(latlng, {
          icon: L.divIcon({
            className: `judooo-sovereignty-label ${size === 'lg' ? 'judooo-sovereignty-label--lg' : ''}`,
            html: `<span>${name}</span>`,
            iconSize: size === 'lg' ? [160, 28] : [120, 20],
            iconAnchor: size === 'lg' ? [80, 14] : [60, 10],
          }),
          interactive: false,
        }).addTo(map);

      sovereigntyLabel([12.5, 112.0], 'Biển Đông', 'lg');
      sovereigntyLabel([16.5, 112.0], 'Hoàng Sa');
      sovereigntyLabel([8.6, 111.9], 'Trường Sa');

      markerLayerRef.current = L.layerGroup().addTo(map);
      setIsMapReady(true);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!mapRef.current || !leafletRef.current) return;
            const { latitude, longitude } = position.coords;
            const userIcon = leafletRef.current.divIcon({
              className: 'judooo-user-location',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            leafletRef.current.marker([latitude, longitude], { icon: userIcon, interactive: false }).addTo(map);
            map.setView([latitude, longitude], 12, { animate: true });
          },
          () => { /* denied — stay at default view */ },
          { timeout: 8000 },
        );
      }
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
        markersRef.current.clear();
        setIsMapReady(false);
      }
    };
  }, []);

  // Effect 2: Rebuild markers when events/language change (NOT selectedEventId)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!isMapReady || !L || !map || !markerLayer) return;

    markerLayer.clearLayers();
    markersRef.current.clear();
    if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null; }

    const routeColor =
      getComputedStyle(document.documentElement).getPropertyValue('--brand-strong').trim() ||
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

    const geoEvents = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number');
    const hoverMode = typeof onHoverEventRef.current === 'function';

    geoEvents.forEach((event) => {
      const icon = L.divIcon({ className: 'judooo-map-pin', iconSize: [14, 14] });
      const point = L.marker([event.lat, event.lng], { icon }).addTo(markerLayer);

      if (hoverMode) {
        // Directory mode: hover card in parent, click selects in sidebar
        point.on('mouseover', () => {
          const cp = map.latLngToContainerPoint([event.lat as number, event.lng as number]);
          onHoverEventRef.current?.(event.id, cp.x, cp.y);
        });
        point.on('mouseout', () => onHoverEventRef.current?.(null, 0, 0));
      } else {
        // Route-planner mode: show popup on click
        point.bindPopup(
          buildPopupNode(event, language, onEventNavigateRef, event.slug),
          { closeButton: false, className: 'map-popup-wrapper' },
        );
      }

      point.on('click', () => onSelectEvent?.(event.id));
      markersRef.current.set(event.id, point);
    });

    if (routeIds && routeIds.length > 1) {
      const routePoints = routeIds
        .map((id) => events.find((e) => e.id === id))
        .filter((e): e is ArtEvent => Boolean(e))
        .map((e) => [e.lat, e.lng] as [number, number]);
      if (routePoints.length > 1) {
        routeLayerRef.current = L.polyline(routePoints, { color: routeColor, weight: 4, opacity: 0.6, dashArray: '10, 10' }).addTo(map);
        map.fitBounds(routeLayerRef.current.getBounds(), { padding: [32, 32] });
        return;
      }
    }

    if (geoEvents.length > 0) {
      map.fitBounds(L.latLngBounds(geoEvents.map((e) => [e.lat, e.lng])), { padding: [32, 32] });
    }
  }, [events, isMapReady, language, onSelectEvent, routeIds]);

  // Effect 3: Pan to selected marker; open popup only in route-planner mode
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const marker = selectedEventId ? markersRef.current.get(selectedEventId) : null;
    if (!marker) return;
    const hoverMode = typeof onHoverEventRef.current === 'function';
    if (!hoverMode) marker.openPopup();
    mapRef.current.panTo(marker.getLatLng(), { animate: true });
  }, [selectedEventId, isMapReady]);

  const showHeader = !onEventNavigate && !bare;
  const canvas = (
    <div
      ref={containerRef}
      className={bare ? 'h-full w-full' : `event-map__canvas ${!showHeader ? 'event-map__canvas--full' : ''}`}
    />
  );

  if (bare) return canvas;

  return (
    <Card className="event-map">
      {showHeader && (
        <div className="event-map__header">
          <p className="eyebrow">{routeIds?.length ? routeLabel || 'Art Trail' : 'Exhibition Explorer'}</p>
          <p className="muted-text">
            {routeIds?.length
              ? routeDescription || `Navigating ${routeIds.length} saved stops.`
              : `Showing ${events.length} exhibitions across Vietnam.`}
          </p>
        </div>
      )}
      {canvas}
    </Card>
  );
};

export default EventMap;
