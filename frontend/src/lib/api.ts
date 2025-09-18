import axios from 'axios';

// Base URL from Vite env or fallback
const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Matches backend SensorInput model
export interface IdentifyPayload {
  pH: number;
  TDS: number;
  Turbidity: number;
  Gas: number;
  ColorIndex: number;
  Temp: number;
}

export interface IdentifyResponse {
  dravya: string;
  description: string;
  image_base64?: string | null;
}

export async function identifyDravya(payload: IdentifyPayload) {
  const { data } = await api.post<IdentifyResponse>('/identify', payload);
  return data;
}

export async function searchDravya(name: string) {
  const { data } = await api.get<IdentifyResponse>('/search', { params: { name } });
  return data;
}

export async function researchDravya(dravya: string, query: string) {
  const { data } = await api.post<{ answer: string }>('/research', { dravya, query });
  return data;
}
