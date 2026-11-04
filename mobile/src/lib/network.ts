import type { NetworkState } from "expo-network"

/**
 * Offline bila HP tidak terhubung ke jaringan apa pun, atau terhubung (misalnya WiFi tanpa kuota) tapi internet tidak terjangkau.
 * `undefined` berarti belum diketahui, dan tidak dianggap offline agar modal tidak muncul saat aplikasi baru dibuka.
 */
export function isOffline(state: Pick<NetworkState, "isConnected" | "isInternetReachable">) {
  return state.isConnected === false || state.isInternetReachable === false
}
