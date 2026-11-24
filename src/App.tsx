import React, { useCallback, useState } from 'react';
import { FilterControls } from './components/FilterControls';
import { Header } from './components/Header';
import { LocationForm } from './components/LocationForm';
import { LocationList } from './components/LocationList';
import { LoginModal } from './components/LoginModal';
import { MapExportModal } from './components/MapExportModal';
import { MapView } from './components/MapView';
import { MenuDrawer } from './components/MenuDrawer';
import { Toast, ToastMessage } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { useLocations } from './hooks/useLocations';
import { GeocodingResult } from './services/geocoding';
import {
  CreateLocationDto,
  TrashLocation,
  UpdateLocationDto,
} from './types/location';

import './styles/index.css';
import './styles/components.css';
import './styles/MapView.css';
import './styles/LocationForm.css';
import './styles/LocationList.css';

export const App: React.FC = () => {
  const { isAuthenticated, loading: authLoading, login, logout } = useAuth();
  const {
    locations,
    allLocations,
    stats,
    loading: locationsLoading,
    filters,
    setFilters,
    addLocation,
    editLocation,
    removeLocation,
  } = useLocations(isAuthenticated === true);

  // Active view: 'map' | 'list'
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');
  const [focusPosition, setFocusPosition] = useState<[number, number] | null>(null);
  const [searchResultPlace, setSearchResultPlace] = useState<GeocodingResult | null>(null);
  const [formInitialAddress, setFormInitialAddress] = useState<string>('');

  // Menu & Export states
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState<boolean>(false);
  const [isMapExportModalOpen, setIsMapExportModalOpen] = useState<boolean>(false);
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);

  // Workflow states
  const [isAddingMode, setIsAddingMode] = useState<boolean>(false);
  const [tempPosition, setTempPosition] = useState<[number, number] | null>(null);
  const [editingLocation, setEditingLocation] = useState<TrashLocation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Geolocation handler
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      addToast('error', 'Browser Anda tidak mendukung fitur Geolocation.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setTempPosition([latitude, longitude]);
        setIsLocating(false);

        // If not already in form mode, open form for this point
        if (!isFormOpen) {
          setIsAddingMode(false);
          setEditingLocation(null);
          setIsFormOpen(true);
        }

        addToast(
          'info',
          `Lokasi GPS terdeteksi: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        );
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Gagal mendeteksi lokasi GPS.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Izin akses lokasi ditolak oleh pengguna/browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Informasi lokasi tidak tersedia saat ini.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Permintaan lokasi melebihi batas waktu (timeout).';
            break;
        }
        addToast('error', errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [addToast, isFormOpen]);

  // Map Click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setTempPosition([lat, lng]);
    setIsAddingMode(false);
    setEditingLocation(null);
    setIsFormOpen(true);
  }, []);

  // Drag End for temporary marker
  const handleTempMarkerDragEnd = useCallback((lat: number, lng: number) => {
    setTempPosition([lat, lng]);
  }, []);

  // Start adding
  const handleStartAdd = () => {
    setActiveView('map');
    setIsAddingMode(true);
    setEditingLocation(null);
    setFormInitialAddress('');
    setIsFormOpen(false);
    addToast('info', 'Silakan klik pada peta di titik lokasi tempat sampah berada.');
  };

  // Google Maps place search selection handler
  const handleSelectPlace = (place: GeocodingResult) => {
    setSearchResultPlace(place);
    setFocusPosition([place.lat, place.lng]);
    setActiveView('map');
    addToast('info', `Menemukan lokasi: ${place.name}`);
  };

  // Select registered waste initiative from search dropdown
  const handleSelectLocation = (loc: TrashLocation) => {
    setFocusPosition([loc.latitude, loc.longitude]);
    setActiveView('map');
    addToast('info', `Menuju inisiatif: ${loc.label || loc.waste_type}`);
  };

  // Add initiative directly at searched place coordinates
  const handleAddAtPlace = (lat: number, lng: number, address: string) => {
    setTempPosition([lat, lng]);
    setFormInitialAddress(address);
    setEditingLocation(null);
    setIsAddingMode(false);
    setIsFormOpen(true);
    setSearchResultPlace(null);
  };

  // View on Map handler from List view
  const handleViewOnMap = (loc: TrashLocation) => {
    setFocusPosition([loc.latitude, loc.longitude]);
    setActiveView('map');
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setFilters({ searchQuery: '', condition: 'Semua', wasteType: 'Semua' });
  };

  // Export CSV Handler
  const handleExportCSV = useCallback(() => {
    if (allLocations.length === 0) {
      addToast('info', 'Belum ada data lokasi untuk diekspor ke CSV.');
      return;
    }
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
    const rows = allLocations.map((loc) => [
      `"${loc.id}"`,
      `"${(loc.label || 'Tanpa Nama').replace(/"/g, '""')}"`,
      `"${(loc.waste_type || '').replace(/"/g, '""')}"`,
      `"${loc.condition}"`,
      `"${(loc.address || '').replace(/"/g, '""')}"`,
      `"${loc.gmaps_url || `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}"`,
      loc.latitude,
      loc.longitude,
      `"${(loc.description || '').replace(/"/g, '""')}"`,
      `"${new Date(loc.updated_at || loc.created_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `inisiatif_sampah_tamansari_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'File CSV berhasil diunduh.');
  }, [allLocations, addToast]);

  // Cancel adding
  const handleCancelAdd = () => {
    setIsAddingMode(false);
    setTempPosition(null);
    setIsFormOpen(false);
  };

  // Start editing
  const handleStartEdit = (loc: TrashLocation) => {
    setEditingLocation(loc);
    setTempPosition([loc.latitude, loc.longitude]);
    setIsAddingMode(false);
    setIsFormOpen(true);
  };

  // Delete location
  const handleDeleteLocation = async (loc: TrashLocation) => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus data tempat sampah "${loc.label || 'Tanpa Label'}"? Data akan diarsipkan secara logis di Google Sheets.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await removeLocation(loc.id);
      addToast('success', 'Lokasi tempat sampah berhasil dihapus dari peta.');
      if (editingLocation?.id === loc.id) {
        setIsFormOpen(false);
        setEditingLocation(null);
        setTempPosition(null);
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Gagal menghapus lokasi tempat sampah.');
    }
  };

  // Form Save
  const handleSaveForm = async (data: CreateLocationDto | UpdateLocationDto) => {
    try {
      if ('id' in data) {
        await editLocation(data);
        addToast('success', 'Data lokasi tempat sampah berhasil diperbarui!');
      } else {
        await addLocation(data);
        addToast('success', 'Lokasi tempat sampah baru berhasil disimpan ke Google Sheets!');
      }
      setIsFormOpen(false);
      setEditingLocation(null);
      setTempPosition(null);
      setIsAddingMode(false);
    } catch (err: any) {
      throw err;
    }
  };

  // Form Cancel
  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
    setTempPosition(null);
    setIsAddingMode(false);
  };

  if (authLoading) {
    return (
      <div className="modal-backdrop">
        <div className="loading-card" style={{ padding: '1.5rem 2rem' }}>
          <div className="spinner-border" style={{ width: '1.5rem', height: '1.5rem' }}></div>
          <span style={{ fontSize: '1rem', fontWeight: 500 }}>
            Memeriksa autentikasi sesi...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated === false && (
        <LoginModal
          onLogin={async (password) => {
            await login(password);
            addToast('success', 'Berhasil masuk ke sistem.');
          }}
        />
      )}

      <Header
        onAddClick={handleStartAdd}
        isAddingMode={isAddingMode}
        onCancelAdd={handleCancelAdd}
        onOpenMenu={() => setIsMenuDrawerOpen(true)}
        totalLocations={allLocations.length}
        activeView={activeView}
        onViewChange={setActiveView}
        hasActiveFilters={Boolean(
          filters.condition !== 'Semua' || filters.wasteType !== 'Semua'
        )}
      />

      {showFilterBar ? (
        <FilterControls
          filters={filters}
          onChange={setFilters}
          stats={stats}
          allLocations={allLocations}
          onSelectPlace={handleSelectPlace}
          onSelectLocation={handleSelectLocation}
        />
      ) : activeView === 'map' ? (
        <div className="floating-quick-search-wrapper">
          <button
            type="button"
            className="btn-floating-quick-search"
            onClick={() => setShowFilterBar(true)}
            title="Buka pencarian lokasi dan filter"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Cari lokasi / aktifkan filter...</span>
          </button>
        </div>
      ) : null}

      {activeView === 'map' ? (
        <MapView
          locations={locations}
          loading={locationsLoading}
          isAddingMode={isAddingMode}
          tempPosition={tempPosition}
          focusPosition={focusPosition}
          searchResultPlace={searchResultPlace}
          onClearSearchResult={() => setSearchResultPlace(null)}
          onAddAtPlace={handleAddAtPlace}
          onMapClick={handleMapClick}
          onTempMarkerDragEnd={handleTempMarkerDragEnd}
          onEditLocation={handleStartEdit}
          onDeleteLocation={handleDeleteLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
          isLocating={isLocating}
        />
      ) : (
        <LocationList
          locations={locations}
          totalAll={allLocations.length}
          loading={locationsLoading}
          onViewOnMap={handleViewOnMap}
          onEdit={handleStartEdit}
          onDelete={handleDeleteLocation}
          onAddClick={handleStartAdd}
          onResetFilters={handleResetFilters}
          isFiltered={Boolean(
            filters.searchQuery ||
            filters.condition !== 'Semua' ||
            filters.wasteType !== 'Semua'
          )}
        />
      )}

      {isFormOpen && tempPosition && (
        <LocationForm
          initialData={editingLocation}
          initialAddress={formInitialAddress}
          lat={tempPosition[0]}
          lng={tempPosition[1]}
          onSave={handleSaveForm}
          onCancel={handleCancelForm}
          onUseCurrentLocation={handleUseCurrentLocation}
          isLocating={isLocating}
        />
      )}

      {/* Slide-in Menu & Settings Drawer */}
      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        stats={stats}
        showFilterBar={showFilterBar}
        onToggleFilterBar={setShowFilterBar}
        onOpenMapExport={() => setIsMapExportModalOpen(true)}
        onExportCSV={handleExportCSV}
        onLogout={logout}
      />

      {/* Cartographic GIS Map Export Modal */}
      <MapExportModal
        isOpen={isMapExportModalOpen}
        onClose={() => setIsMapExportModalOpen(false)}
        locations={allLocations}
        stats={stats}
      />

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};
export default App;
