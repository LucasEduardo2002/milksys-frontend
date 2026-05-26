import axios from 'axios';
import { Environment } from '../../../environment';

type CachedEntry = {
  expiresAt: number;
  response: unknown;
};

const Api = axios.create({
  baseURL: Environment.URL_BASE, // URL base do JSON Server
});

const cache = new Map<string, CachedEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 30_000;

const createCacheKey = (method: string, url?: string, params?: unknown) => {
  return `${method}:${url ?? ''}:${params ? JSON.stringify(params) : ''}`;
};

const invalidateCachedGets = (url?: string) => {
  if (!url) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(`:${url}`)) {
      cache.delete(key);
    }
  }
};

const getWithCache = async <T>(url: string, config?: Record<string, unknown>) => {
  const key = createCacheKey('get', url, config?.params);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.response as T;
  }

  const pending = inFlightRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = Api.request<T>({
    method: 'get',
    url,
    ...config,
  }).then(response => {
    cache.set(key, { expiresAt: now + CACHE_TTL_MS, response });
    inFlightRequests.delete(key);
    return response;
  }).catch(error => {
    inFlightRequests.delete(key);
    throw error;
  });

  inFlightRequests.set(key, request as Promise<unknown>);
  return request;
};

Api.get = ((url: string, config?: Record<string, unknown>) => {
  return getWithCache(url, config);
}) as typeof Api.get;

const wrapMutation = <T>(method: 'post' | 'put' | 'patch' | 'delete') => {
  const original = Api[method].bind(Api);

  Api[method] = (async (...args: Parameters<typeof original>) => {
    const result = await original(...args);
    invalidateCachedGets();
    return result;
  }) as typeof Api[typeof method];
};

wrapMutation('post');
wrapMutation('put');
wrapMutation('patch');
wrapMutation('delete');

Api.interceptors.response.use(
  response => response,
  error => {
    // Interceptador de erros
    if (axios.isAxiosError(error)) {
      console.error('Erro na requisição Axios:', error.message);
      console.error('Status HTTP:', error.response?.status);
    } else {
      console.error('Erro inesperado:', error);
    }

    // Você pode até lançar um erro customizado aqui, se quiser
    return Promise.reject(error);
  }
);


export { Api };