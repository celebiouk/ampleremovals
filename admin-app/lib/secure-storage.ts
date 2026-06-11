import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";

/**
 * Encrypted storage for the offline cache.
 *
 * Values are AES-encrypted before they touch AsyncStorage, using a 256-bit key
 * that lives in the device's hardware-backed secure store (iOS Keychain /
 * Android Keystore). So the persisted cache (which includes customer data) is
 * unreadable at rest, even if the device's app storage is inspected.
 */

const KEY_NAME = "ample_admin_cache_key_v1";
let cachedKey: string | null = null;

/** Get (or lazily create) the per-device encryption key from the secure store. */
async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;

  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    // 32 random bytes → 64-char hex passphrase, from a CSPRNG.
    const bytes = Crypto.getRandomBytes(32);
    key = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    await SecureStore.setItemAsync(KEY_NAME, key);
  }
  cachedKey = key;
  return key;
}

export const encryptedStorage = {
  async getItem(name: string): Promise<string | null> {
    const cipher = await AsyncStorage.getItem(name);
    if (!cipher) return null;
    try {
      const key = await getKey();
      const plain = CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
      return plain || null;
    } catch {
      // Corrupt or key-mismatch (e.g. upgraded from an old build) → drop it.
      await AsyncStorage.removeItem(name);
      return null;
    }
  },

  async setItem(name: string, value: string): Promise<void> {
    const key = await getKey();
    const cipher = CryptoJS.AES.encrypt(value, key).toString();
    await AsyncStorage.setItem(name, cipher);
  },

  async removeItem(name: string): Promise<void> {
    await AsyncStorage.removeItem(name);
  },
};
