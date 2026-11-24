import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  CreateLocationDto,
  FilterState,
  TrashLocation,
  UpdateLocationDto,
} from '../types/location';

export function useLocations(enabled: boolean = true) {
  const [locations, setLocations] = useState<TrashLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    wasteType: 'Semua',
    condition: 'Semua',
    searchQuery: '',
  });

  const fetchLocations = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLocations();
      setLocations(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data lokasi tempat sampah.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      fetchLocations();
    }
  }, [enabled, fetchLocations]);

  const addLocation = async (dto: CreateLocationDto): Promise<TrashLocation> => {
    const newLoc = await api.createLocation(dto);
    setLocations((prev) => [newLoc, ...prev]);
    return newLoc;
  };

  const editLocation = async (dto: UpdateLocationDto): Promise<TrashLocation> => {
    const updated = await api.updateLocation(dto);
    setLocations((prev) =>
      prev.map((loc) => (loc.id === updated.id ? updated : loc))
    );
    return updated;
  };

  const removeLocation = async (id: string): Promise<void> => {
    await api.deleteLocation(id);
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (filters.wasteType !== 'Semua' && loc.waste_type !== filters.wasteType) {
        return false;
      }
      if (filters.condition !== 'Semua' && loc.condition !== filters.condition) {
        return false;
      }
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const label = (loc.label || '').toLowerCase();
        const desc = (loc.description || '').toLowerCase();
        const address = (loc.address || '').toLowerCase();
        const wasteType = (loc.waste_type || '').toLowerCase();
        if (
          !label.includes(query) &&
          !desc.includes(query) &&
          !address.includes(query) &&
          !wasteType.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [locations, filters]);

  const stats = useMemo(() => {
    const total = locations.length;
    const baik = locations.filter((l) => l.condition === 'Baik').length;
    const penuh = locations.filter((l) => l.condition === 'Penuh').length;
    const rusak = locations.filter((l) => l.condition === 'Rusak').length;
    return { total, baik, penuh, rusak };
  }, [locations]);

  return {
    locations: filteredLocations,
    allLocations: locations,
    stats,
    loading,
    error,
    filters,
    setFilters,
    fetchLocations,
    addLocation,
    editLocation,
    removeLocation,
  };
}
