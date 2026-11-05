export function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms));
}
