import { appConfig } from '@config/app.config';
import type { Paginated, PppSecret, PppSecretCreateInput, PppSecretUpdateInput } from '@types';
import type { ListSecretsQuery, PppSecretService } from '@services/ppp-secret.service';
import {
  mockCreateSecret,
  mockDeleteSecret,
  mockDisableSecret,
  mockEnableSecret,
  mockGetSecret,
  mockListSecrets,
  mockResetCounters,
  mockUpdateSecret,
} from '@mock/ppp-secrets.mock';

export class PppSecretRepository {
  constructor(private readonly service: PppSecretService) {}

  list(query: ListSecretsQuery = {}): Promise<Paginated<PppSecret>> {
    return appConfig.useMock ? mockListSecrets(query) : this.service.list(query);
  }

  getById(id: number): Promise<PppSecret> {
    return appConfig.useMock ? mockGetSecret(id) : this.service.getById(id);
  }

  create(input: PppSecretCreateInput): Promise<PppSecret> {
    return appConfig.useMock ? mockCreateSecret(input) : this.service.create(input);
  }

  update(id: number, input: PppSecretUpdateInput): Promise<PppSecret> {
    return appConfig.useMock ? mockUpdateSecret(id, input) : this.service.update(id, input);
  }

  remove(id: number): Promise<void> {
    return appConfig.useMock ? mockDeleteSecret(id) : this.service.remove(id);
  }

  enable(id: number): Promise<PppSecret> {
    return appConfig.useMock ? mockEnableSecret(id) : this.service.enable(id);
  }

  disable(id: number): Promise<PppSecret> {
    return appConfig.useMock ? mockDisableSecret(id) : this.service.disable(id);
  }

  resetCounters(id: number): Promise<void> {
    return appConfig.useMock ? mockResetCounters(id) : this.service.resetCounters(id);
  }
}
