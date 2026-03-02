/**
 * Generic localStorage persistence factory.
 *
 * Wraps save/load/clear with version checking and sanitization.
 * Consumer provides the storage key, version, sanitizer, and default factory.
 */

export interface LocalStorageConfig<T> {
  storageKey: string;
  logPrefix: string;
  version: number;
  sanitize: (data: T) => T;
  createDefault: () => T;
}

export interface LocalStorageSync<T> {
  saveToLocal(data: T): void;
  loadFromLocal(): T;
  clearLocal(): void;
}

export function createLocalStorage<T extends { version: number }>(
  config: LocalStorageConfig<T>,
): LocalStorageSync<T> {
  const { storageKey, logPrefix, version, sanitize, createDefault } = config;

  function saveToLocal(data: T): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error(`${logPrefix} Failed to save to localStorage:`, e);
    }
  }

  function loadFromLocal(): T {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        if (parsed.version === version) {
          return sanitize(parsed);
        }
      }
    } catch (e) {
      console.error(`${logPrefix} Failed to load from localStorage:`, e);
    }
    return createDefault();
  }

  function clearLocal(): void {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error(`${logPrefix} Failed to clear localStorage:`, e);
    }
  }

  return { saveToLocal, loadFromLocal, clearLocal };
}
