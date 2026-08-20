/**
 * The kitchen tablet's promise-clock UI can't stall waiting on wifi — a
 * tap has to apply and the sync can catch up. This is the queue that
 * makes that true for whichever api-client call a screen wraps in it:
 * persist the pending mutation immediately, replay in order once back
 * online, never skip ahead over a failed item (a ticket bumped out of
 * order is worse than one that's merely late).
 *
 * Deliberately has zero React Native imports — storage and connectivity
 * are required parameters, not defaults, so this stays plain-Node
 * testable (see offlineQueue.test.ts). The RN-backed implementations of
 * both live in nativeAdapters.ts, which is what apps actually import.
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface ConnectivityWatcher {
  isConnected(): Promise<boolean>;
  subscribe(listener: (connected: boolean) => void): () => void;
}

export interface OfflineQueue<T> {
  enqueue(item: T): Promise<void>;
  flush(): Promise<void>;
  getPending(): Promise<T[]>;
  subscribe(listener: (pending: T[]) => void): () => void;
}

export interface OfflineQueueOptions<T> {
  /** Unique per queue — becomes the storage key. */
  storageKey: string;
  /** Applies one queued item against the real backend. */
  execute: (item: T) => Promise<void>;
  storage: KeyValueStorage;
  connectivity: ConnectivityWatcher;
}

export function createOfflineQueue<T>(opts: OfflineQueueOptions<T>): OfflineQueue<T> {
  const { storage, connectivity } = opts;

  let pending: T[] | null = null;
  let flushing = false;
  const listeners = new Set<(pending: T[]) => void>();

  async function load(): Promise<T[]> {
    if (pending) return pending;
    const raw = await storage.getItem(opts.storageKey);
    pending = raw ? (JSON.parse(raw) as T[]) : [];
    return pending;
  }

  async function persist() {
    await storage.setItem(opts.storageKey, JSON.stringify(pending ?? []));
    // Copy, not the live array — pending gets mutated in place afterwards
    // (shift/push), and a subscriber holding onto an earlier notification
    // would otherwise see it silently change out from under them.
    const snapshot = [...(pending ?? [])];
    listeners.forEach((l) => l(snapshot));
  }

  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      const items = await load();
      while (items.length) {
        try {
          await opts.execute(items[0]);
        } catch {
          // Leave it at the front and stop — order is preserved, and the
          // next reconnect (or manual flush) retries from here.
          return;
        }
        items.shift();
        await persist();
      }
    } finally {
      flushing = false;
    }
  }

  connectivity.subscribe((connected) => {
    if (connected) void flush();
  });

  return {
    async enqueue(item) {
      const items = await load();
      items.push(item);
      await persist();
      if (await connectivity.isConnected()) void flush();
    },
    flush,
    async getPending() {
      return [...(await load())];
    },
    subscribe(listener) {
      listeners.add(listener);
      void load().then((items) => listener([...items]));
      return () => listeners.delete(listener);
    },
  };
}
