import crypto from 'crypto';
import { google, sheets_v4 } from 'googleapis';
import { CreateLocationDto, TrashLocation, UpdateLocationDto } from './types.js';

export const SHEET_COLUMNS = [
  'id',
  'latitude',
  'longitude',
  'waste_type',
  'condition',
  'label',
  'description',
  'created_at',
  'updated_at',
  'deleted_at',
] as const;

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  clientEmail: string;
  privateKey: string;
}

export function getGoogleSheetsConfig(override?: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
  const spreadsheetId = override?.spreadsheetId || process.env.GOOGLE_SHEET_ID;
  const sheetName = override?.sheetName || process.env.GOOGLE_SHEET_NAME || 'trash_locations';
  const clientEmail = override?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = override?.privateKey || process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID belum dikonfigurasi pada environment variables.');
  }
  if (!clientEmail) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL belum dikonfigurasi pada environment variables.');
  }
  if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY belum dikonfigurasi pada environment variables.');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  return {
    spreadsheetId,
    sheetName,
    clientEmail,
    privateKey,
  };
}

let cachedSheetsClient: sheets_v4.Sheets | null = null;

export function getGoogleSheetsClient(customConfig?: GoogleSheetsConfig): sheets_v4.Sheets {
  if (cachedSheetsClient && !customConfig) {
    return cachedSheetsClient;
  }

  const config = customConfig || getGoogleSheetsConfig();
  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = google.sheets({ version: 'v4', auth });
  if (!customConfig) {
    cachedSheetsClient = client;
  }
  return client;
}

export function setMockSheetsClient(client: sheets_v4.Sheets | null): void {
  cachedSheetsClient = client;
}

