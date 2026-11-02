import { Spinner } from "@/components/ui/spinner"

export function FullPageLoader({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="size-6 text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
