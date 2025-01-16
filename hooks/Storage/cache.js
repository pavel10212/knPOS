import {MMKV} from "react-native-mmkv";

let localStore = null;

try {
  localStore = new MMKV({
    id: 'app-storage', // Add unique ID for storage instance
    encryptionKey: 'knPOS-storage' // Basic encryption
  });
} catch (error) {
  console.warn('Failed to initialize MMKV storage:', error);
  // Fallback to in-memory storage
  localStore = {
    set: (key, value) => console.warn('Storage unavailable:', key, value),
    get: (key) => {
      console.warn('Storage unavailable:', key);
      return null;
    },
    delete: (key) => console.warn('Storage unavailable:', key),
    clearAll: () => console.warn('Storage unavailable: clear all'),
  };
}

export { localStore };