export async function ensureSheetAndHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  try {
    if (sheets.spreadsheets?.get) {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetList = meta.data?.sheets || [];
      const targetSheet = sheetList.find(
        (s) => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
      );

      if (!targetSheet) {
        const firstSheet = sheetList[0];
        const firstTitle = firstSheet?.properties?.title || '';
        const isDefaultTab =
          sheetList.length === 1 &&
          /^(Sheet\s*1|Lembar\s*1)$/i.test(firstTitle);

        if (isDefaultTab && firstSheet?.properties?.sheetId !== undefined && sheets.spreadsheets?.batchUpdate) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  updateSheetProperties: {
                    properties: {
                      sheetId: firstSheet.properties.sheetId,
                      title: sheetName,
                    },
                    fields: 'title',
                  },
                },
              ],
            },
          });
        } else if (sheets.spreadsheets?.batchUpdate) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: sheetName,
                    },
                  },
                },
              ],
            },
          });
        }
      }
    }

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:J1`,
    });

    const headers = headerRes.data?.values?.[0];
    if (!headers || headers.length === 0 || !headers[0]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [Array.from(SHEET_COLUMNS)],
        },
      });
    }
  } catch (err: any) {
    console.warn('[GoogleSheets] ensureSheetAndHeaders info:', err?.message || err);
  }
}

export function rowToTrashLocation(row: any[]): TrashLocation | null {
  if (!row || row.length === 0) return null;

  const id = String(row[0] || '').trim();
  if (!id) return null;

  const latNum = Number(row[1]);
  const lngNum = Number(row[2]);

  return {
    id,
    latitude: isNaN(latNum) ? 0 : latNum,
    longitude: isNaN(lngNum) ? 0 : lngNum,
    waste_type: (row[3] || 'Budidaya Maggot') as any,
    condition: (row[4] || 'Baik') as any,
    label: row[5] ? String(row[5]) : undefined,
    description: row[6] ? String(row[6]) : undefined,
    created_at: String(row[7] || ''),
    updated_at: String(row[8] || ''),
    deleted_at: row[9] ? String(row[9]) : undefined,
  };
}

export async function getAllLocations(
  sheetsClient?: sheets_v4.Sheets,
  configOverride?: Partial<GoogleSheetsConfig>
): Promise<TrashLocation[]> {
  const config = getGoogleSheetsConfig(configOverride);
  const sheets = sheetsClient || getGoogleSheetsClient();

  let rows: any[] = [];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `'${config.sheetName}'!A2:J`,
    });
    rows = response.data.values || [];
  } catch (err: any) {
    if (err?.message?.includes('Unable to parse range') || err?.status === 400) {
      await ensureSheetAndHeaders(sheets, config.spreadsheetId, config.sheetName);
      try {
        const retryRes = await sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: `'${config.sheetName}'!A2:J`,
        });
        rows = retryRes.data.values || [];
      } catch {
        return [];
      }
    } else {
      throw err;
    }
  }

  const locations: TrashLocation[] = [];
  for (const row of rows) {
    const loc = rowToTrashLocation(row);
    if (!loc) continue;

    if (loc.deleted_at && loc.deleted_at.trim() !== '') {
      continue;
    }

    locations.push(loc);
  }

  return locations;
}

export async function createLocation(
  dto: CreateLocationDto,
  sheetsClient?: sheets_v4.Sheets,
  configOverride?: Partial<GoogleSheetsConfig>
): Promise<TrashLocation> {
  const config = getGoogleSheetsConfig(configOverride);
  const sheets = sheetsClient || getGoogleSheetsClient();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newRow = [
    id,
    dto.latitude.toString(),
    dto.longitude.toString(),
    dto.waste_type,
    dto.condition,
    dto.label || '',
    dto.description || '',
    now,
    now,
    '',
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `'${config.sheetName}'!A:J`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });
  } catch (err: any) {
    if (err?.message?.includes('Unable to parse range') || err?.status === 400) {
      await ensureSheetAndHeaders(sheets, config.spreadsheetId, config.sheetName);
      await sheets.spreadsheets.values.append({
        spreadsheetId: config.spreadsheetId,
        range: `'${config.sheetName}'!A:J`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow],
        },
      });
    } else {
      throw err;
    }
  }

  return {
    id,
    latitude: dto.latitude,
    longitude: dto.longitude,
    waste_type: dto.waste_type,
    condition: dto.condition,
    label: dto.label || undefined,
    description: dto.description || undefined,
    created_at: now,
    updated_at: now,
  };
}

export async function updateLocation(
  dto: UpdateLocationDto,
  sheetsClient?: sheets_v4.Sheets,
  configOverride?: Partial<GoogleSheetsConfig>
): Promise<TrashLocation> {
  const config = getGoogleSheetsConfig(configOverride);
  const sheets = sheetsClient || getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `'${config.sheetName}'!A2:J`,
  });

  const rows = response.data.values || [];
  let targetRowIndex = -1;
  let existingRow: any[] | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === dto.id) {
      if (row[9] && String(row[9]).trim() !== '') {
        throw new Error(`Data inisiatif dengan ID ${dto.id} telah dihapus.`);
      }
      targetRowIndex = i + 2;
      existingRow = row;
      break;
    }
  }

  if (targetRowIndex === -1 || !existingRow) {
    throw new Error(`Data inisiatif dengan ID ${dto.id} tidak ditemukan.`);
  }

  const existingLoc = rowToTrashLocation(existingRow);
  if (!existingLoc) {
    throw new Error(`Gagal memuat data inisiatif eksisting untuk ID ${dto.id}.`);
  }

  const now = new Date().toISOString();

  const updatedLat = dto.latitude !== undefined ? dto.latitude : existingLoc.latitude;
  const updatedLng = dto.longitude !== undefined ? dto.longitude : existingLoc.longitude;
  const updatedWasteType = dto.waste_type || existingLoc.waste_type;
  const updatedCondition = dto.condition || existingLoc.condition;
  const updatedLabel = dto.label !== undefined ? dto.label : (existingLoc.label || '');
  const updatedDescription = dto.description !== undefined ? dto.description : (existingLoc.description || '');

  const updatedValues = [
    updatedLat.toString(),
    updatedLng.toString(),
    updatedWasteType,
    updatedCondition,
    updatedLabel,
    updatedDescription,
    existingLoc.created_at,
    now,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `'${config.sheetName}'!B${targetRowIndex}:I${targetRowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [updatedValues],
    },
  });

  return {
    id: dto.id,
    latitude: updatedLat,
    longitude: updatedLng,
    waste_type: updatedWasteType,
    condition: updatedCondition,
    label: updatedLabel || undefined,
    description: updatedDescription || undefined,
    created_at: existingLoc.created_at,
    updated_at: now,
  };
}

export async function softDeleteLocation(
  id: string,
  sheetsClient?: sheets_v4.Sheets,
  configOverride?: Partial<GoogleSheetsConfig>
): Promise<{ id: string; deleted_at: string }> {
  if (!id || typeof id !== 'string') {
    throw new Error('ID lokasi wajib disertakan untuk penghapusan.');
  }

  const config = getGoogleSheetsConfig(configOverride);
  const sheets = sheetsClient || getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `'${config.sheetName}'!A2:J`,
  });

  const rows = response.data.values || [];
  let targetRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === id) {
      if (row[9] && String(row[9]).trim() !== '') {
        throw new Error(`Data inisiatif dengan ID ${id} sudah berstatus terhapus.`);
      }
      targetRowIndex = i + 2;
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error(`Data inisiatif dengan ID ${id} tidak ditemukan.`);
  }

  const now = new Date().toISOString();

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `'${config.sheetName}'!J${targetRowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[now]],
    },
  });

  return { id, deleted_at: now };
}
