import React from 'react';
import { FilterState, TrashCondition, WasteType } from '../types/location';

interface FilterControlsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  stats: {
    total: number;
    baik: number;
    penuh: number;
    rusak: number;
  };
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
}) => {
  const isFiltered =
    filters.condition !== 'Semua' ||
    filters.wasteType !== 'Semua' ||
    filters.searchQuery.trim() !== '';

  return (
    <div className="filter-controls-container">
      {/* Search Input */}
      <div className="filter-search-box">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Cari inisiatif / lokasi..."
          value={filters.searchQuery}
          onChange={(e) =>
            onChange({ ...filters, searchQuery: e.target.value })
          }
          className="filter-search-input"
        />
        {filters.searchQuery && (
          <button
            type="button"
            className="filter-search-clear"
            onClick={() => onChange({ ...filters, searchQuery: '' })}
            title="Hapus pencarian"
          >
            &times;
          </button>
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
