import React from 'react';
import { TrashLocation } from '../types/location';

interface LocationPopupProps {
  location: TrashLocation;
  onEdit: () => void;
  onDelete: () => void;
}

export const LocationPopup: React.FC<LocationPopupProps> = ({
  location,
  onEdit,
  onDelete,
}) => {
  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const conditionBadges = {
    Baik: 'badge-success',
    Penuh: 'badge-warning',
    Rusak: 'badge-danger',
  };

  const conditionLabels = {
    Baik: 'Baik (Aktif)',
    Penuh: 'Penuh (Maksimal)',
    Rusak: 'Perlu Perbaikan',
  };

  return (
    <div className="location-popup">
      <div className="popup-header">
        <h3 className="popup-title">
          {location.label || 'Inisiatif Pengelolaan Sampah'}
        </h3>
        <span
          className={`badge ${conditionBadges[location.condition] || 'badge-default'}`}
        >
          {conditionLabels[location.condition] || location.condition}
        </span>
      </div>

      <div className="popup-body">
        <div className="popup-row">
          <span className="popup-label">Tempat Pengelolaan:</span>
          <span className="popup-value font-medium">{location.waste_type}</span>
        </div>

        <div className="popup-row">
          <span className="popup-label">Koordinat:</span>
          <span className="popup-value font-mono">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </span>
        </div>

        {location.address && (
          <div className="popup-row popup-address-row">
            <span className="popup-label">Alamat:</span>
            <span className="popup-value popup-address-text">{location.address}</span>
          </div>
        )}

        {location.description && (
          <div className="popup-description">
            <span className="popup-label">Keterangan:</span>
            <p className="popup-text">{location.description}</p>
          </div>
        )}

        <div className="popup-gmaps-row">
          <a
            href={
              location.gmaps_url ||
              `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="popup-gmaps-link"
            title="Buka titik koordinat ini di Google Maps"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Buka di Google Maps ↗</span>
          </a>
        </div>

        <div className="popup-meta">
          <span>Diperbarui: {formatDate(location.updated_at || location.created_at)}</span>
        </div>
      </div>

      <div className="popup-actions">
        <button
          type="button"
          className="btn btn-sm btn-outline btn-popup-edit"
          onClick={onEdit}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Edit</span>
        </button>

        <button
          type="button"
          className="btn btn-sm btn-danger btn-popup-delete"
          onClick={onDelete}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};
