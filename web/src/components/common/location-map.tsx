import "leaflet/dist/leaflet.css"

import { cn } from "cn"
import L, { type LatLngExpression } from "leaflet"
import { useEffect, type ReactNode } from "react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"

/** Pusat kota Bogor, dipakai saat belum ada titik yang dipilih. */
export const DEFAULT_MAP_CENTER: [number, number] = [-6.595038, 106.816635]

/** Pin bulat hijau dari CSS, agar tidak bergantung pada gambar marker bawaan Leaflet yang sering rusak di bundler. */
const pinIcon = L.divIcon({
  className: "",
  html: '<span class="block size-5 rounded-full border-[3px] border-white bg-primary shadow-[0_1px_4px_rgb(0_0_0/0.4)]"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

type LocationMapProps = {
  /** Titik yang ditandai; kosong berarti belum ada pin. */
  position: [number, number] | null
  zoom?: number
  className?: string
  /** Klik di peta atau geser pin; tanpa ini peta hanya untuk dilihat. */
  onPick?: (position: [number, number]) => void
  /** Setiap kali nilainya berubah, peta terbang ke `position` (misalnya setelah GPS atau pencarian). */
  flyKey?: number
  children?: ReactNode
}

/** Peta OpenStreetMap dengan satu pin. `isolate` menjaga z-index Leaflet tetap di bawah dialog dan dropdown. */
export function LocationMap({ position, zoom = 16, className, onPick, flyKey, children }: LocationMapProps) {
  return (
    <div className={cn("isolate overflow-hidden rounded-lg border", className)}>
      <MapContainer
        center={position ?? DEFAULT_MAP_CENTER}
        zoom={position ? zoom : 13}
        // Scroll halaman tidak boleh "tersangkut" men-zoom peta; zoom lewat tombol +/− atau pinch
        scrollWheelZoom={false}
        className="size-full"
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {position && (
          <Marker
            position={position}
            icon={pinIcon}
            draggable={!!onPick}
            eventHandlers={
              onPick && {
                dragend: (event) => {
                  const { lat, lng } = (event.target as L.Marker).getLatLng()
                  onPick([lat, lng])
                },
              }
            }
          />
        )}
        {onPick && <PickOnClick onPick={onPick} />}
        <FlyToPosition position={position} zoom={zoom} flyKey={flyKey} />
        {children}
      </MapContainer>
    </div>
  )
}

function PickOnClick({ onPick }: { onPick: (position: [number, number]) => void }) {
  useMapEvents({ click: (event) => onPick([event.latlng.lat, event.latlng.lng]) })
  return null
}

function FlyToPosition({ position, zoom, flyKey }: { position: [number, number] | null; zoom: number; flyKey?: number }) {
  const map = useMap()

  useEffect(() => {
    if (flyKey === undefined || !position) return
    map.flyTo(position as LatLngExpression, Math.max(map.getZoom(), zoom), { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya terbang saat flyKey berubah, bukan saat pin digeser
  }, [flyKey])

  return null
}
