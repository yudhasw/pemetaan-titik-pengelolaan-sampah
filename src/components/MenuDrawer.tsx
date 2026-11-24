import React, { useEffect } from 'react';
import { FilterState, TrashCondition, WasteType } from '../types/location';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  stats: {
    total: number;
    baik: number;
    penuh: number;
    rusak: number;
  };
  showFilterBar: boolean;
  onToggleFilterBar: (show: boolean) => void;
  onOpenMapExport: () => void;
  onExportCSV?: () => void;
  onLogout: () => void;
}

const WASTE_TYPE_OPTIONS: Array<WasteType | 'Semua'> = [
  'Semua',
  'Budidaya Maggot',
  'Pengomposan',
  'Bank Sampah',
  'TPS3R',
  'Tempat Sampah Terpilah',
  'Organik',
  'Anorganik',
  'Campuran',
  'Lainnya',
];

const CONDITION_OPTIONS: Array<{ value: TrashCondition | 'Semua'; label: string; dotClass: string }> = [
  { value: 'Semua', label: 'Semua Status', dotClass: 'dot-gray' },
  { value: 'Baik', label: '🟢 Baik (Aktif)', dotClass: 'dot-green' },
  { value: 'Penuh', label: '🟠 Penuh (Kapasitas Maks)', dotClass: 'dot-orange' },
  { value: 'Rusak', label: '🔴 Perlu Perbaikan', dotClass: 'dot-red' },
];

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  stats,
  showFilterBar,
  onToggleFilterBar,
  onOpenMapExport,
  onExportCSV,
  onLogout,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFiltered =
    filters.condition !== 'Semua' ||
    filters.wasteType !== 'Semua' ||
    filters.searchQuery.trim() !== '';

  const handleResetFilters = () => {
    onFilterChange({
      condition: 'Semua',
      wasteType: 'Semua',
      searchQuery: '',
    });
  };

  const handleConfirmLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      onLogout();
      onClose();
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-title-group">
            <h2 className="drawer-title">Menu & Pengaturan</h2>
            <span className="drawer-subtitle">Kelurahan Tamansari, Bandung Wetan</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            &times;
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {/* Section 1: Filter Inisiatif Sampah */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <span className="drawer-section-title">Filter Inisiatif Sampah</span>
              {isFiltered && (
                <button
                  type="button"
                  className="drawer-btn-reset-filter"
                  onClick={handleResetFilters}
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Status Kondisi */}
            <div className="drawer-field">
              <label className="drawer-field-label">Status Kondisi:</label>
              <div className="drawer-condition-pills">
                {CONDITION_OPTIONS.map((c) => {
                  const count =
                    c.value === 'Semua'
                      ? stats.total
                      : c.value === 'Baik'
                      ? stats.baik
                      : c.value === 'Penuh'
                      ? stats.penuh
                      : stats.rusak;

                  const isSelected = filters.condition === c.value;

                  return (
                    <button
                      key={c.value}
                      type="button"
                      className={`condition-pill-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        onFilterChange({
                          ...filters,
                          condition: c.value,
                        })
                      }
                    >
                      <span>{c.label}</span>
                      <span className="pill-count-badge">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tempat Pengelolaan */}
            <div className="drawer-field">
              <label className="drawer-field-label" htmlFor="drawer-waste-type">
                Tempat Pengelolaan:
              </label>
              <select
                id="drawer-waste-type"
                className="drawer-select"
                value={filters.wasteType}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    wasteType: e.target.value as WasteType | 'Semua',
                  })
                }
              >
                <option value="Semua">Semua Tempat Pengelolaan</option>
                {WASTE_TYPE_OPTIONS.filter((w) => w !== 'Semua').map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Tampilan & Visibilitas Bar Filter */}
          <div className="drawer-section">
            <span className="drawer-section-title">Pengaturan Tampilan Layar</span>
            <div className="drawer-toggle-card">
              <div className="drawer-toggle-info">
                <span className="drawer-toggle-title">
                  Bar Filter di Atas Peta
                </span>
                <span className="drawer-toggle-desc">
                  Tampilkan atau sembunyikan bar pencarian & dropdown di bagian atas layar.
                </span>
              </div>
              <label className="switch-toggle" aria-label="Toggle Bar Filter di Atas Peta">
                <input
                  type="checkbox"
                  checked={showFilterBar}
                  onChange={(e) => onToggleFilterBar(e.target.checked)}
                />
                <span className="slider-round"></span>
              </label>
            </div>
          </div>

          {/* Section 3: Alat Kartografi & Ekspor */}
          <div className="drawer-section">
            <span className="drawer-section-title">Alat & Ekspor Peta</span>

            <button
              type="button"
              className="drawer-action-btn btn-export-map-card"
              onClick={() => {
                onClose();
                onOpenMapExport();
              }}
            >
              <div className="drawer-action-icon icon-gis">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              </div>
              <div className="drawer-action-text">
                <span className="drawer-action-title">
                  Ekspor Foto Peta Kartografis
                </span>
                <span className="drawer-action-desc">
                  Cetak / download layout peta formal GIS kawasan Tamansari (.PNG HD)
                </span>
              </div>
            </button>

            {onExportCSV && (
              <button
                type="button"
                className="drawer-action-btn btn-export-csv-card"
                onClick={() => {
                  onExportCSV();
                  onClose();
                }}
              >
                <div className="drawer-action-icon icon-csv">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <div className="drawer-action-text">
                  <span className="drawer-action-title">Unduh Data Spreadsheet (CSV)</span>
                  <span className="drawer-action-desc">
                    Tabel data lengkap dengan alamat & link Google Maps
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Section 4: Akun & Sesi */}
          <div className="drawer-section drawer-section-account">
            <span className="drawer-section-title">Akun & Sesi</span>
            <div className="drawer-account-box">
              <div className="account-status-badge">
                <span className="status-dot-active"></span>
                <span>Admin Sesi Aktif</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-logout-drawer"
                onClick={handleConfirmLogout}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Keluar dari Sistem</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MenuDrawer;
