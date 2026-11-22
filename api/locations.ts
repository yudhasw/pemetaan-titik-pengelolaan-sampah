import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyOrigin, verifyRequestSession } from './_lib/auth.js';
import {
  createLocation,
  getAllLocations,
  softDeleteLocation,
  updateLocation,
} from './_lib/googleSheets.js';
import { ApiResponse } from './_lib/types.js';
import {
  validateCreateLocation,
  validateUpdateLocation,
} from './_lib/validation.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Always disable caching for location data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 1. Session Authentication Check
  const isAuthenticated = verifyRequestSession(req);
  if (!isAuthenticated) {
    res.status(401).json({
      success: false,
      error: 'Akses ditolak: Sesi tidak valid atau telah berakhir. Silakan login kembali.',
    } satisfies ApiResponse);
    return;
  }

  const method = req.method?.toUpperCase();

  // 2. CSRF / Origin Verification for state-changing methods
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    if (!verifyOrigin(req)) {
      res.status(403).json({
        success: false,
        error: 'Akses ditolak: Asal permintaan (Origin/Referer) tidak sah.',
      } satisfies ApiResponse);
      return;
    }
  }

  // Parse body if string
  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body || {};

  try {
    switch (method) {
      case 'GET': {
        const locations = await getAllLocations();
        res.status(200).json({
          success: true,
          data: locations,
        } satisfies ApiResponse);
        return;
      }

      case 'POST': {
        const validation = validateCreateLocation(body);
        if (!validation.valid || !validation.data) {
          res.status(400).json({
            success: false,
            error: 'Validasi formulir gagal.',
            data: validation.errors,
          } satisfies ApiResponse);
          return;
        }

        const newLocation = await createLocation(validation.data);
        res.status(201).json({
          success: true,
          data: newLocation,
        } satisfies ApiResponse);
        return;
      }

      case 'PATCH': {
        const validation = validateUpdateLocation(body);
        if (!validation.valid || !validation.data) {
          res.status(400).json({
            success: false,
            error: 'Validasi pembaruan lokasi gagal.',
            data: validation.errors,
          } satisfies ApiResponse);
          return;
        }

        const updated = await updateLocation(validation.data);
        res.status(200).json({
          success: true,
          data: updated,
        } satisfies ApiResponse);
        return;
      }

      case 'DELETE': {
        const id = (req.query?.id as string) || body.id;
        if (!id || typeof id !== 'string' || id.trim() === '') {
          res.status(400).json({
            success: false,
            error: 'Parameter ID lokasi wajib disertakan untuk penghapusan.',
          } satisfies ApiResponse);
          return;
        }

        const result = await softDeleteLocation(id.trim());
        res.status(200).json({
          success: true,
          data: {
            id: result.id,
            message: 'Lokasi berhasil dihapus secara logis.',
          },
        } satisfies ApiResponse);
        return;
      }

      default: {
        res.status(405).json({
          success: false,
          error: `Metode ${method} tidak didukung. Gunakan GET, POST, PATCH, atau DELETE.`,
        } satisfies ApiResponse);
        return;
      }
    }
  } catch (error: any) {
    const message = error?.message || 'Terjadi kesalahan saat memproses data Google Sheets.';
    const isNotFound = message.includes('tidak ditemukan');
    const status = isNotFound ? 404 : 500;

    res.status(status).json({
      success: false,
      error: message,
    } satisfies ApiResponse);
  }
}
