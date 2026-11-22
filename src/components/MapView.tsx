import L from 'leaflet';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { TrashLocation } from '../types/location';
import { createTrashPinIcon, LocationMarker } from './LocationMarker';
import { MapLegend } from './MapLegend';

// Leaflet CSS needs to be loaded
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  locations: TrashLocation[];
  loading: boolean;
  isAddingMode: boolean;
  tempPosition: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
  onTempMarkerDragEnd: (lat: number, lng: number) => void;
  onEditLocation: (location: TrashLocation) => void;
  onDeleteLocation: (location: TrashLocation) => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

// Default ke Kelurahan Tamansari, Kec. Bandung Wetan, Kota Bandung
const DEFAULT_LAT = Number(import.meta.env.VITE_DEFAULT_MAP_LAT) || -6.8998;
const DEFAULT_LNG = Number(import.meta.env.VITE_DEFAULT_MAP_LNG) || 107.6086;
const DEFAULT_ZOOM = Number(import.meta.env.VITE_DEFAULT_MAP_ZOOM) || 15;

function MapEventsHandler({
  isAddingMode,
  onMapClick,
}: {
  isAddingMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if (isAddingMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    if (isAddingMode) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [isAddingMode, map]);

  return null;
}

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { animate: true, duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  loading,
  isAddingMode,
  tempPosition,
  onMapClick,
  onTempMarkerDragEnd,
  onEditLocation,
  onDeleteLocation,
  onUseCurrentLocation,
  isLocating,
}) => {
  const tempMarkerIcon = useMemo(() => createTrashPinIcon('temporary'), []);
  const tempMarkerRef = useRef<L.Marker | null>(null);

  const handleDragEnd = () => {
    const marker = tempMarkerRef.current;
    if (marker != null) {
      const latLng = marker.getLatLng();
      onTempMarkerDragEnd(latLng.lat, latLng.lng);
    }
  };

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[DEFAULT_LAT, DEFAULT_LNG]}
        zoom={DEFAULT_ZOOM}
        className="leaflet-map-container"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> kontributor'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapEventsHandler
          isAddingMode={isAddingMode}
          onMapClick={onMapClick}
        />

        {tempPosition && <FlyToLocation position={tempPosition} />}

        {/* Saved permanent location markers */}
        {locations.map((loc) => (
          <LocationMarker
            key={loc.id}
            location={loc}
            onEdit={onEditLocation}
            onDelete={onDeleteLocation}
          />
        ))}

        {/* Temporary draggable marker for add / edit */}
        {tempPosition && (
          <Marker
            position={tempPosition}
            icon={tempMarkerIcon}
            draggable={true}
            ref={tempMarkerRef}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          />
        )}
      </MapContainer>

      {/* Adding mode banner: compact, modern pill-style on mobile & desktop */}
      {isAddingMode && (
        <div className="map-banner adding-banner-compact">
          <span className="banner-dot-radar"></span>
          <span className="banner-text-compact">
            Ketuk peta atau GPS untuk tandai titik
          </span>
        </div>
      )}

      {/* Floating GPS button */}
      <div className="map-floating-controls">
        <button
          type="button"
          className={`btn-map-gps ${isLocating ? 'locating' : ''}`}
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          title="Gunakan Lokasi GPS Saya"
          aria-label="Gunakan Lokasi GPS Saya"
        >
          {isLocating ? (
            <span className="spinner-border spinner-sm"></span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
            </svg>
          )}
        </button>
      </div>

      {/* Map Legend */}
      <MapLegend />

      {/* Loading state indicator */}
      {loading && (
        <div className="map-loading-overlay">
          <div className="loading-card">
            <div className="spinner-border"></div>
            <span>Memuat data inisiatif...</span>
          </div>
        </div>
      )}
    </div>
  );
};
