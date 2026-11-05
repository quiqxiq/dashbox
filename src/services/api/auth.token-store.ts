export type AuthStrategy = 'none' | 'basic' | 'bearer';

class TokenStore {
  private strategy: AuthStrategy = 'none';
  private token: string | null = null;

  useBasic(username: string, password: string): void {
    this.strategy = 'basic';
    this.token = encodeBasic(`${username}:${password}`);
  }

  useBearer(token: string): void {
    this.strategy = 'bearer';
    this.token = token;
  }

  clear(): void {
    this.strategy = 'none';
    this.token = null;
  }

  getHeader(): Record<string, string> {
    if (!this.token || this.strategy === 'none') return {};

    return this.strategy === 'basic'
      ? { Authorization: `Basic ${this.token}` }
      : { Authorization: `Bearer ${this.token}` };
  }
}

function encodeBasic(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

export const authTokenStore = new TokenStore();
