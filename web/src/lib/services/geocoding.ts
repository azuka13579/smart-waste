/**
 * Geocoding lewat Nominatim (OpenStreetMap): gratis tanpa API key, tapi dibatasi ±1 request/detik.
 * Karena itu pencarian di UI selalu di-debounce. https://operations.osmfoundation.org/policies/nominatim/
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org"

export type Place = {
  id: number
  /** Nama singkat untuk daftar hasil, misalnya "Pasar Dramaga". */
  name: string
  /** Alamat lengkap dari Nominatim. */
  address: string
  latitude: number
  longitude: number
}

type NominatimPlace = {
  place_id: number
  name?: string
  display_name: string
  lat: string
  lon: string
}

/** "Jl. Raya Dramaga, Babakan, Dramaga, Bogor, Jawa Barat, 16680, Indonesia" → empat bagian pertama tanpa kode pos/negara. */
function shortenAddress(displayName: string) {
  return displayName
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== "Indonesia" && !/^\d{5}$/.test(part))
    .slice(0, 4)
    .join(", ")
}

function toPlace(place: NominatimPlace): Place {
  return {
    id: place.place_id,
    name: place.name || place.display_name.split(",")[0],
    address: shortenAddress(place.display_name),
    latitude: Number(place.lat),
    longitude: Number(place.lon),
  }
}

export async function searchPlaces(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "5", countrycodes: "id", "accept-language": "id" })
  const response = await fetch(`${NOMINATIM_URL}/search?${params}`, { signal })
  if (!response.ok) throw new Error("Pencarian lokasi gagal")
  return ((await response.json()) as NominatimPlace[]).map(toPlace)
}

/** Alamat terdekat dari sebuah titik; `null` bila titiknya tidak dikenal (misalnya di laut). */
export async function reverseGeocode(latitude: number, longitude: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: "jsonv2", zoom: "18", "accept-language": "id" })
  const response = await fetch(`${NOMINATIM_URL}/reverse?${params}`, { signal })
  if (!response.ok) return null
  const place = (await response.json()) as Partial<NominatimPlace> & { error?: string }
  return place.display_name ? shortenAddress(place.display_name) : null
}
