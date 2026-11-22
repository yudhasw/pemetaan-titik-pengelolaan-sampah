export type WasteType =
  | 'Budidaya Maggot'
  | 'Pengomposan'
  | 'Bank Sampah'
  | 'TPS3R'
  | 'Tempat Sampah Terpilah'
  | 'Organik'
  | 'Anorganik'
  | 'Campuran'
  | 'Lainnya'
  | (string & {});

export type TrashCondition = 'Baik' | 'Penuh' | 'Rusak';

export interface TrashLocation {
  id: string;
  latitude: number;
  longitude: number;
  waste_type: WasteType;
  condition: TrashCondition;
  label?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateLocationDto {
  latitude: number;
  longitude: number;
  waste_type: WasteType;
  condition: TrashCondition;
  label?: string;
  description?: string;
}

export interface UpdateLocationDto {
  id: string;
  latitude?: number;
  longitude?: number;
  waste_type?: WasteType;
  condition?: TrashCondition;
  label?: string;
  description?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionPayload {
  authenticated: boolean;
  exp: number;
}
