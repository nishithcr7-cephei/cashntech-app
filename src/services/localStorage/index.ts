import {MMKV} from 'react-native-mmkv';

type StorageLike = {
  set: (key: string, value: string | number | boolean) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
  clearAll: () => void;
};

const createFallbackStorage = (): StorageLike => {
  const map = new Map<string, string>();
  return {
    set: (key, value) => map.set(key, String(value)),
    getString: key => map.get(key),
    delete: key => map.delete(key),
    clearAll: () => map.clear(),
  };
};

const createStorage = (): StorageLike => {
  try {
    return new MMKV();
  } catch (error) {
    // MMKV 3.x requires New Architecture/TurboModules.
    // Fallback allows Appetize/CI old-arch builds to boot.
    console.warn('[storage] MMKV unavailable, using in-memory fallback.', error);
    return createFallbackStorage();
  }
};

export const storage = createStorage();

export const clearAllStorage = () => {
  storage.clearAll();
};

export const setStorage = <T>(key: string, value: T) => {
  if (typeof value === 'string') {
    storage.set(key, value);
  } else {
    storage.set(key, JSON.stringify(value));
  }
};

export const getStorage = (key: string, toJson?: boolean) => {
  try {
    if (toJson) {
      return JSON.parse(storage.getString(key) ?? '');
    }
    return storage.getString(key);
  } catch (error) {
    return undefined;
  }
};

export const removeStorage = (key: string) => {
  storage.delete(key);
};
