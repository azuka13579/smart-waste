import { ConstructionIcon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

/** Penanda halaman yang dikerjakan di tahap berikutnya. */
export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <Empty className="rounded-xl border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ConstructionIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Halaman ini sedang dikerjakan.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
