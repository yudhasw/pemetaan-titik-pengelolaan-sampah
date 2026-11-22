import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSessionCookie, verifyPassword } from './_lib/auth.js';
import { ApiResponse } from './_lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Metode HTTP tidak diizinkan. Gunakan POST.',
    } satisfies ApiResponse);
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { password } = body;

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Password wajib diisi.',
      } satisfies ApiResponse);
      return;
    }

    const isValid = verifyPassword(password);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Password akses tidak valid.',
      } satisfies ApiResponse);
      return;
    }

    const cookieHeader = createSessionCookie();
    res.setHeader('Set-Cookie', cookieHeader);

    res.status(200).json({
      success: true,
      data: { message: 'Berhasil masuk ke sistem.' },
    } satisfies ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Terjadi kesalahan internal pada server saat login.',
    } satisfies ApiResponse);
  }
}
