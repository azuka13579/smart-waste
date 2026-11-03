import { Outlet } from "react-router"

import { AppBreadcrumbs } from "@/components/common/app-breadcrumbs"
import { AppSidebar } from "@/components/common/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <div aria-hidden className="mr-2 h-4 w-px bg-border" />
          <AppBreadcrumbs />
        </header>
        <main className="flex w-full flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
