import { CONFIG } from '../constants/config';

export interface ApiClientOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, params?: ApiClientOptions['params']) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${CONFIG.API_BASE_URL}${normalized}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function apiRequest<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;
  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
