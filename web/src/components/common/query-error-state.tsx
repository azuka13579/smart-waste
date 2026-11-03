import { CircleAlertIcon, RotateCwIcon } from "lucide-react"

import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/http"

type QueryErrorStateProps = {
  /** Apa yang gagal dimuat, misalnya "statistik". */
  subject: string
  error: unknown
  onRetry: () => void
  isRetrying?: boolean
  className?: string
}

/** Pengganti data yang gagal dimuat. Jangan pernah tampilkan 0 atau daftar kosong saat request gagal. */
export function QueryErrorState({ subject, error, onRetry, isRetrying = false, className }: QueryErrorStateProps) {
  return (
    <EmptyState
      icon={CircleAlertIcon}
      title={`Gagal memuat ${subject}`}
      description={getErrorMessage(error)}
      action={
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          <RotateCwIcon className={isRetrying ? "animate-spin" : undefined} />
          Coba lagi
        </Button>
      }
      className={className}
    />
  )
}
