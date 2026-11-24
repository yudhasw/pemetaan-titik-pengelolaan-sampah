import L from 'leaflet';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { GeocodingResult } from '../services/geocoding';
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
  focusPosition?: [number, number] | null;
  searchResultPlace?: GeocodingResult | null;
  onClearSearchResult?: () => void;
  onAddAtPlace?: (lat: number, lng: number, address: string) => void;
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

function createSearchPinIcon(): L.DivIcon {
  const html = `
    <div class="custom-trash-pin pin-search-result" style="--pin-color: #2563eb; --pin-border: #1e40af;">
      <div class="pin-radar"></div>
      <div class="pin-head">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <div class="pin-point"></div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-pin-container',
    html,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  loading,
  isAddingMode,
  tempPosition,
  focusPosition,
  searchResultPlace,
  onClearSearchResult,
  onAddAtPlace,
  onMapClick,
  onTempMarkerDragEnd,
  onEditLocation,
  onDeleteLocation,
  onUseCurrentLocation,
  isLocating,
}) => {
  const tempMarkerIcon = useMemo(() => createTrashPinIcon('temporary'), []);
  const searchPinIcon = useMemo(() => createSearchPinIcon(), []);
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
        center={focusPosition || [DEFAULT_LAT, DEFAULT_LNG]}
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
        {focusPosition && !tempPosition && <FlyToLocation position={focusPosition} />}
        {searchResultPlace && !tempPosition && !focusPosition && (
          <FlyToLocation position={[searchResultPlace.lat, searchResultPlace.lng]} />
        )}

        {/* Search Result Marker (Google Maps place search) */}
        {searchResultPlace && (
          <Marker
            position={[searchResultPlace.lat, searchResultPlace.lng]}
            icon={searchPinIcon}
          >
            <Popup className="search-result-popup" autoPan={true}>
              <div className="search-popup-content">
                <div className="search-popup-badge">📍 Tempat Dicari</div>
                <h4 className="search-popup-title">{searchResultPlace.name}</h4>
                <p className="search-popup-address">
                  {searchResultPlace.address_detail || searchResultPlace.display_name}
                </p>
                <div className="search-popup-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-add-here"
                    onClick={() => {
                      if (onAddAtPlace) {
                        onAddAtPlace(
                          searchResultPlace.lat,
                          searchResultPlace.lng,
                          searchResultPlace.address_detail || searchResultPlace.display_name
                        );
                      }
                    }}
                  >
                    ➕ Tambah Tempat Sampah di Sini
                  </button>
                  {onClearSearchResult && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={onClearSearchResult}
                    >
                      Tutup
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

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
