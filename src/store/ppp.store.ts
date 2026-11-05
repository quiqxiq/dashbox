import type {
  PppSecret,
  PppSecretCreateInput,
  PppSecretFormValues,
  PppSecretUpdateInput,
  PppTabName,
} from '@types';
import type { ListSecretsQuery } from '@services/ppp-secret.service';
import type { PppSecretRepository } from '@repositories/ppp-secret.repository';
import { logger } from '@utils/logger';
import { createStore, type Store } from './create-store';

export const PPP_PAGE_SIZE = 6;

export interface PppState {
  tab: PppTabName;
  page: number;
  pageSize: number;
  filter: string;
  secrets: PppSecret[];
  total: number;
  selectedId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: PppState = {
  tab: 'secrets',
  page: 1,
  pageSize: PPP_PAGE_SIZE,
  filter: '',
  secrets: [],
  total: 0,
  selectedId: null,
  loading: false,
  error: null,
};

export interface PppStoreApi {
  store: Store<PppState>;
  load(): Promise<void>;
  setTab(tab: PppTabName): Promise<void>;
  setFilter(filter: string): Promise<void>;
  setPage(page: number): Promise<void>;
  select(id: number | null): void;
  refresh(): Promise<void>;
  removeSelected(): Promise<PppSecret | null>;
  enableSelected(): Promise<PppSecret | null>;
  disableSelected(): Promise<PppSecret | null>;
  resetSelectedCounters(): Promise<PppSecret | null>;
  updateComment(id: number, comment: string): Promise<PppSecret | null>;
  createSecret(values: PppSecretFormValues): Promise<PppSecret>;
  updateSecret(id: number, values: PppSecretFormValues): Promise<PppSecret>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Gagal memuat data dari router';
}

function toCreateInput(values: PppSecretFormValues): PppSecretCreateInput {
  return {
    name: values.name,
    service: values.service,
    profile: values.profile,
    localAddress: values.localAddress,
    remoteAddress: values.remoteAddress,
    callerId: values.callerId,
    comment: values.comment,
    rateLimit: values.rateLimit,
    sessionTimeout: values.sessionTimeout,
    idleTimeout: values.idleTimeout,
    onlyOneSession: values.onlyOneSession,
    ...(values.password ? { password: values.password } : {}),
  };
}

function toUpdateInput(values: PppSecretFormValues): PppSecretUpdateInput {
  return {
    name: values.name,
    service: values.service,
    profile: values.profile,
    localAddress: values.localAddress,
    remoteAddress: values.remoteAddress,
    callerId: values.callerId,
    comment: values.comment,
    rateLimit: values.rateLimit,
    sessionTimeout: values.sessionTimeout,
    idleTimeout: values.idleTimeout,
    onlyOneSession: values.onlyOneSession,
    ...(values.password ? { password: values.password } : {}),
  };
}

export function createPppStore(repo: PppSecretRepository): PppStoreApi {
  const store = createStore<PppState>(initialState);

  function buildQuery(
    page: number,
    pageSize: number,
    filter: string,
    tab: PppTabName,
  ): ListSecretsQuery {
    const query: ListSecretsQuery = { page, pageSize };
    if (filter) query.search = filter;
    if (tab === 'active') query.status = 'running';
    return query;
  }

  async function reload(): Promise<void> {
    store.setState({ loading: true, error: null });

    try {
      const { page, pageSize, filter, tab } = store.getState();
      let response = await repo.list(buildQuery(page, pageSize, filter, tab));
      const totalPages = Math.max(1, Math.ceil(response.total / pageSize));

      if (page > totalPages) {
        store.setState({ page: totalPages });
        response = await repo.list(buildQuery(totalPages, pageSize, filter, tab));
      }

      store.setState({ secrets: response.items, total: response.total, loading: false });
    } catch (error) {
      logger.error('[ppp.store] reload failed', error);
      store.setState({ loading: false, error: errorMessage(error), secrets: [], total: 0 });
    }
  }

  function selected(): PppSecret | null {
    const { selectedId, secrets } = store.getState();
    if (selectedId === null) return null;
    return secrets.find((secret) => secret.id === selectedId) ?? null;
  }

  return {
    store,
    load: reload,

    async setTab(tab) {
      store.setState({ tab, page: 1, selectedId: null });
      if (tab === 'secrets' || tab === 'active') await reload();
    },

    async setFilter(filter) {
      store.setState({ filter, page: 1, selectedId: null });
      await reload();
    },

    async setPage(page) {
      store.setState({ page: Math.max(1, page) });
      await reload();
    },

    select(id) {
      store.setState({ selectedId: id });
    },

    refresh: reload,

    async removeSelected() {
      const current = selected();
      if (!current) return null;

      await repo.remove(current.id);
      store.setState({ selectedId: null });
      await reload();
      return current;
    },

    async enableSelected() {
      const current = selected();
      if (!current) return null;

      const updated = await repo.enable(current.id);
      await reload();
      return updated;
    },

    async disableSelected() {
      const current = selected();
      if (!current) return null;

      const updated = await repo.disable(current.id);
      await reload();
      return updated;
    },

    async resetSelectedCounters() {
      const current = selected();
      if (!current) return null;

      await repo.resetCounters(current.id);
      await reload();
      return current;
    },

    async updateComment(id, comment) {
      const updated = await repo.update(id, { comment });
      await reload();
      return updated;
    },

    async createSecret(values) {
      const created = await repo.create(toCreateInput(values));
      store.setState({ tab: 'secrets', filter: '', page: 1, selectedId: created.id });
      await reload();
      return created;
    },

    async updateSecret(id, values) {
      const updated = await repo.update(id, toUpdateInput(values));
      await reload();
      return updated;
    },
  };
}
