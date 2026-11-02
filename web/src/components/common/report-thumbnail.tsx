import { cn } from "cn"
import { ImageOffIcon } from "lucide-react"
import { useState } from "react"

type ReportThumbnailProps = {
  src: string
  alt: string
  className?: string
}

/** Foto laporan dengan fallback bila URL foto tidak bisa dimuat. */
export function ReportThumbnail({ src, alt, className }: ReportThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted", className)}>
      {hasError ? (
        <ImageOffIcon className="size-4 text-muted-foreground" />
      ) : (
        <img src={src} alt={alt} loading="lazy" onError={() => setHasError(true)} className="size-full object-cover" />
      )}
    </div>
  )
}
