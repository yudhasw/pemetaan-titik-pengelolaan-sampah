import { describe, expect, it, vi } from 'vitest';
import locationsHandler from '../api/locations';
import { createSessionCookie } from '../api/_lib/auth.js';
import * as googleSheetsModule from '../api/_lib/googleSheets.js';

describe('Locations API Endpoint Tests', () => {
  const validCookie = createSessionCookie();

  function createMockRes() {
    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader: vi.fn((k, v) => {
        res.headers[k.toLowerCase()] = v;
      }),
      status: vi.fn((code) => {
        res.statusCode = code;
        return res;
      }),
      json: vi.fn((data) => {
        res.body = data;
        return res;
      }),
    };
    return res;
  }

  it('rejects unauthenticated requests with 401', async () => {
    const req: any = {
      method: 'GET',
      headers: {},
    };
    const res = createMockRes();

    await locationsHandler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Sesi tidak valid');
  });

  it('rejects state-changing requests with invalid Origin with 403', async () => {
    const req: any = {
      method: 'POST',
      headers: {
        cookie: validCookie,
        origin: 'https://malicious-site.com',
        host: 'trashmap.vercel.app',
      },
      body: {},
    };
    const res = createMockRes();

    await locationsHandler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/locations returns locations when authenticated', async () => {
    vi.spyOn(googleSheetsModule, 'getAllLocations').mockResolvedValueOnce([
      {
        id: '123',
        latitude: -6.2,
        longitude: 106.8,
        waste_type: 'Organik',
        condition: 'Baik',
        label: 'Taman',
        description: 'Pintu masuk',
        created_at: '2026-11-20T00:00:00Z',
        updated_at: '2026-11-20T00:00:00Z',
      },
    ]);

    const req: any = {
      method: 'GET',
      headers: {
        cookie: validCookie,
      },
    };
    const res = createMockRes();

    await locationsHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].label).toBe('Taman');
  });

  it('POST /api/locations rejects invalid body with 400', async () => {
    const req: any = {
      method: 'POST',
      headers: {
        cookie: validCookie,
        origin: 'http://localhost:5173',
      },
      body: {
        latitude: 'invalid',
      },
    };
    const res = createMockRes();

    await locationsHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/locations creates location successfully with 201', async () => {
    vi.spyOn(googleSheetsModule, 'createLocation').mockResolvedValueOnce({
      id: 'new-uuid',
      latitude: -6.2088,
      longitude: 106.8456,
      waste_type: 'Campuran',
      condition: 'Baik',
      label: 'Lokasi Baru',
      created_at: '2026-11-22T00:00:00Z',
      updated_at: '2026-11-22T00:00:00Z',
    });

    const req: any = {
      method: 'POST',
      headers: {
        cookie: validCookie,
        origin: 'http://localhost:5173',
      },
      body: {
        latitude: -6.2088,
        longitude: 106.8456,
        waste_type: 'Campuran',
        condition: 'Baik',
        label: 'Lokasi Baru',
      },
    };
    const res = createMockRes();

    await locationsHandler(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('new-uuid');
  });
});
