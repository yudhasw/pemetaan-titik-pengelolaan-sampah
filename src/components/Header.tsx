import React from 'react';

interface HeaderProps {
  onAddClick: () => void;
  isAddingMode: boolean;
  onCancelAdd: () => void;
  onLogout: () => void;
  totalLocations: number;
}

export const Header: React.FC<HeaderProps> = ({
  onAddClick,
  isAddingMode,
  onCancelAdd,
  onLogout,
  totalLocations,
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
