import React, { useEffect, useState } from 'react';
import {
  CreateLocationDto,
  TrashCondition,
  TrashLocation,
  UpdateLocationDto,
  WasteType,
} from '../types/location';

interface LocationFormProps {
  initialData?: TrashLocation | null;
  lat: number;
  lng: number;
  onSave: (data: CreateLocationDto | UpdateLocationDto) => Promise<void>;
  onCancel: () => void;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
}

const PRESET_OPTIONS: WasteType[] = [
  'Budidaya Maggot',
  'Pengomposan',
  'Bank Sampah',
  'TPS3R',
  'Tempat Sampah Terpilah',
  'Lainnya',
];

export const LocationForm: React.FC<LocationFormProps> = ({
  initialData,
  lat,
  lng,
  onSave,
  onCancel,
  onUseCurrentLocation,
  isLocating = false,
}) => {
  const isEditing = Boolean(initialData);

  // Initialize selected option and custom value
  const initialWasteType = initialData?.waste_type || 'Budidaya Maggot';
  const isPreset = PRESET_OPTIONS.includes(initialWasteType) && initialWasteType !== 'Lainnya';

  const [selectedOption, setSelectedOption] = useState<string>(
    isPreset ? initialWasteType : 'Lainnya'
  );
  const [customValue, setCustomValue] = useState<string>(
    isPreset ? '' : initialWasteType === 'Lainnya' ? '' : initialWasteType
  );

  const [condition, setCondition] = useState<TrashCondition>(
    initialData?.condition || 'Baik'
  );
  const [label, setLabel] = useState(initialData?.label || '');
  const [description, setDescription] = useState(
    initialData?.description || ''
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      const isInitialPreset =
        PRESET_OPTIONS.includes(initialData.waste_type) &&
        initialData.waste_type !== 'Lainnya';

      if (isInitialPreset) {
        setSelectedOption(initialData.waste_type);
        setCustomValue('');
      } else {
        setSelectedOption('Lainnya');
        setCustomValue(initialData.waste_type === 'Lainnya' ? '' : initialData.waste_type);
      }

      setCondition(initialData.condition);
      setLabel(initialData.label || '');
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Coordinate validation
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Koordinat latitude tidak valid (-90 s/d 90).');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Koordinat longitude tidak valid (-180 s/d 180).');
      return;
    }

    // Determine final waste type value
    let finalWasteType = selectedOption;
    if (selectedOption === 'Lainnya') {
      const trimmedCustom = customValue.trim();
      if (!trimmedCustom) {
        setFormError('Silakan isi nama tempat pengelolaan sampah khusus pada kolom yang tersedia.');
        return;
      }
      finalWasteType = trimmedCustom;
    }

    setSaving(true);
    try {
      if (isEditing && initialData) {
        await onSave({
          id: initialData.id,
          latitude: lat,
          longitude: lng,
          waste_type: finalWasteType,
          condition,
          label: label.trim() || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await onSave({
          latitude: lat,
          longitude: lng,
          waste_type: finalWasteType,
          condition,
          label: label.trim() || undefined,
          description: description.trim() || undefined,
        });
      }
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data ke Google Sheets.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="location-form-backdrop">
      <div className="location-form-sheet" role="dialog" aria-modal="true">
        <div className="form-sheet-header">
          <div className="form-sheet-title-group">
            <h2 className="form-sheet-title">
              {isEditing ? 'Perbarui Inisiatif Pengelolaan Sampah' : 'Tambah Inisiatif Pengelolaan Sampah'}
            </h2>
            <p className="form-sheet-subtitle">
              Geser penanda biru pada peta untuk memposisikan titik lokasi secara presisi di Kelurahan Tamansari.
            </p>
          </div>
          <button
            type="button"
            className="form-close-btn"
            onClick={onCancel}
            disabled={saving}
            aria-label="Tutup form"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="location-form">
          {formError && (
            <div className="form-alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Coordinates section */}
          <div className="form-group coordinates-card">
            <div className="coordinates-header">
              <span className="coordinates-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Koordinat Titik Terpilih
              </span>

              {onUseCurrentLocation && (
                <button
                  type="button"
                  className="btn-link btn-use-gps"
                  onClick={onUseCurrentLocation}
                  disabled={saving || isLocating}
                >
                  {isLocating ? 'Mencari GPS...' : '📍 Gunakan Lokasi Saya'}
                </button>
              )}
            </div>

            <div className="coordinates-display">
              <div className="coord-item">
                <span className="coord-label">Latitude:</span>
                <span className="coord-val font-mono">{lat.toFixed(6)}</span>
              </div>
              <div className="coord-item">
                <span className="coord-label">Longitude:</span>
                <span className="coord-val font-mono">{lng.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Tempat Pengelolaan Sampah (Pilihan / Isi Sendiri) */}
          <div className="form-group">
            <label className="form-label" htmlFor="waste-type-select">
              Tempat Pengelolaan Sampah <span className="req">*</span>
            </label>
            <select
              id="waste-type-select"
              className="form-control"
              value={selectedOption}
              onChange={(e) => {
                setSelectedOption(e.target.value);
                if (e.target.value !== 'Lainnya') {
                  setFormError(null);
                }
              }}
              disabled={saving}
              required
            >
              <option value="Budidaya Maggot">Budidaya Maggot (Pengolahan Sampah Organik BSF)</option>
              <option value="Pengomposan">Pengomposan (Kompos Organik / Rumah Kompos)</option>
              <option value="Bank Sampah">Bank Sampah (Pengumpulan & Pemilahan Daur Ulang)</option>
              <option value="TPS3R">TPS3R (Tempat Pengolahan Sampah Terpadu 3R)</option>
              <option value="Tempat Sampah Terpilah">Tempat Sampah Terpilah (Organik & Anorganik)</option>
              <option value="Lainnya">Lainnya (Isi Sendiri...)</option>
            </select>

            {/* Input Tambahan Jika Memilih 'Lainnya' */}
            {selectedOption === 'Lainnya' && (
              <div style={{ marginTop: '0.65rem' }}>
                <label className="form-label" htmlFor="custom-waste-type" style={{ fontSize: '0.8rem' }}>
                  Tuliskan Jenis / Nama Tempat Pengelolaan Sampah: <span className="req">*</span>
                </label>
                <input
                  id="custom-waste-type"
                  type="text"
                  className="form-control"
                  placeholder="Contoh: Lubang Biopori, Olahan Eko-Enzim, Daur Ulang Minyak Jelantah..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  maxLength={100}
                  disabled={saving}
                  autoFocus
                  required
                />
                <span className="form-help">Maksimal 100 karakter.</span>
              </div>
            )}
          </div>

          {/* Kondisi / Status Operasional */}
          <div className="form-group">
            <label className="form-label">
              Kondisi / Status Inisiatif <span className="req">*</span>
            </label>
            <div className="condition-radio-group">
              <label
                className={`condition-radio-card condition-baik ${
                  condition === 'Baik' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="Baik"
                  checked={condition === 'Baik'}
                  onChange={() => setCondition('Baik')}
                  disabled={saving}
                />
                <span className="condition-indicator dot-green"></span>
                <div className="condition-info">
                  <span className="condition-name">Baik / Aktif</span>
                  <span className="condition-desc">Beroperasi lancar dan fasilitas memadai</span>
                </div>
              </label>

              <label
                className={`condition-radio-card condition-penuh ${
                  condition === 'Penuh' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="Penuh"
                  checked={condition === 'Penuh'}
                  onChange={() => setCondition('Penuh')}
                  disabled={saving}
                />
                <span className="condition-indicator dot-orange"></span>
                <div className="condition-info">
                  <span className="condition-name">Penuh / Kapasitas Maksimal</span>
                  <span className="condition-desc">Memerlukan pengangkutan atau perluasan penampungan</span>
                </div>
              </label>

              <label
                className={`condition-radio-card condition-rusak ${
                  condition === 'Rusak' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="Rusak"
                  checked={condition === 'Rusak'}
                  onChange={() => setCondition('Rusak')}
                  disabled={saving}
                />
                <span className="condition-indicator dot-red"></span>
                <div className="condition-info">
                  <span className="condition-name">Rusak / Tidak Aktif</span>
                  <span className="condition-desc">Perlu perbaikan wadah/tempat atau pembinaan ulang</span>
                </div>
              </label>
            </div>
          </div>

          {/* Nama / Label Lokasi */}
          <div className="form-group">
            <label className="form-label" htmlFor="location-label">
              Nama Inisiatif / Label Lokasi (Opsional)
            </label>
            <input
              id="location-label"
              type="text"
              className="form-control"
              placeholder="Contoh: Maggot Center RW 05, Rumah Kompos Tamansari Asri"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
              disabled={saving}
            />
            <span className="form-help">Maksimal 100 karakter.</span>
          </div>

          {/* Keterangan Tambahan */}
          <div className="form-group">
            <label className="form-label" htmlFor="location-description">
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              id="location-description"
              className="form-control"
              placeholder="Contoh: Dikelola KSM RW 05, kapasitas olah 50kg/hari, hasil kompos dibagikan ke warga..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={saving}
            />
            <span className="form-help">Maksimal 500 karakter.</span>
          </div>

          <div className="form-sheet-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border"></span>
                  <span>Menyimpan ke Google Sheets...</span>
                </>
              ) : isEditing ? (
                'Simpan Pembaruan'
              ) : (
                'Simpan Lokasi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
