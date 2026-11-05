import type { RequestOptions } from '@types';
import { logger } from '@utils/logger';
import { ApiError } from './api.error';
import { authTokenStore } from './auth.token-store';

const DEFAULT_TIMEOUT_MS = 15_000;

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { auth = true, retries = 0, body, headers, method = 'GET', ...rest } = opts;
    const url = `${this.baseUrl}${path}`;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      try {
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(auth ? authTokenStore.getHeader() : {}),
          ...(headers as Record<string, string> | undefined),
        };

        const init: RequestInit = {
          ...rest,
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        if (body !== undefined) init.body = JSON.stringify(body);

        const response = await fetch(url, init);
        window.clearTimeout(timer);

        if (!response.ok) {
          const errorBody = await this.parseJson(response);
          throw ApiError.fromResponse(response.status, errorBody);
        }

        if (response.status === 204) return undefined as T;
        return (await this.parseJson(response)) as T;
      } catch (error) {
        window.clearTimeout(timer);
        const apiError = this.toApiError(error);

        if (apiError.isRetryable && attempt < retries) {
          const delay = Math.min(2 ** attempt * 250, 2000);
          logger.warn(`[http] retry ${attempt + 1}/${retries} in ${delay}ms`, {
            url,
            code: apiError.code,
          });
          await new Promise((resolve) => window.setTimeout(resolve, delay));
          continue;
        }

        throw apiError;
      }
    }

    throw new ApiError('Retry exhausted', 0, 'EXHAUSTED');
  }

  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, method: 'GET' });
  }

  post<T>(path: string, body: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, method: 'POST', body });
  }

  patch<T>(path: string, body: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, method: 'PATCH', body });
  }

  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...opts, method: 'DELETE' });
  }

  private async parseJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  private toApiError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      return new ApiError('Request timeout', 0, 'TIMEOUT');
    }

    return new ApiError(error instanceof Error ? error.message : 'Network error', 0, 'NETWORK');
  }
}
