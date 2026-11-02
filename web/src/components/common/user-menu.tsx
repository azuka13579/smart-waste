import { useMutation } from "@tanstack/react-query"
import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { UserAvatar } from "@/components/common/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { ROUTES } from "@/lib/constants"
import { userRoleLabels } from "@/lib/enums/user"
import { getErrorMessage } from "@/lib/http"
import { logout } from "@/lib/services/auth"
import { useSession, useSetSession } from "@/lib/session"

export function UserMenu() {
  const { user } = useSession()
  const setSession = useSetSession()
  const navigate = useNavigate()
  const { isMobile } = useSidebar()

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setSession(null)
      navigate(ROUTES.LOGIN, { replace: true })
      toast.success("Berhasil keluar")
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal keluar")),
  })

  if (!user) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <UserAvatar name={user.name} className="size-8" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{userRoleLabels[user.role]}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" sideOffset={4} className="w-60">
            <DropdownMenuLabel className="flex items-center gap-2 font-normal">
              <UserAvatar name={user.name} className="size-8" />
              <div className="grid flex-1 text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to={ROUTES.PROFILE}>
                  <UserIcon />
                  Profil Saya
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={logoutMutation.isPending} onSelect={() => logoutMutation.mutate()}>
              <LogOutIcon />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
