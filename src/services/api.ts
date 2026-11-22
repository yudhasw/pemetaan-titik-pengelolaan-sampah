import { ApiResponse, CreateLocationDto, TrashLocation, UpdateLocationDto } from '../types/location';

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: `Gagal memproses respon dari server (Status: ${res.status})`,
  }));

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Terjadi kesalahan pada server (Status: ${res.status})`);
  }

  return json.data as T;
}

export const api = {
  async checkSession(): Promise<boolean> {
    try {
      const res = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await handleResponse<{ authenticated: boolean }>(res);
      return data.authenticated;
    } catch {
      return false;
    }
  },

  async login(password: string): Promise<void> {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });
    await handleResponse<{ message: string }>(res);
  },

  async logout(): Promise<void> {
    const res = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    await handleResponse<{ message: string }>(res);
  },

  async getLocations(): Promise<TrashLocation[]> {
    const res = await fetch('/api/locations', {
      method: 'GET',
      credentials: 'include',
    });
    return handleResponse<TrashLocation[]>(res);
  },

  async createLocation(payload: CreateLocationDto): Promise<TrashLocation> {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<TrashLocation>(res);
  },

  async updateLocation(payload: UpdateLocationDto): Promise<TrashLocation> {
    const res = await fetch('/api/locations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<TrashLocation>(res);
  },

  async deleteLocation(id: string): Promise<void> {
    const res = await fetch(`/api/locations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await handleResponse<{ id: string; message: string }>(res);
  },
};
