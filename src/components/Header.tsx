import React from 'react';

interface HeaderProps {
  onAddClick: () => void;
  isAddingMode: boolean;
  onCancelAdd: () => void;
  onOpenMenu: () => void;
  totalLocations: number;
  activeView: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
  hasActiveFilters?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAddClick,
  isAddingMode,
  onCancelAdd,
  onOpenMenu,
  totalLocations,
  activeView,
  onViewChange,
  hasActiveFilters = false,
}) => {
  return (
    <header className="app-header">
      {/* Brand Logo & Title */}
      <div className="header-brand">
        <div className="brand-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a9 9 0 0 0-9 9c0 4.97 9 11 9 11s9-6.03 9-11a9 9 0 0 0-9-9z"></path>
            <circle cx="12" cy="11" r="3"></circle>
          </svg>
        </div>
        <div className="brand-text">
          <h1 className="brand-title">Pemetaan</h1>
          <span className="brand-subtitle hide-on-mobile">Kel. Tamansari, Bandung Wetan</span>
        </div>
        <div className="brand-badge hide-on-mobile" title="Total inisiatif terdata">
          {totalLocations}
        </div>
      </div>

      {/* Segmented View Switcher: Peta vs Daftar (Icon-only di Mobile, Lengkap di Desktop) */}
      <div className="view-toggle-group">
        <button
          type="button"
          className={`view-toggle-btn ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => onViewChange('map')}
          title="Tampilan Peta Interaktif"
          aria-label="Tampilan Peta"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <span className="view-toggle-text hide-on-mobile">Peta</span>
        </button>

        <button
          type="button"
          className={`view-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => onViewChange('list')}
          title="Tampilan Daftar & Tabel Lokasi"
          aria-label="Tampilan Daftar Lokasi"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span className="view-toggle-text hide-on-mobile">Daftar</span>
        </button>
      </div>

      {/* Header Actions: Tombol Tambah (+) & Hamburger Menu (☰) */}
      <div className="header-actions">
        {isAddingMode ? (
          <button
            type="button"
            className="btn btn-warning header-btn btn-add-compact"
            onClick={onCancelAdd}
            title="Batalkan penentuan titik"
            aria-label="Batalkan"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="hide-on-mobile">Batal</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary header-btn btn-add-compact"
            onClick={onAddClick}
            title="Tambah Inisiatif Tempat Sampah Baru"
            aria-label="Tambah Lokasi"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span className="hide-on-mobile">Tambah</span>
          </button>
        )}

        {/* Hamburger Menu Icon (☰) */}
        <button
          type="button"
          className="btn btn-outline header-btn-menu"
          onClick={onOpenMenu}
          title="Menu & Pengaturan"
          aria-label="Buka Menu"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          {hasActiveFilters && (
            <span className="header-menu-badge-dot" title="Filter aktif"></span>
          )}
        </button>
      </div>
    </header>
  );
};
export default Header;
