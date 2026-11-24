import React, { useEffect, useRef, useState } from 'react';
import { GeocodingResult, searchPlaces } from '../services/geocoding';
import { FilterState, TrashCondition, TrashLocation, WasteType } from '../types/location';

interface FilterControlsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  stats: {
    total: number;
    baik: number;
    penuh: number;
    rusak: number;
  };
  allLocations?: TrashLocation[];
  onSelectLocation?: (location: TrashLocation) => void;
  onSelectPlace?: (place: GeocodingResult) => void;
}

const WASTE_TYPE_OPTIONS: Array<WasteType | 'Semua'> = [
  'Semua',
  'Budidaya Maggot',
  'Pengomposan',
  'Bank Sampah',
  'TPS3R',
  'Tempat Sampah Terpilah',
  'Lainnya',
];

const CONDITION_OPTIONS: Array<{ value: TrashCondition | 'Semua'; label: string }> = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Baik', label: '🟢 Baik (Aktif)' },
  { value: 'Penuh', label: '🟠 Penuh (Kapasitas Maks)' },
  { value: 'Rusak', label: '🔴 Perlu Perbaikan' },
];

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onChange,
  stats,
  allLocations = [],
  onSelectLocation,
  onSelectPlace,
}) => {
  const isFiltered =
    filters.condition !== 'Semua' ||
    filters.wasteType !== 'Semua' ||
    filters.searchQuery.trim() !== '';

  const [placeResults, setPlaceResults] = useState<GeocodingResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search for places when user types in search bar
  const handleSearchChange = (value: string) => {
    onChange({ ...filters, searchQuery: value });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setPlaceResults([]);
      setIsSearchingPlaces(false);
      return;
    }

    setIsSearchingPlaces(true);
    setIsDropdownOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(trimmed);
        setPlaceResults(results);
      } catch {
        setPlaceResults([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 400);
  };

  // Matched initiatives from local database
  const queryLower = filters.searchQuery.trim().toLowerCase();
  const matchedInitiatives =
    queryLower.length >= 2
      ? allLocations
          .filter((loc) => {
            const name = (loc.label || '').toLowerCase();
            const desc = (loc.description || '').toLowerCase();
            const addr = (loc.address || '').toLowerCase();
            const type = (loc.waste_type || '').toLowerCase();
            return (
              name.includes(queryLower) ||
              desc.includes(queryLower) ||
              addr.includes(queryLower) ||
              type.includes(queryLower)
            );
          })
          .slice(0, 4)
      : [];

  const handlePickLocation = (loc: TrashLocation) => {
    setIsDropdownOpen(false);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  const handlePickPlace = (place: GeocodingResult) => {
    setIsDropdownOpen(false);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchedInitiatives.length > 0) {
        handlePickLocation(matchedInitiatives[0]);
      } else if (placeResults.length > 0) {
        handlePickPlace(placeResults[0]);
      }
    }
  };

  return (
    <div className="filter-controls-container" ref={containerRef}>
      {/* Search Input with Google Maps-style autocomplete */}
      <div className="filter-search-box-wrapper">
        <div className="filter-search-box">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="filter-search-icon"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Cari lokasi, jalan, atau inisiatif (mirip Google Maps)..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (filters.searchQuery.trim().length >= 2) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            className="filter-search-input"
            autoComplete="off"
          />

          {isSearchingPlaces && (
            <span className="search-spinner-inline" title="Mencari alamat..."></span>
          )}

          {filters.searchQuery && (
            <button
              type="button"
              className="filter-search-clear"
              onClick={() => {
                onChange({ ...filters, searchQuery: '' });
                setPlaceResults([]);
                setIsDropdownOpen(false);
              }}
              title="Hapus pencarian"
            >
              &times;
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {isDropdownOpen && (matchedInitiatives.length > 0 || placeResults.length > 0 || isSearchingPlaces) && (
          <div className="search-autocomplete-dropdown">
            {/* 1. Local Initiatives */}
            {matchedInitiatives.length > 0 && (
              <div className="autocomplete-section">
                <div className="autocomplete-section-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a9 9 0 0 0-9 9c0 4.97 9 11 9 11s9-6.03 9-11a9 9 0 0 0-9-9z"></path>
                    <circle cx="12" cy="11" r="3"></circle>
                  </svg>
                  <span>Titik Inisiatif Terdaftar</span>
                </div>
                {matchedInitiatives.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className="autocomplete-item item-initiative"
                    onClick={() => handlePickLocation(loc)}
                  >
                    <div className="autocomplete-item-icon icon-green">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div className="autocomplete-item-content">
                      <div className="autocomplete-item-title">
                        {loc.label || 'Inisiatif Pengelolaan Sampah'}
                        <span className={`badge-mini badge-${loc.condition.toLowerCase()}`}>
                          {loc.condition}
                        </span>
                      </div>
                      <div className="autocomplete-item-sub">
                        {loc.waste_type} {loc.address ? `• ${loc.address}` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Geocoding / Address Results (Google Maps / OpenStreetMap) */}
            {placeResults.length > 0 && (
              <div className="autocomplete-section">
                <div className="autocomplete-section-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span>Hasil Pencarian Alamat & Tempat (OpenStreetMap)</span>
                </div>
                {placeResults.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    className="autocomplete-item item-place"
                    onClick={() => handlePickPlace(place)}
                  >
                    <div className="autocomplete-item-icon icon-blue">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="autocomplete-item-content">
                      <div className="autocomplete-item-title">{place.name}</div>
                      <div className="autocomplete-item-sub">
                        {place.address_detail || place.display_name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Searching indicator */}
            {isSearchingPlaces && placeResults.length === 0 && (
              <div className="autocomplete-loading">
                <span className="spinner-border spinner-sm"></span>
                <span>Mencari alamat dan tempat...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Filters Group */}
      <div className="filter-dropdowns-group">
        {/* Status Dropdown */}
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={filters.condition}
            onChange={(e) =>
              onChange({
                ...filters,
                condition: e.target.value as TrashCondition | 'Semua',
              })
            }
            aria-label="Filter Kondisi Status"
          >
            {CONDITION_OPTIONS.map((c) => {
              const count =
                c.value === 'Semua'
                  ? stats.total
                  : c.value === 'Baik'
                  ? stats.baik
                  : c.value === 'Penuh'
                  ? stats.penuh
                  : stats.rusak;

              return (
                <option key={c.value} value={c.value}>
                  {c.label} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Tempat Pengelolaan Dropdown */}
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={filters.wasteType}
            onChange={(e) =>
              onChange({ ...filters, wasteType: e.target.value as WasteType | 'Semua' })
            }
            aria-label="Filter Tempat Pengelolaan Sampah"
          >
            <option value="Semua">Semua Tempat Pengelolaan</option>
            {WASTE_TYPE_OPTIONS.filter((w) => w !== 'Semua').map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            type="button"
            className="filter-reset-pill"
            onClick={() =>
              onChange({
                condition: 'Semua',
                wasteType: 'Semua',
                searchQuery: '',
              })
            }
            title="Kembalikan semua filter"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
export default FilterControls;
