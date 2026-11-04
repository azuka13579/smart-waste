import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const TOKEN_STORAGE_KEY = "smart-waste.session-token"

/**
 * Token sesi di SecureStore (Keystore Android / Keychain iOS). SecureStore tidak tersedia di web,
 * jadi pratinjau `expo start --web` saat development memakai localStorage.
 */
export const tokenStorage = {
  get: () => (Platform.OS === "web" ? Promise.resolve(localStorage.getItem(TOKEN_STORAGE_KEY)) : SecureStore.getItemAsync(TOKEN_STORAGE_KEY)),

  set: async (token: string | null) => {
    if (Platform.OS === "web") {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
      else localStorage.removeItem(TOKEN_STORAGE_KEY)
      return
    }
    if (token) await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token)
    else await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY)
  },
}
