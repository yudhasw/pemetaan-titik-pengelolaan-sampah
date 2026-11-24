import React from 'react';
import { TrashLocation } from '../types/location';

interface LocationListProps {
  locations: TrashLocation[];
  totalAll: number;
  loading: boolean;
  onViewOnMap: (location: TrashLocation) => void;
  onEdit: (location: TrashLocation) => void;
  onDelete: (location: TrashLocation) => void;
  onAddClick: () => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const LocationList: React.FC<LocationListProps> = ({
  locations,
  totalAll,
  loading,
  onViewOnMap,
  onEdit,
  onDelete,
  onAddClick,
  onResetFilters,
  isFiltered,
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
    Baik: '🟢 Baik (Aktif)',
    Penuh: '🟠 Penuh (Kapasitas Maks)',
    Rusak: '🔴 Perlu Perbaikan',
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (locations.length === 0) return;

    const headers = [
      'ID',
      'Nama Inisiatif',
      'Tempat Pengelolaan',
      'Kondisi',
      'Alamat Lengkap',
      'Link Google Maps',
      'Latitude',
      'Longitude',
      'Keterangan',
      'Terakhir Diperbarui',
    ];
    const rows = locations.map((loc) => [
      `"${loc.id}"`,
      `"${(loc.label || 'Tanpa Nama').replace(/"/g, '""')}"`,
      `"${(loc.waste_type || '').replace(/"/g, '""')}"`,
      `"${loc.condition}"`,
      `"${(loc.address || '').replace(/"/g, '""')}"`,
      `"${loc.gmaps_url || `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}"`,
      loc.latitude,
      loc.longitude,
      `"${(loc.description || '').replace(/"/g, '""')}"`,
      `"${formatDate(loc.updated_at || loc.created_at)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inisiatif_sampah_tamansari_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="location-list-container">
      {/* List Header Bar */}
      <div className="list-header-bar">
        <div className="list-header-info">
          <h2 className="list-title">Daftar Inisiatif Pengelolaan Sampah</h2>
          <span className="list-subtitle">
            Menampilkan <strong>{locations.length}</strong> dari total <strong>{totalAll}</strong> lokasi terdata di Kelurahan Tamansari
          </span>
        </div>

        <div className="list-header-actions">
          {locations.length > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm btn-export-csv"
              onClick={handleExportCSV}
              title="Unduh data dalam format CSV/Excel"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Ekspor CSV</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm btn-add-from-list"
            onClick={onAddClick}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Tambah Lokasi</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="list-loading-state">
          <div className="spinner-border" style={{ width: '1.75rem', height: '1.75rem', color: 'var(--primary)' }}></div>
          <span>Memuat data inisiatif dari Google Sheets...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && locations.length === 0 && (
        <div className="list-empty-state">
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3>Tidak Ada Lokasi Ditemukan</h3>
            <p>
              {isFiltered
                ? 'Tidak ada inisiatif yang sesuai dengan kata kunci atau filter yang Anda pilih.'
                : 'Belum ada data inisiatif pengelolaan sampah yang terdaftar.'}
            </p>
            <div className="empty-state-actions">
              {isFiltered && (
                <button type="button" className="btn btn-outline btn-sm" onClick={onResetFilters}>
                  Reset Filter
                </button>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={onAddClick}>
                + Tambah Lokasi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Cards Grid */}
      {!loading && locations.length > 0 && (
        <div className="location-cards-grid">
          {locations.map((loc, idx) => (
            <div key={loc.id} className="location-card">
              <div className="card-top">
                <div className="card-index-badge">#{idx + 1}</div>
                <h3 className="card-title" title={loc.label || 'Tanpa Nama'}>
                  {loc.label || 'Inisiatif Pengelolaan Sampah'}
                </h3>
                <span className={`badge ${conditionBadges[loc.condition] || 'badge-default'}`}>
                  {conditionLabels[loc.condition] || loc.condition}
                </span>
              </div>

              <div className="card-body">
                <div className="card-row">
                  <span className="card-label">Tempat Pengelolaan:</span>
                  <span className="card-tag">{loc.waste_type}</span>
                </div>

                <div className="card-row">
                  <span className="card-label">Koordinat:</span>
                  <span className="card-coords font-mono">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </span>
                </div>

                {loc.address && (
                  <div className="card-row card-address-row">
                    <span className="card-label">Alamat:</span>
                    <span className="card-address-text">{loc.address}</span>
                  </div>
                )}

                <div className="card-row card-gmaps-row">
                  <span className="card-label">Google Maps:</span>
                  <a
                    href={
                      loc.gmaps_url ||
                      `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-gmaps-link"
                    title="Buka titik koordinat ini di Google Maps"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    <span>Buka GMaps ↗</span>
                  </a>
                </div>

                {loc.description && (
                  <div className="card-desc-box">
                    <p className="card-desc-text">{loc.description}</p>
                  </div>
                )}

                <div className="card-meta">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Diperbarui: {formatDate(loc.updated_at || loc.created_at)}</span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-outline card-btn-map"
                  onClick={() => onViewOnMap(loc)}
                  title="Lihat posisi titik ini di peta"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                    <line x1="8" y1="2" x2="8" y2="18"></line>
                    <line x1="16" y1="6" x2="16" y2="22"></line>
                  </svg>
                  <span>Lihat di Peta</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline card-btn-edit"
                  onClick={() => onEdit(loc)}
                  title="Ubah data inisiatif ini"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-danger card-btn-delete"
                  onClick={() => onDelete(loc)}
                  title="Hapus inisiatif ini"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
