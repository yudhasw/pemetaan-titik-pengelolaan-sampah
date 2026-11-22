import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogoutCookie } from './_lib/auth.js';
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
    const cookieHeader = createLogoutCookie();
    res.setHeader('Set-Cookie', cookieHeader);

    res.status(200).json({
      success: true,
      data: { message: 'Berhasil keluar dari sistem.' },
    } satisfies ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Terjadi kesalahan internal pada server saat logout.',
    } satisfies ApiResponse);
  }
}
