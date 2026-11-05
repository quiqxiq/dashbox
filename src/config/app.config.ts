export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface AppConfig {
  apiBaseUrl: string;
  useMock: boolean;
  logLevel: LogLevel;
}

function readConfig(): AppConfig {
  const env = import.meta.env;
  const useMock = env.VITE_USE_MOCK !== 'false';

  return {
    apiBaseUrl: useMock ? '/mock' : (env.VITE_API_BASE_URL ?? ''),
    useMock,
    logLevel: env.VITE_LOG_LEVEL ?? 'info',
  };
}

export const appConfig: AppConfig = readConfig();
