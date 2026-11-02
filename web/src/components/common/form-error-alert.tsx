import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { getErrorMessage } from "@/lib/http"

type FormErrorAlertProps = {
  error: unknown
  /** Ganti pesan dari server, misalnya agar 401 tampil sebagai "Email atau password salah". */
  message?: string
}

/** Error dari server (bukan validasi per field) di atas form. */
export function FormErrorAlert({ error, message }: FormErrorAlertProps) {
  if (!error) return null

  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertDescription>{message ?? getErrorMessage(error)}</AlertDescription>
    </Alert>
  )
}
