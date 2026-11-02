import { cn } from "cn"
import { LeafIcon } from "lucide-react"

import { APP_NAME } from "@/lib/constants"

type BrandLogoProps = {
  className?: string
  /** Sembunyikan teks, misalnya saat sidebar diciutkan. */
  iconOnly?: boolean
  inverted?: boolean
}

export function BrandLogo({ className, iconOnly = false, inverted = false }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          inverted ? "bg-white/15 text-white" : "bg-primary text-primary-foreground",
        )}
      >
        <LeafIcon className="size-5" />
      </div>
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className={cn("text-base font-bold", inverted ? "text-white" : "text-foreground")}>{APP_NAME}</span>
          <span className={cn("text-xs", inverted ? "text-white/70" : "text-muted-foreground")}>Management System</span>
        </div>
      )}
    </div>
  )
}
