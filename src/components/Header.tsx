import React from 'react';

interface HeaderProps {
  onAddClick: () => void;
  isAddingMode: boolean;
  onCancelAdd: () => void;
  onLogout: () => void;
  totalLocations: number;
  activeView: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onAddClick,
  isAddingMode,
  onCancelAdd,
  onLogout,
  totalLocations,
  activeView,
  onViewChange,
}) => {
  return (
    <header className="app-header">
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
          <h1 className="brand-title">Inisiatif Sampah</h1>
          <span className="brand-subtitle">Kel. Tamansari, Bandung Wetan</span>
        </div>
        <div className="brand-badge" title="Total inisiatif terdata">
          {totalLocations}
        </div>
      </div>

      {/* Segmented View Switcher: Peta vs Daftar */}
      <div className="view-toggle-group">
        <button
          type="button"
          className={`view-toggle-btn ${activeView === 'map' ? 'active' : ''}`}
          onClick={() => onViewChange('map')}
          title="Tampilan Peta Interaktif"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <span>Peta</span>
        </button>

        <button
          type="button"
          className={`view-toggle-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => onViewChange('list')}
          title="Tampilan Daftar & Tabel Lokasi"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>Daftar</span>
        </button>
      </div>

      <div className="header-actions">
        {isAddingMode ? (
          <button
            type="button"
            className="btn btn-warning header-btn"
            onClick={onCancelAdd}
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
            <span>Batal</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary header-btn"
            onClick={onAddClick}
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
            <span>Tambah</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn-outline header-btn-logout"
          onClick={onLogout}
          title="Keluar dari akun sistem"
          aria-label="Keluar"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="hide-on-mobile">Keluar</span>
        </button>
      </div>
    </header>
  );
};
