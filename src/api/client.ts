import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type {
  Account,
  ActionType,
  AuthResponse,
  CareerSummary,
  ClubSearchResult,
  CountrySummary,
  CountryView,
  DuelView,
  GameView,
  HistoryView,
  MesaSummary,
  MesaView,
  MetaView,
} from './types';

/**
 * Endereço da API. Use EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:5080) para apontar para outro servidor.
 * Sem a variável, em desenvolvimento usa o mesmo IP do Metro na porta 5080, o que funciona no
 * celular físico na mesma rede e no emulador.
 */
function resolveBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (env) {
    // Aceita o endereço sem "https://" (ex.: camisa10back-production.up.railway.app).
    const local = /^(localhost|127\.|10\.|192\.168\.)/.test(env);
    const withScheme = /^https?:\/\//i.test(env) ? env : (local ? 'http://' : 'https://') + env;
    return withScheme.replace(/\/+$/, '');
  }
  if (Platform.OS === 'web') return 'http://localhost:5080';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:5080`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5080' : 'http://localhost:5080';
}

export const API_URL = resolveBaseUrl();

const PLAYER_KEY = 'c10.player';
const SESSION_KEY = 'c10.session';
let playerId: string | null = null;

function newGuestId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return 'p-' + Array.from({ length: 22 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Identificador de convidado deste aparelho, criado na primeira vez e guardado no AsyncStorage. */
async function getPlayerId(): Promise<string> {
  if (playerId) return playerId;
  let id: string | null = null;
  try {
    id = await AsyncStorage.getItem(PLAYER_KEY);
  } catch {
    // armazenamento indisponível: segue com um id só desta sessão
  }
  if (!id) {
    id = newGuestId();
    try {
      await AsyncStorage.setItem(PLAYER_KEY, id);
    } catch {}
  }
  playerId = id;
  return id;
}

/** Troca o convidado do aparelho por um novo (depois de sair da conta, o antigo já é da conta). */
async function resetPlayerId() {
  playerId = newGuestId();
  try {
    await AsyncStorage.setItem(PLAYER_KEY, playerId);
  } catch {}
}

// ---------------------------------------------------------------- sessão da conta
type Session = { token: string; account: Account };
let session: Session | null | undefined; // undefined: ainda não leu do armazenamento
const listeners = new Set<(a: Account | null) => void>();

async function getSession(): Promise<Session | null> {
  if (session !== undefined) return session;
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  return session;
}

async function setSession(s: Session | null) {
  session = s;
  try {
    if (s) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else await AsyncStorage.removeItem(SESSION_KEY);
  } catch {}
  listeners.forEach((l) => l(s?.account ?? null));
}

/** Conta de quem está jogando (null para convidado; undefined enquanto carrega). */
export function useAccount(): Account | null | undefined {
  const [account, setAccount] = useState<Account | null | undefined>(session === undefined ? undefined : (session?.account ?? null));
  useEffect(() => {
    let alive = true;
    getSession().then((s) => alive && setAccount(s?.account ?? null));
    listeners.add(setAccount);
    return () => {
      alive = false;
      listeners.delete(setAccount);
    };
  }, []);
  return account;
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
  const current = await getSession();
  const headers: Record<string, string> = {
    // o id do convidado vai sempre: ao entrar ou criar a conta, as carreiras dele vêm junto
    'X-Player-Id': await getPlayerId(),
    ...(current ? { Authorization: `Bearer ${current.token}` } : {}),
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
  };
  let res: Response;
  try {
    res = await fetch(API_URL + path, { ...init, headers });
  } catch {
    // Site publicado sem EXPO_PUBLIC_API_URL: o app tenta o próprio computador (localhost).
    const publishedWithoutApi =
      Platform.OS === 'web' &&
      /localhost|127\.0\.0\.1/.test(API_URL) &&
      typeof window !== 'undefined' &&
      !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    throw new ApiError(
      publishedWithoutApi
        ? 'O app não sabe o endereço do backend. Configure a variável EXPO_PUBLIC_API_URL no serviço do front e faça um novo deploy.'
        : `Não foi possível falar com o servidor (${API_URL}).`,
      0,
    );
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok && !accept.includes(res.status)) {
    let msg = `Erro ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail || body.title || msg;
    } catch {}
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      // sessão expirou, ou o id deste aparelho já é de uma conta: volta a ser um convidado novo
      // (as carreiras continuam na conta, é só entrar de novo)
      if (current) await setSession(null);
      await resetPlayerId();
    }
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
  /** Os 211 países com as três divisões. */
  countries: () => request<CountrySummary[]>('/api/world'),
  country: (iso: string) => request<CountryView>(`/api/world/${encodeURIComponent(iso)}`),
  searchClubs: (q: string) => request<ClubSearchResult[]>(`/api/world/search?q=${encodeURIComponent(q)}`),
  remove: (id: string) => request<void>(`/api/careers/${id}`, { method: 'DELETE' }),

  // ---------------------------------------------------------------- conta
  register: async (email: string, password: string, name: string) => {
    const r = await request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    await setSession({ token: r.token, account: r.account });
    return r;
  },
  login: async (email: string, password: string) => {
    const r = await request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    await setSession({ token: r.token, account: r.account });
    return r;
  },
  /** Sai da conta: este aparelho volta a ser um convidado novo (as carreiras ficam na conta). */
  logout: async () => {
    try {
      await request<void>('/api/auth/logout', { method: 'POST' });
    } catch {}
    await setSession(null);
    await resetPlayerId();
  },

  // ---------------------------------------------------------------- mesa com amigos
  mesas: () => request<MesaSummary[]>('/api/mesas'),
  createMesa: (name: string, playerName: string) =>
    request<MesaView>('/api/mesas', { method: 'POST', body: JSON.stringify({ name, playerName }) }),
  joinMesa: (code: string, playerName: string) =>
    request<MesaView>('/api/mesas/join', { method: 'POST', body: JSON.stringify({ code, playerName }) }),
  mesa: (id: string) => request<MesaView>(`/api/mesas/${id}`),
  createMesaCareer: (mesaId: string, body: { name: string; club: string; nation: string; position: string }) =>
    request<GameView>(`/api/mesas/${mesaId}/careers`, { method: 'POST', body: JSON.stringify(body) }),
  setSync: (mesaId: string, sync: boolean) =>
    request<MesaView>(`/api/mesas/${mesaId}/sync`, { method: 'POST', body: JSON.stringify({ sync }) }),
  challenge: (mesaId: string, opponentMemberId: string) =>
    request<DuelView>(`/api/mesas/${mesaId}/duels`, { method: 'POST', body: JSON.stringify({ opponentMemberId }) }),
  duel: (id: string) => request<DuelView>(`/api/duels/${id}`),
  duelChoose: (id: string, index: number) =>
    request<DuelView>(`/api/duels/${id}/choose`, { method: 'POST', body: JSON.stringify({ index }) }),
  duelAuto: (id: string) => request<DuelView>(`/api/duels/${id}/auto`, { method: 'POST' }),
};
