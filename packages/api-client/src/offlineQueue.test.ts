import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOfflineQueue, type ConnectivityWatcher, type KeyValueStorage } from './offlineQueue.js';

function memoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
  };
}

/** Connectivity you control by hand from the test, not a real network. */
function fakeConnectivity(initiallyConnected: boolean) {
  let connected = initiallyConnected;
  const listeners = new Set<(c: boolean) => void>();
  const watcher: ConnectivityWatcher = {
    async isConnected() {
      return connected;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    watcher,
    goOnline() {
      connected = true;
      listeners.forEach((l) => l(true));
    },
  };
}

test('enqueues and flushes immediately while online', async () => {
  const executed: string[] = [];
  const { watcher } = fakeConnectivity(true);
  const queue = createOfflineQueue<string>({
    storageKey: 'q1',
    storage: memoryStorage(),
    connectivity: watcher,
    execute: async (item) => {
      executed.push(item);
    },
  });

  await queue.enqueue('bump-order-1');
  // enqueue's flush is fire-and-forget; wait a tick for it to run.
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(executed, ['bump-order-1']);
  assert.deepEqual(await queue.getPending(), []);
});

test('persists items while offline instead of executing them', async () => {
  const executed: string[] = [];
  const { watcher } = fakeConnectivity(false);
  const queue = createOfflineQueue<string>({
    storageKey: 'q2',
    storage: memoryStorage(),
    connectivity: watcher,
    execute: async (item) => {
      executed.push(item);
    },
  });

  await queue.enqueue('toggle-line-1');
  await queue.enqueue('toggle-line-2');

  assert.deepEqual(executed, []);
  assert.deepEqual(await queue.getPending(), ['toggle-line-1', 'toggle-line-2']);
});

test('replays queued items in order once connectivity returns', async () => {
  const executed: string[] = [];
  const { watcher, goOnline } = fakeConnectivity(false);
  const queue = createOfflineQueue<string>({
    storageKey: 'q3',
    storage: memoryStorage(),
    connectivity: watcher,
    execute: async (item) => {
      executed.push(item);
    },
  });

  await queue.enqueue('a');
  await queue.enqueue('b');
  await queue.enqueue('c');
  assert.deepEqual(executed, []);

  goOnline();
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(executed, ['a', 'b', 'c']);
  assert.deepEqual(await queue.getPending(), []);
});

test('stops at the first failure and keeps the item queued, in order', async () => {
  const executed: string[] = [];
  const { watcher } = fakeConnectivity(true);
  const queue = createOfflineQueue<string>({
    storageKey: 'q4',
    storage: memoryStorage(),
    connectivity: watcher,
    execute: async (item) => {
      if (item === 'fails') throw new Error('backend rejected it');
      executed.push(item);
    },
  });

  await queue.enqueue('ok-1');
  await new Promise((r) => setTimeout(r, 10));
  await queue.enqueue('fails');
  await queue.enqueue('ok-2');
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(executed, ['ok-1']);
  assert.deepEqual(await queue.getPending(), ['fails', 'ok-2']);
});

test('subscribe reports the current pending list, then updates as it changes', async () => {
  const { watcher } = fakeConnectivity(false);
  const queue = createOfflineQueue<string>({
    storageKey: 'q5',
    storage: memoryStorage(),
    connectivity: watcher,
    execute: async () => {},
  });

  const snapshots: string[][] = [];
  queue.subscribe((pending) => snapshots.push(pending));
  await new Promise((r) => setTimeout(r, 10));

  await queue.enqueue('x');
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(snapshots[0], []);
  assert.deepEqual(snapshots.at(-1), ['x']);
});
