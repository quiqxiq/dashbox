/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_USERNAME: string;
  readonly VITE_API_PASSWORD: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_LOG_LEVEL: 'silent' | 'error' | 'warn' | 'info' | 'debug';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
