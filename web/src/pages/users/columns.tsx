import type { ColumnDef } from "@tanstack/react-table"
import { cn } from "cn"
import { MoreHorizontalIcon, PencilIcon, UserCheckIcon, UserXIcon } from "lucide-react"

import type { ColumnMeta } from "@/components/common/table/data-table"
import { UserAvatar } from "@/components/common/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { userRoleLabels } from "@/lib/enums/user"
import { formatDate } from "@/lib/format"
import type { User } from "@/lib/types/user"

const meta = (className: string): ColumnMeta => ({ className })

type UserColumnHandlers = {
  currentUserId: string
  onEdit: (user: User) => void
  onToggleActive: (user: User) => void
}

export function getUserColumns({ currentUserId, onEdit, onToggleActive }: UserColumnHandlers): ColumnDef<User, unknown>[] {
  return [
    {
      id: "user",
      header: "Pengguna",
      cell: ({ row: { original: user } }) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={user.name} className="size-9" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">
              {user.name}
              {user.id === currentUserId && <span className="ml-2 text-xs font-normal text-muted-foreground">(kamu)</span>}
            </span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      meta: meta("w-28"),
      cell: ({ row: { original: user } }) => <span className="font-medium">{userRoleLabels[user.role]}</span>,
    },
    {
      id: "status",
      header: "Status",
      meta: meta("w-28"),
      cell: ({ row: { original: user } }) => (
        <span className={cn("inline-flex items-center gap-2 text-sm font-medium", !user.isActive && "text-muted-foreground")}>
          <span aria-hidden className={cn("size-2 rounded-full", user.isActive ? "bg-status-completed" : "bg-muted-foreground/40")} />
          {user.isActive ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Bergabung",
      meta: meta("hidden w-32 md:table-cell"),
      cell: ({ row: { original: user } }) => formatDate(user.createdAt),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      meta: meta("w-14 text-right"),
      cell: ({ row: { original: user } }) => {
        const isSelf = user.id === currentUserId
        return (
          // Klik di menu tidak boleh ikut memicu klik baris (membuka dialog edit)
          <div onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${user.name}`}>
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={() => onEdit(user)}>
                  <PencilIcon />
                  Edit
                </DropdownMenuItem>
                {!isSelf && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant={user.isActive ? "destructive" : "default"} onSelect={() => onToggleActive(user)}>
                      {user.isActive ? <UserXIcon /> : <UserCheckIcon />}
                      {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
