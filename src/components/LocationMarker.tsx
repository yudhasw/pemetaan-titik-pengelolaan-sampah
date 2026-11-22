import L from 'leaflet';
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { TrashLocation } from '../types/location';
import { LocationPopup } from './LocationPopup';

export function createTrashPinIcon(condition: 'Baik' | 'Penuh' | 'Rusak' | 'temporary'): L.DivIcon {
  const colors = {
    Baik: {
      bg: '#10B981',
      border: '#047857',
      label: 'B',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    },
    Penuh: {
      bg: '#F59E0B',
      border: '#B45309',
      label: 'P',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    },
    Rusak: {
      bg: '#EF4444',
      border: '#B91C1C',
      label: 'R',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    },
    temporary: {
      bg: '#2563EB',
      border: '#1D4ED8',
      label: '+',
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    },
  };

  const style = colors[condition] || colors.Baik;
  const isTemp = condition === 'temporary';

  const html = `
    <div class="custom-trash-pin ${isTemp ? 'pin-temporary' : ''}" style="--pin-color: ${style.bg}; --pin-border: ${style.border};">
      ${isTemp ? '<div class="pin-radar"></div>' : ''}
      <div class="pin-head">
        ${style.icon}
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

interface LocationMarkerProps {
  location: TrashLocation;
  onEdit: (location: TrashLocation) => void;
  onDelete: (location: TrashLocation) => void;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onEdit,
  onDelete,
}) => {
  const icon = React.useMemo(() => {
    return createTrashPinIcon(location.condition);
  }, [location.condition]);

  return (
    <Marker position={[location.latitude, location.longitude]} icon={icon}>
      <Popup className="trash-popup-container" maxWidth={320}>
        <LocationPopup
          location={location}
          onEdit={() => onEdit(location)}
          onDelete={() => onDelete(location)}
        />
      </Popup>
    </Marker>
  );
};
