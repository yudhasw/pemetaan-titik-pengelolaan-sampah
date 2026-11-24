import { describe, expect, it, vi } from 'vitest';
import {
  createLocation,
  getAllLocations,
  rowToTrashLocation,
  softDeleteLocation,
  updateLocation,
} from '../lib/googleSheets';

describe('Google Sheets Logic Unit Tests (with Mocks)', () => {
  const dummyConfig = {
    spreadsheetId: 'test-sheet-id',
    sheetName: 'trash_locations',
    clientEmail: 'test@example.iam.gserviceaccount.com',
    privateKey: 'dummy-key',
  };

  describe('rowToTrashLocation', () => {
    it('correctly maps spreadsheet row array to TrashLocation object', () => {
      const row = [
        'uuid-101',
        '-6.2088',
        '106.8456',
        'Organik',
        'Baik',
        'Taman Menteng',
        'Dekat pintu barat',
        '2026-11-20T08:00:00.000Z',
        '2026-11-20T08:00:00.000Z',
        '', // deleted_at
      ];

      const loc = rowToTrashLocation(row);
      expect(loc).not.toBeNull();
      expect(loc?.id).toBe('uuid-101');
      expect(loc?.latitude).toBe(-6.2088);
      expect(loc?.longitude).toBe(106.8456);
      expect(loc?.waste_type).toBe('Organik');
      expect(loc?.condition).toBe('Baik');
      expect(loc?.label).toBe('Taman Menteng');
      expect(loc?.description).toBe('Dekat pintu barat');
      expect(loc?.deleted_at).toBeUndefined();
    });

    it('returns null for empty rows or rows without ID', () => {
      expect(rowToTrashLocation([])).toBeNull();
      expect(rowToTrashLocation([''])).toBeNull();
    });
  });

  describe('getAllLocations', () => {
    it('returns active records and filters out soft-deleted records', async () => {
      const mockSheets = {
        spreadsheets: {
          values: {
            get: vi.fn().mockResolvedValue({
              data: {
                values: [
                  ['id-1', '-6.1', '106.8', 'Organik', 'Baik', 'A', 'Desc A', '2026-11-20', '2026-11-20', ''],
                  ['id-2', '-6.2', '106.9', 'Anorganik', 'Penuh', 'B', 'Desc B', '2026-11-20', '2026-11-20', '2026-11-21T10:00:00Z'], // Deleted
                  ['id-3', '-6.3', '106.7', 'Campuran', 'Rusak', 'C', 'Desc C', '2026-11-20', '2026-11-20', ''],
                ],
              },
            }),
          },
        },
      } as any;

      const locations = await getAllLocations(mockSheets, dummyConfig);
      expect(locations.length).toBe(2);
      expect(locations[0].id).toBe('id-1');
      expect(locations[1].id).toBe('id-3');
    });

    it('handles empty spreadsheet gracefully', async () => {
      const mockSheets = {
        spreadsheets: {
          values: {
            get: vi.fn().mockResolvedValue({
              data: { values: [] },
            }),
          },
        },
      } as any;

      const locations = await getAllLocations(mockSheets, dummyConfig);
      expect(locations).toEqual([]);
    });
  });

  describe('createLocation', () => {
    it('appends a new row to Google Sheets with RAW input option', async () => {
      const appendMock = vi.fn().mockResolvedValue({ data: {} });
      const mockSheets = {
        spreadsheets: {
          values: {
            append: appendMock,
          },
        },
      } as any;

      const newLoc = await createLocation(
        {
          latitude: -6.2,
          longitude: 106.8,
          waste_type: 'Organik',
          condition: 'Baik',
          label: 'TPS Merdeka',
          description: 'Dekat halte',
        },
        mockSheets,
        dummyConfig
      );

      expect(newLoc.id).toBeDefined();
      expect(newLoc.latitude).toBe(-6.2);
      expect(newLoc.longitude).toBe(106.8);
      expect(appendMock).toHaveBeenCalledTimes(1);

      const appendCall = appendMock.mock.calls[0][0];
      expect(appendCall.valueInputOption).toBe('RAW');
      expect(appendCall.range).toBe("'trash_locations'!A:L");

      const writtenRow = appendCall.requestBody.values[0];
      expect(writtenRow[0]).toBe(newLoc.id);
      expect(writtenRow[1]).toBe('-6.2');
      expect(writtenRow[2]).toBe('106.8');
      expect(writtenRow[3]).toBe('Organik');
      expect(writtenRow[4]).toBe('Baik');
      expect(writtenRow[5]).toBe('TPS Merdeka');
      expect(writtenRow[9]).toBe(''); // deleted_at is empty
      expect(writtenRow[11]).toBe('https://www.google.com/maps?q=-6.2,106.8');
    });
  });

  describe('updateLocation', () => {
    it('updates only the matching row range in Google Sheets', async () => {
      const updateMock = vi.fn().mockResolvedValue({ data: {} });
      const mockSheets = {
        spreadsheets: {
          values: {
            get: vi.fn().mockResolvedValue({
              data: {
                values: [
                  ['id-101', '-6.1', '106.8', 'Organik', 'Baik', 'Old Label', 'Old Desc', '2026-11-20T00:00:00Z', '2026-11-20T00:00:00Z', ''],
                  ['id-102', '-6.2', '106.9', 'Campuran', 'Penuh', 'B', 'Desc', '2026-11-20T00:00:00Z', '2026-11-20T00:00:00Z', ''],
                ],
              },
            }),
            update: updateMock,
          },
        },
      } as any;

      const updated = await updateLocation(
        {
          id: 'id-101',
          condition: 'Rusak',
          label: 'Updated Label',
        },
        mockSheets,
        dummyConfig
      );

      expect(updated.id).toBe('id-101');
      expect(updated.condition).toBe('Rusak');
      expect(updated.label).toBe('Updated Label');

      expect(updateMock).toHaveBeenCalledTimes(1);
      const updateCall = updateMock.mock.calls[0][0];
      // Row 1 is header, id-101 is index 0 -> row 2
      expect(updateCall.range).toBe("'trash_locations'!B2:L2");
      expect(updateCall.valueInputOption).toBe('RAW');
    });

    it('throws error if ID is not found', async () => {
      const mockSheets = {
        spreadsheets: {
          values: {
            get: vi.fn().mockResolvedValue({ data: { values: [] } }),
          },
        },
      } as any;

      await expect(
        updateLocation({ id: 'non-existent-id' }, mockSheets, dummyConfig)
      ).rejects.toThrow('tidak ditemukan');
    });
  });

  describe('softDeleteLocation', () => {
    it('sets deleted_at timestamp in column J of matching row', async () => {
      const updateMock = vi.fn().mockResolvedValue({ data: {} });
      const mockSheets = {
        spreadsheets: {
          values: {
            get: vi.fn().mockResolvedValue({
              data: {
                values: [
                  ['id-target', '-6.1', '106.8', 'Organik', 'Baik', 'A', 'Desc', '2026-11-20', '2026-11-20', ''],
                ],
              },
            }),
            update: updateMock,
          },
        },
      } as any;

      const result = await softDeleteLocation('id-target', mockSheets, dummyConfig);
      expect(result.id).toBe('id-target');
      expect(result.deleted_at).toBeDefined();

      expect(updateMock).toHaveBeenCalledTimes(1);
      const updateCall = updateMock.mock.calls[0][0];
      expect(updateCall.range).toBe("'trash_locations'!J2");
      expect(updateCall.valueInputOption).toBe('RAW');
    });
  });
});
