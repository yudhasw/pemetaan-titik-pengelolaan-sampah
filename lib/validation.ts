import { CreateLocationDto, UpdateLocationDto, WasteType, TrashCondition } from './types';

export const ALLOWED_WASTE_TYPES: WasteType[] = [
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
export const ALLOWED_CONDITIONS: TrashCondition[] = ['Baik', 'Penuh', 'Rusak'];

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export function validateLatitude(lat: unknown): { valid: boolean; value?: number; error?: string } {
  const num = typeof lat === 'number' ? lat : typeof lat === 'string' && lat.trim() !== '' ? Number(lat) : NaN;
  if (isNaN(num)) {
    return { valid: false, error: 'Latitude harus berupa angka valid.' };
  }
  if (num < -90 || num > 90) {
    return { valid: false, error: 'Latitude harus berada dalam rentang -90 hingga 90.' };
  }
  return { valid: true, value: num };
}

export function validateLongitude(lng: unknown): { valid: boolean; value?: number; error?: string } {
  const num = typeof lng === 'number' ? lng : typeof lng === 'string' && lng.trim() !== '' ? Number(lng) : NaN;
  if (isNaN(num)) {
    return { valid: false, error: 'Longitude harus berupa angka valid.' };
  }
  if (num < -180 || num > 180) {
    return { valid: false, error: 'Longitude harus berada dalam rentang -180 hingga 180.' };
  }
  return { valid: true, value: num };
}

export function validateWasteType(type: unknown): { valid: boolean; value?: WasteType; error?: string } {
  if (typeof type !== 'string') {
    return { valid: false, error: 'Tempat pengelolaan sampah harus berupa teks valid.' };
  }
  const trimmed = type.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Tempat pengelolaan sampah tidak boleh kosong.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Nama tempat pengelolaan sampah maksimal 100 karakter.' };
  }
  return { valid: true, value: trimmed };
}

export function validateCondition(condition: unknown): { valid: boolean; value?: TrashCondition; error?: string } {
  if (typeof condition !== 'string' || !ALLOWED_CONDITIONS.includes(condition as TrashCondition)) {
    return { valid: false, error: `Kondisi harus salah satu dari: ${ALLOWED_CONDITIONS.join(', ')}.` };
  }
  return { valid: true, value: condition as TrashCondition };
}

export function sanitizeText(text: unknown, maxLen: number): string | undefined {
  if (text === null || text === undefined) return undefined;
  if (typeof text !== 'string') return String(text).slice(0, maxLen).trim();
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : undefined;
}

export function validateCreateLocation(payload: unknown): ValidationResult<CreateLocationDto> {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: { _general: 'Payload tidak valid.' } };
  }

  const p = payload as Record<string, unknown>;

  const latResult = validateLatitude(p.latitude);
  if (!latResult.valid) {
    errors.latitude = latResult.error!;
  }

  const lngResult = validateLongitude(p.longitude);
  if (!lngResult.valid) {
    errors.longitude = lngResult.error!;
  }

  const wasteResult = validateWasteType(p.waste_type);
  if (!wasteResult.valid) {
    errors.waste_type = wasteResult.error!;
  }

  const condResult = validateCondition(p.condition);
  if (!condResult.valid) {
    errors.condition = condResult.error!;
  }

  const label = sanitizeText(p.label, 100);
  const description = sanitizeText(p.description, 500);

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      latitude: latResult.value!,
      longitude: lngResult.value!,
      waste_type: wasteResult.value!,
      condition: condResult.value!,
      label,
      description,
    },
  };
}

export function validateUpdateLocation(payload: unknown): ValidationResult<UpdateLocationDto> {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: { _general: 'Payload tidak valid.' } };
  }

  const p = payload as Record<string, unknown>;

  if (!p.id || typeof p.id !== 'string' || p.id.trim() === '') {
    errors.id = 'ID lokasi wajib disertakan untuk pembaruan data.';
    return { valid: false, errors };
  }

  const updateData: UpdateLocationDto = {
    id: p.id.trim(),
  };

  if ('latitude' in p && p.latitude !== undefined) {
    const latResult = validateLatitude(p.latitude);
    if (!latResult.valid) {
      errors.latitude = latResult.error!;
    } else {
      updateData.latitude = latResult.value;
    }
  }

  if ('longitude' in p && p.longitude !== undefined) {
    const lngResult = validateLongitude(p.longitude);
    if (!lngResult.valid) {
      errors.longitude = lngResult.error!;
    } else {
      updateData.longitude = lngResult.value;
    }
  }

  if ('waste_type' in p && p.waste_type !== undefined) {
    const wasteResult = validateWasteType(p.waste_type);
    if (!wasteResult.valid) {
      errors.waste_type = wasteResult.error!;
    } else {
      updateData.waste_type = wasteResult.value;
    }
  }

  if ('condition' in p && p.condition !== undefined) {
    const condResult = validateCondition(p.condition);
    if (!condResult.valid) {
      errors.condition = condResult.error!;
    } else {
      updateData.condition = condResult.value;
    }
  }

  if ('label' in p) {
    updateData.label = sanitizeText(p.label, 100) || '';
  }

  if ('description' in p) {
    updateData.description = sanitizeText(p.description, 500) || '';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: updateData,
  };
}
