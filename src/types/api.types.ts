export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  retries?: number;
}
