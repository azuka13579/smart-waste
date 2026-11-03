import { CrosshairIcon, MapPinIcon, SearchIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { LocationMap } from "@/components/common/location-map"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatCoordinates } from "@/lib/format"
import { type Place, reverseGeocode, searchPlaces } from "@/lib/services/geocoding"

export type Coordinates = { latitude: number | null; longitude: number | null }

type LocationPickerProps = {
  value: Coordinates
  onChange: (value: Coordinates) => void
  /** Alamat terdekat dari titik yang dipilih (hasil pencarian atau reverse geocoding). */
  onAddressSuggestion?: (address: string) => void
  isInvalid?: boolean
}

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: "Izin lokasi ditolak. Aktifkan izin lokasi di browser, atau pilih titik di peta.",
  2: "Lokasi tidak bisa ditentukan. Coba lagi, atau pilih titik di peta.",
  3: "Waktu habis saat mencari lokasi. Coba lagi.",
}

const round = (value: number) => Number(value.toFixed(6))

/** Lokasi laporan: cari alamat, klik atau geser pin di peta, atau pakai GPS perangkat. */
export function LocationPicker({ value, onChange, onAddressSuggestion, isInvalid = false }: LocationPickerProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flyKey, setFlyKey] = useState(0)
  const reverseAbort = useRef<AbortController | null>(null)

  const debouncedQuery = useDebouncedValue(query.trim(), 600)
  const position: [number, number] | null =
    value.latitude !== null && value.longitude !== null ? [value.latitude, value.longitude] : null

  // Pencarian alamat (debounce 600 ms agar tetap di bawah batas 1 request/detik Nominatim)
  useEffect(() => {
    if (debouncedQuery.length < 3) return setResults([])
    const controller = new AbortController()
    setIsSearching(true)
    searchPlaces(debouncedQuery, controller.signal)
      .then(setResults)
      .catch((searchError: unknown) => {
        if (!controller.signal.aborted) setError(searchError instanceof Error ? searchError.message : "Pencarian lokasi gagal")
      })
      .finally(() => !controller.signal.aborted && setIsSearching(false))
    return () => controller.abort()
  }, [debouncedQuery])

  /** Pindahkan pin lalu cari alamat terdekat untuk diisikan ke kolom alamat. */
  const pick = ([latitude, longitude]: [number, number], { fly = false } = {}) => {
    setError(null)
    onChange({ latitude: round(latitude), longitude: round(longitude) })
    if (fly) setFlyKey((key) => key + 1)

    if (!onAddressSuggestion) return
    reverseAbort.current?.abort()
    const controller = new AbortController()
    reverseAbort.current = controller
    reverseGeocode(latitude, longitude, controller.signal)
      .then((address) => address && !controller.signal.aborted && onAddressSuggestion(address))
      .catch(() => undefined)
  }

  const selectPlace = (place: Place) => {
    reverseAbort.current?.abort()
    setQuery("")
    setResults([])
    setAccuracy(null)
    setError(null)
    onChange({ latitude: round(place.latitude), longitude: round(place.longitude) })
    setFlyKey((key) => key + 1)
    onAddressSuggestion?.(place.address)
  }

  const locate = () => {
    if (!("geolocation" in navigator)) return setError("Browser ini tidak mendukung lokasi. Pilih titik di peta.")
    setIsLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (geolocation) => {
        setIsLocating(false)
        setAccuracy(geolocation.coords.accuracy)
        pick([geolocation.coords.latitude, geolocation.coords.longitude], { fly: true })
      },
      (geolocationError) => {
        setIsLocating(false)
        setError(GEOLOCATION_ERRORS[geolocationError.code] ?? "Lokasi tidak bisa ditentukan.")
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Enter di kolom pencarian memilih hasil pertama, bukan mengirim form
              if (event.key !== "Enter") return
              event.preventDefault()
              if (results[0]) selectPlace(results[0])
            }}
            placeholder="Cari alamat atau nama tempat"
            aria-label="Cari alamat"
            className="pl-8"
          />
          {isSearching && <Spinner className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />}
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover shadow-md">
              {results.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => selectPlace(place)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{place.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{place.address}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="button" variant="outline" onClick={locate} disabled={isLocating}>
          {isLocating ? <Spinner /> : <CrosshairIcon />}
          Lokasi saat ini
        </Button>
      </div>

      <LocationMap
        position={position}
        onPick={(next) => {
          setAccuracy(null)
          pick(next)
        }}
        flyKey={flyKey}
        className={isInvalid ? "h-72 border-destructive" : "h-72"}
      />

      <p className="text-sm text-muted-foreground">
        {position ? (
          <>
            <span className="font-medium text-foreground tabular-nums">{formatCoordinates(position[0], position[1])}</span>
            {accuracy !== null && <> · akurasi GPS ±{Math.round(accuracy)} m</>}
            {" · "}geser pin untuk menyesuaikan
          </>
        ) : (
          "Klik peta untuk menandai lokasi sampah."
        )}
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
