import type {
  Paginated,
  PppSecret,
  PppSecretCreateInput,
  PppSecretUpdateInput,
  PppStatus,
} from '@types';
import { API_ENDPOINTS } from './api/endpoints';
import type { HttpClient } from './api/http-client';

export interface ListSecretsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PppStatus;
}

export class PppSecretService {
  constructor(private readonly http: HttpClient) {}

  async list(query: ListSecretsQuery = {}): Promise<Paginated<PppSecret>> {
    const params = new URLSearchParams();

    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);

    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<Paginated<PppSecret>>(`${API_ENDPOINTS.ppp.secrets}${suffix}`);
  }

  async getById(id: number): Promise<PppSecret> {
    return this.http.get<PppSecret>(API_ENDPOINTS.ppp.secretById(id));
  }

  async create(input: PppSecretCreateInput): Promise<PppSecret> {
    return this.http.post<PppSecret>(API_ENDPOINTS.ppp.secrets, input);
  }

  async update(id: number, input: PppSecretUpdateInput): Promise<PppSecret> {
    return this.http.patch<PppSecret>(API_ENDPOINTS.ppp.secretById(id), input);
  }

  async remove(id: number): Promise<void> {
    return this.http.delete<void>(API_ENDPOINTS.ppp.secretById(id));
  }

  async enable(id: number): Promise<PppSecret> {
    return this.http.patch<PppSecret>(API_ENDPOINTS.ppp.secretById(id), { disabled: 'no' });
  }

  async disable(id: number): Promise<PppSecret> {
    return this.http.patch<PppSecret>(API_ENDPOINTS.ppp.secretById(id), { disabled: 'yes' });
  }

  async resetCounters(id: number): Promise<void> {
    return this.http.post<void>(API_ENDPOINTS.ppp.secretResetCounters(id), {});
  }
}
