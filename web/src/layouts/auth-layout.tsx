import { LeafIcon } from "lucide-react"
import { Outlet } from "react-router"

import { APP_NAME } from "@/lib/constants"

export function AuthLayout() {
  return (
    <div className="relative flex min-h-svh flex-col bg-[oklch(0.42_0.095_157)]">
      {/* Corak titik halus agar latar hijau tidak polos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,oklch(1_0_0/0.12)_1px,transparent_1px)] [background-size:20px_20px]"
      />

      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-white text-primary">
              <LeafIcon className="size-4" />
            </div>
            <span className="text-sm font-semibold text-white">{APP_NAME}</span>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-lg shadow-black/10 sm:p-8">
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="relative px-4 py-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {APP_NAME} Management System
      </footer>
    </div>
  )
}
