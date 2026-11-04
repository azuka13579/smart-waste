import * as Location from "expo-location"

export type Coordinates = {
  latitude: number
  longitude: number
  /** Radius ketelitian dalam meter; `null` bila HP tidak melaporkannya. */
  accuracy: number | null
}

export type LocationResult =
  | { status: "found"; coordinates: Coordinates }
  /** Izin ditolak. `canAskAgain: false` berarti user harus mengaktifkannya dari pengaturan HP. */
  | { status: "denied"; canAskAgain: boolean }
  /** GPS / layanan lokasi HP sedang mati. */
  | { status: "disabled" }

/** Posisi HP saat ini untuk titik laporan. Lokasi terakhir dipakai bila GPS lambat mengunci posisi. */
export async function getCurrentLocation(): Promise<LocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync()
  if (!permission.granted) return { status: "denied", canAskAgain: permission.canAskAgain }

  if (!(await Location.hasServicesEnabledAsync())) return { status: "disabled" }

  const position =
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null)) ??
    (await Location.getLastKnownPositionAsync())
  if (!position) return { status: "disabled" }

  return {
    status: "found",
    coordinates: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
    },
  }
}
