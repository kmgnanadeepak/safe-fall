import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];

// Default Leaflet marker (fix for Vite/React bundling)
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Red circle for emergency locations
const emergencyIcon = new L.DivIcon({
  className: 'emergency-marker',
  html: '<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createIcon = (isEmergency = false) => (isEmergency ? emergencyIcon : defaultIcon);

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  isEmergency?: boolean;
}

export interface LeafletMapProps {
  /** Center of the map [lat, lng] */
  center: [number, number];
  /** Markers to display; map re-centers when center prop changes */
  markers?: MapMarker[];
  /** Map height (default 450px) */
  height?: number | string;
  /** Zoom level (default 15) */
  zoom?: number;
  /** Optional class name for the container */
  className?: string;
}

/** Updates map view when center changes (used inside MapContainer) */
function MapCenterUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);
  return null;
}

export function LeafletMap({
  center,
  markers = [],
  height = 450,
  zoom = DEFAULT_ZOOM,
  className = '',
}: LeafletMapProps) {
  const centerTuple: [number, number] = useMemo(
    () => [Number(center[0]) || DEFAULT_CENTER[0], Number(center[1]) || DEFAULT_CENTER[1]],
    [center[0], center[1]]
  );

  const style = typeof height === 'number' ? { height: `${height}px` } : { height };

  return (
    <div className={`leaflet-map-wrapper rounded-lg overflow-hidden ${className}`} style={style}>
      <MapContainer
        center={centerTuple}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url={OSM_TILE_URL} />
        <MapCenterUpdater center={centerTuple} zoom={zoom} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={createIcon(m.isEmergency)}
          >
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
