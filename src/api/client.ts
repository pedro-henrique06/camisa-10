import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { ActionType, CareerSummary, GameView, HistoryView, MetaView } from './types';

/**
 * Endereço da API. Use EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:5080) para apontar para outro servidor.
 * Sem a variável, em desenvolvimento usa o mesmo IP do Metro na porta 5080, o que funciona no
 * celular físico na mesma rede e no emulador.
 */
function resolveBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  if (Platform.OS === 'web') return 'http://localhost:5080';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:5080`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5080' : 'http://localhost:5080';
}

export const API_URL = resolveBaseUrl();

const PLAYER_KEY = 'c10.player';
let playerId: string | null = null;

/** Identificador anônimo deste aparelho, criado na primeira vez e guardado no AsyncStorage. */
async function getPlayerId(): Promise<string> {
  if (playerId) return playerId;
  let id: string | null = null;
  try {
    id = await AsyncStorage.getItem(PLAYER_KEY);
  } catch {
    // armazenamento indisponível: segue com um id só desta sessão
  }
  if (!id) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    id = 'p-' + Array.from({ length: 22 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    try {
      await AsyncStorage.setItem(PLAYER_KEY, id);
    } catch {}
  }
  playerId = id;
  return id;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, accept: number[] = []): Promise<T> {
  const headers: Record<string, string> = {
    'X-Player-Id': await getPlayerId(),
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
  };
  let res: Response;
  try {
    res = await fetch(API_URL + path, { ...init, headers });
  } catch {
    throw new ApiError(`Não foi possível falar com o servidor (${API_URL}).`, 0);
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok && !accept.includes(res.status)) {
    let msg = `Erro ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail || body.title || msg;
    } catch {}
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

let metaCache: Promise<MetaView> | null = null;

export const api = {
  /** Dados fixos do jogo; ficam em memória depois da primeira chamada bem-sucedida. */
  meta: () => {
    metaCache ??= request<MetaView>('/api/meta').catch((e) => {
      metaCache = null;
      throw e;
    });
    return metaCache;
  },
  careers: (status?: 'Active' | 'Finished') =>
    request<CareerSummary[]>('/api/careers' + (status ? `?status=${status}` : '')),
  create: (body: { name: string; club: string; nation: string; position: string }) =>
    request<GameView>('/api/careers', { method: 'POST', body: JSON.stringify(body) }),
  get: (id: string) => request<GameView>(`/api/careers/${id}`),
  /** 409 (tela desatualizada) também devolve a tela atual, então é tratado como resposta normal. */
  act: (id: string, version: number, type: ActionType, index?: number, power?: number) =>
    request<GameView>(
      `/api/careers/${id}/actions`,
      { method: 'POST', body: JSON.stringify({ type, index, power, version }) },
      [409],
    ),
  history: (id: string) => request<HistoryView>(`/api/careers/${id}/history`),
  remove: (id: string) => request<void>(`/api/careers/${id}`, { method: 'DELETE' }),
};
