import { authTokenStore } from '@services/api/auth.token-store';
import { createStore } from './create-store';

const STORAGE_KEY = 'dashbox.auth';

export interface AuthUser {
  username: string;
  role: 'admin';
  loggedInAt: string;
}

interface StoredAuth {
  user: AuthUser;
  token?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

function loadInitial(): AuthState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAuth;
      if (parsed?.user?.username) {
        if (parsed.token) {
          authTokenStore.restoreBasic(parsed.token);
        }
        return {
          isAuthenticated: true,
          user: parsed.user,
        };
      }
    }
  } catch {
    // storage error or invalid json
  }
  return {
    isAuthenticated: false,
    user: null,
  };
}

export const authStore = createStore<AuthState>(loadInitial());

export function login(username: string, password: string): { success: boolean; error?: string } {
  const cleanUser = username.trim();
  const cleanPass = password;

  const envUser = import.meta.env.VITE_API_USERNAME;
  const envPass = import.meta.env.VITE_API_PASSWORD;

  const matchesEnv =
    Boolean(envUser) &&
    cleanUser.toLowerCase() === String(envUser).toLowerCase() &&
    cleanPass === String(envPass ?? '');

  const matchesDemo =
    cleanUser.toLowerCase() === 'admin' && (cleanPass === 'admin' || cleanPass === '');

  if (!matchesEnv && !matchesDemo) {
    return { success: false, error: 'auth.invalidCredentials' };
  }

  // Set API basic token
  authTokenStore.useBasic(cleanUser, cleanPass);
  const token = authTokenStore.getToken();

  const user: AuthUser = {
    username: cleanUser,
    role: 'admin',
    loggedInAt: new Date().toISOString(),
  };

  authStore.setState({
    isAuthenticated: true,
    user,
  });

  try {
    const payload: StoredAuth = token ? { user, token } : { user };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }

  return { success: true };
}

export function logout(): void {
  authTokenStore.clear();
  authStore.setState({
    isAuthenticated: false,
    user: null,
  });

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
