import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRequestSession } from './_lib/auth.js';
import { ApiResponse } from './_lib/types.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Metode HTTP tidak diizinkan. Gunakan GET.',
    } satisfies ApiResponse);
    return;
  }

  try {
    const isAuthenticated = verifyRequestSession(req);
    res.status(200).json({
      success: true,
      data: { authenticated: isAuthenticated },
    } satisfies ApiResponse);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Gagal memeriksa status sesi.',
    } satisfies ApiResponse);
  }
}
