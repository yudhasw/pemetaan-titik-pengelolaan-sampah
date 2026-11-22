import React, { useCallback, useState } from 'react';
import { FilterControls } from './components/FilterControls';
import { Header } from './components/Header';
import { LocationForm } from './components/LocationForm';
import { LoginModal } from './components/LoginModal';
import { MapView } from './components/MapView';
import { Toast, ToastMessage } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { useLocations } from './hooks/useLocations';
import {
  CreateLocationDto,
  TrashLocation,
  UpdateLocationDto,
} from './types/location';

import './styles/index.css';
import './styles/components.css';
import './styles/MapView.css';
import './styles/LocationForm.css';

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
    setIsAddingMode(true);
    setEditingLocation(null);
    setIsFormOpen(false);
    addToast('info', 'Silakan klik pada peta di titik lokasi tempat sampah berada.');
  };

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
        onLogout={logout}
        totalLocations={allLocations.length}
      />

      <FilterControls
        filters={filters}
        onChange={setFilters}
        stats={stats}
      />

      <MapView
        locations={locations}
        loading={locationsLoading}
        isAddingMode={isAddingMode}
        tempPosition={tempPosition}
        onMapClick={handleMapClick}
        onTempMarkerDragEnd={handleTempMarkerDragEnd}
        onEditLocation={handleStartEdit}
        onDeleteLocation={handleDeleteLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocating={isLocating}
      />

      {isFormOpen && tempPosition && (
        <LocationForm
          initialData={editingLocation}
          lat={tempPosition[0]}
          lng={tempPosition[1]}
          onSave={handleSaveForm}
          onCancel={handleCancelForm}
          onUseCurrentLocation={handleUseCurrentLocation}
          isLocating={isLocating}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};
export default App;
