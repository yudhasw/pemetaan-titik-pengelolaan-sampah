import React, { useState } from 'react';

export const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`map-legend ${collapsed ? 'legend-collapsed' : ''}`}>
      <div className="legend-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="legend-title">Legenda Peta</span>
        <button
          type="button"
          className="legend-toggle-btn"
          aria-label={collapsed ? 'Buka legenda' : 'Tutup legenda'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <div className="legend-body">
          <div className="legend-section">
            <span className="legend-subtitle">Kondisi / Status Inisiatif:</span>
            <div className="legend-item">
              <span className="legend-marker marker-green"></span>
              <span className="legend-label">Baik (Aktif Beroperasi)</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker marker-orange"></span>
              <span className="legend-label">Penuh (Kapasitas Maksimal)</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker marker-red"></span>
              <span className="legend-label">Perlu Perbaikan / Non-aktif</span>
            </div>
          </div>

          <div className="legend-section">
            <span className="legend-subtitle">Status Penanda:</span>
            <div className="legend-item">
              <span className="legend-marker marker-blue-dashed"></span>
              <span className="legend-label">Titik Baru / Dapat Digeser</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
