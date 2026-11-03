import { cn } from "cn"
import { ImageOffIcon } from "lucide-react"
import { useState } from "react"

type ReportThumbnailProps = {
  src: string
  /** Dicoba bila `src` gagal dimuat, misalnya foto asli saat thumbnail laporan lama belum dibuat. */
  fallbackSrc?: string
  alt: string
  className?: string
}

/** Foto laporan dengan cadangan berurutan: `src`, lalu `fallbackSrc`, lalu ikon. */
export function ReportThumbnail({ src, fallbackSrc, alt, className }: ReportThumbnailProps) {
  const sources = fallbackSrc && fallbackSrc !== src ? [src, fallbackSrc] : [src]
  const [attempt, setAttempt] = useState(0)
  const current = sources[attempt]

  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {current ? (
        <img key={current} src={current} alt={alt} loading="lazy" onError={() => setAttempt((index) => index + 1)} className="size-full object-cover" />
      ) : (
        <ImageOffIcon className="size-4 text-muted-foreground" />
      )}
    </div>
  )
}
