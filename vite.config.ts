import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL ?? '';

  return {
    resolve: {
      alias: {
        '@': resolvePath('./src'),
        '@config': resolvePath('./src/config'),
        '@i18n': resolvePath('./src/i18n'),
        '@types': resolvePath('./src/types/index.ts'),
        '@services': resolvePath('./src/services'),
        '@store': resolvePath('./src/store'),
        '@components': resolvePath('./src/components'),
        '@views': resolvePath('./src/views'),
        '@utils': resolvePath('./src/utils'),
        '@router': resolvePath('./src/router'),
        '@mock': resolvePath('./src/mock'),
        '@repositories': resolvePath('./src/repositories'),
      },
    },
    server: {
      port: 5173,
      proxy: apiBaseUrl.startsWith('http')
        ? { '/api': { target: apiBaseUrl, changeOrigin: true } }
        : undefined,
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
  };
});
