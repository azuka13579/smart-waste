import { Skeleton } from "@/components/ui/skeleton"

/** Pengganti halaman selama chunk halaman sedang dimuat. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat halaman">
      <Skeleton className="h-[74px] w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  )
}
