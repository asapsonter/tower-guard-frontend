/**
 * safeStorage — a defensive wrapper around window.localStorage.
 *
 * localStorage can throw or be unavailable in several real-world scenarios:
 *   - SSR / non-browser environments (window is undefined)
 *   - Safari Private Mode (setItem throws QuotaExceededError)
 *   - Browsers with storage disabled or sandboxed iframes
 *   - Storage quota exceeded
 *
 * This wrapper guarantees the auth flow never crashes the app:
 *   1. Probes localStorage on first use to detect availability
 *   2. Falls back transparently to an in-memory Map when unavailable
 *   3. Wraps every operation in try/catch so callers never see throws
 *   4. Never logs the value being stored (auth tokens are sensitive)
 */

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memoryStore = new Map<string, string>();

const memoryStorage: StorageLike = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key)! : null),
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  },
};

/**
 * Probe localStorage with a real write/read/remove cycle.
 * A simple `typeof window !== "undefined"` check is not enough — Safari
 * Private Mode exposes the API but throws on setItem.
 */
const detectLocalStorage = (): StorageLike => {
  if (typeof window === "undefined") {
    return memoryStorage;
  }

  try {
    const probeKey = "__safeStorage_probe__";
    window.localStorage.setItem(probeKey, "1");
    const value = window.localStorage.getItem(probeKey);
    window.localStorage.removeItem(probeKey);
    if (value !== "1") {
      return memoryStorage;
    }
    return window.localStorage;
  } catch {
    return memoryStorage;
  }
};

const backend: StorageLike = detectLocalStorage();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return backend.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      backend.setItem(key, value);
    } catch {
      // Quota exceeded or backend rejected the write — silently degrade.
      // The session simply won't persist across reloads in this scenario.
    }
  },

  removeItem(key: string): void {
    try {
      backend.removeItem(key);
    } catch {
      // No-op: removal failures are non-fatal.
    }
  },
};
