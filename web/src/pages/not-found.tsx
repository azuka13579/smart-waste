import { ArrowLeftIcon } from "lucide-react"
import { Link } from "react-router"

import { BrandLogo } from "@/components/common/brand-logo"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <BrandLogo />
      <div className="flex flex-col gap-2">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="text-sm text-muted-foreground">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p>
      </div>
      <Button asChild>
        <Link to={ROUTES.HOME}>
          <ArrowLeftIcon />
          Kembali ke beranda
        </Link>
      </Button>
    </div>
  )
}
