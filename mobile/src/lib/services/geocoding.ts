/**
 * Alamat dari koordinat lewat Nominatim (OpenStreetMap), sama seperti web, agar format alamat konsisten.
 * Gratis tanpa API key tapi dibatasi ±1 request/detik. https://operations.osmfoundation.org/policies/nominatim/
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org"

type NominatimPlace = {
  display_name?: string
  error?: string
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

/** Alamat terdekat dari sebuah titik; `null` bila titiknya tidak dikenal atau layanan sedang gagal. */
export async function reverseGeocode(latitude: number, longitude: number) {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: "jsonv2", zoom: "18", "accept-language": "id" })
  // Kebijakan Nominatim meminta aplikasi mengenalkan diri lewat User-Agent
  const response = await fetch(`${NOMINATIM_URL}/reverse?${params.toString()}`, { headers: { "User-Agent": "SmartWaste-Mobile/1.0" } })
  if (!response.ok) return null
  const place = (await response.json()) as NominatimPlace
  return place.display_name ? shortenAddress(place.display_name) : null
}
