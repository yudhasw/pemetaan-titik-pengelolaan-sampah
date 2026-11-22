import { describe, expect, it } from 'vitest';
import {
  validateCondition,
  validateCreateLocation,
  validateLatitude,
  validateLongitude,
  validateUpdateLocation,
  validateWasteType,
} from '../lib/validation';

describe('Validation Unit Tests', () => {
  describe('validateLatitude', () => {
    it('accepts valid latitudes between -90 and 90', () => {
      expect(validateLatitude(-6.2088).valid).toBe(true);
      expect(validateLatitude(0).valid).toBe(true);
      expect(validateLatitude(90).valid).toBe(true);
      expect(validateLatitude(-90).valid).toBe(true);
      expect(validateLatitude('-6.1754').valid).toBe(true);
    });

    it('rejects latitudes outside -90 and 90', () => {
      expect(validateLatitude(-90.1).valid).toBe(false);
      expect(validateLatitude(90.0001).valid).toBe(false);
      expect(validateLatitude(120).valid).toBe(false);
    });

    it('rejects non-numeric values', () => {
      expect(validateLatitude('abc').valid).toBe(false);
      expect(validateLatitude(null).valid).toBe(false);
      expect(validateLatitude(undefined).valid).toBe(false);
      expect(validateLatitude(NaN).valid).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('accepts valid longitudes between -180 and 180', () => {
      expect(validateLongitude(106.8456).valid).toBe(true);
      expect(validateLongitude(0).valid).toBe(true);
      expect(validateLongitude(180).valid).toBe(true);
      expect(validateLongitude(-180).valid).toBe(true);
      expect(validateLongitude('107.6098').valid).toBe(true);
    });

    it('rejects longitudes outside -180 and 180', () => {
      expect(validateLongitude(-180.001).valid).toBe(false);
      expect(validateLongitude(180.5).valid).toBe(false);
      expect(validateLongitude(200).valid).toBe(false);
    });

    it('rejects non-numeric longitudes', () => {
      expect(validateLongitude('invalid').valid).toBe(false);
      expect(validateLongitude('').valid).toBe(false);
    });
  });

  describe('validateWasteType', () => {
    it('accepts preset and custom waste types', () => {
      expect(validateWasteType('Budidaya Maggot').valid).toBe(true);
      expect(validateWasteType('Pengomposan').valid).toBe(true);
      expect(validateWasteType('Bank Sampah').valid).toBe(true);
      expect(validateWasteType('TPS3R').valid).toBe(true);
      expect(validateWasteType('Biopori Komunal RW 03').valid).toBe(true);
      expect(validateWasteType('Olahan Eko-Enzim').valid).toBe(true);
    });

    it('rejects invalid waste types (empty, non-string, or too long)', () => {
      expect(validateWasteType('').valid).toBe(false);
      expect(validateWasteType('   ').valid).toBe(false);
      expect(validateWasteType(null).valid).toBe(false);
      expect(validateWasteType(123).valid).toBe(false);
      expect(validateWasteType('A'.repeat(101)).valid).toBe(false);
    });
  });

  describe('validateCondition', () => {
    it('accepts allowed conditions', () => {
      expect(validateCondition('Baik').valid).toBe(true);
      expect(validateCondition('Penuh').valid).toBe(true);
      expect(validateCondition('Rusak').valid).toBe(true);
    });

    it('rejects disallowed conditions', () => {
      expect(validateCondition('Sedang').valid).toBe(false);
      expect(validateCondition('baik').valid).toBe(false);
      expect(validateCondition(null).valid).toBe(false);
    });
  });

  describe('validateCreateLocation', () => {
    it('succeeds with valid payload', () => {
      const payload = {
        latitude: -6.2,
        longitude: 106.81,
        waste_type: 'Organik',
        condition: 'Baik',
        label: 'Tong Sampah Taman',
        description: 'Dekat gazebo utara',
      };

      const result = validateCreateLocation(payload);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.latitude).toBe(-6.2);
      expect(result.data?.longitude).toBe(106.81);
      expect(result.data?.waste_type).toBe('Organik');
      expect(result.data?.condition).toBe('Baik');
      expect(result.data?.label).toBe('Tong Sampah Taman');
      expect(result.data?.description).toBe('Dekat gazebo utara');
    });

    it('returns errors when required fields are missing or invalid', () => {
      const payload = {
        latitude: 'not-a-number',
        waste_type: '',
      };

      const result = validateCreateLocation(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.latitude).toBeDefined();
      expect(result.errors.longitude).toBeDefined();
      expect(result.errors.waste_type).toBeDefined();
      expect(result.errors.condition).toBeDefined();
    });

    it('trims and enforces max lengths on text fields', () => {
      const longLabel = 'A'.repeat(150);
      const longDesc = 'B'.repeat(600);
      const payload = {
        latitude: -6.2,
        longitude: 106.81,
        waste_type: 'Campuran',
        condition: 'Penuh',
        label: `   ${longLabel}   `,
        description: `   ${longDesc}   `,
      };

      const result = validateCreateLocation(payload);
      expect(result.valid).toBe(true);
      expect(result.data?.label?.length).toBe(100);
      expect(result.data?.description?.length).toBe(500);
    });
  });

  describe('validateUpdateLocation', () => {
    it('fails if id is missing', () => {
      const result = validateUpdateLocation({
        condition: 'Rusak',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.id).toBeDefined();
    });

    it('succeeds with valid partial update', () => {
      const result = validateUpdateLocation({
        id: 'test-uuid-1234',
        condition: 'Rusak',
        label: 'Tong Baru Diperbaiki',
      });
      expect(result.valid).toBe(true);
      expect(result.data?.id).toBe('test-uuid-1234');
      expect(result.data?.condition).toBe('Rusak');
      expect(result.data?.label).toBe('Tong Baru Diperbaiki');
    });
  });
});
