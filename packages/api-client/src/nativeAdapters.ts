import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { ConnectivityWatcher, KeyValueStorage } from './offlineQueue';

export const asyncStorageAdapter: KeyValueStorage = AsyncStorage;

export const netInfoConnectivityAdapter: ConnectivityWatcher = {
  async isConnected() {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  },
  subscribe(listener) {
    return NetInfo.addEventListener((state) => {
      listener(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  },
};
