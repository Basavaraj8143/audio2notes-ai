import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = '8000';

const getExpoHostBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.platform?.hostUri;
  if (!hostUri) return null;

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  return `http://${host}:${DEFAULT_API_PORT}`;
};

// Default base URL depending on platform
// - iOS Simulator: localhost
// - Android Emulator: 10.0.2.2
// - Real device: requires local LAN IP (e.g. http://192.168.1.X:8000)
const getDefaultBaseUrl = () => {
  const expoHostBaseUrl = getExpoHostBaseUrl();
  if (expoHostBaseUrl) {
    return expoHostBaseUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

let apiBaseUrl = getDefaultBaseUrl();

export const getApiBaseUrl = () => apiBaseUrl;
export const getSuggestedApiBaseUrl = () => getDefaultBaseUrl();

export const setApiBaseUrl = (url: string) => {
  let cleaned = url.trim();
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  apiBaseUrl = cleaned.replace(/\/+$/, '');
};

export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalized}`;
};

export const checkApiHealth = async (timeoutMs: number = 5000) => {
  const startedAt = Date.now();
  const response = await request<{ status: string }>('/health', { timeoutMs });
  return {
    ok: response.status === 'ok',
    status: response.status,
    baseUrl: getApiBaseUrl(),
    elapsedMs: Date.now() - startedAt,
  };
};

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeoutMs?: number;
}

export async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, timeoutMs = 90000 } = options;
  const url = apiUrl(path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    method,
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
    signal: controller.signal,
  };

  if (body) {
    if (body instanceof FormData) {
      // Fetch will automatically set content-type for FormData with boundary
      config.body = body;
    } else {
      (config.headers as Record<string, string>)['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Fallback to status text
        if (response.statusText) {
          errorMessage = response.statusText;
        }
      }
      throw new Error(errorMessage);
    }

    // Handle empty response bodies
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    }
    return {} as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network connection.');
    }
    throw error;
  }
}
