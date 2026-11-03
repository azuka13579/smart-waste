import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, SearchXIcon, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EmptyState } from "@/components/common/empty-state"
import { FilterSelect } from "@/components/common/filter-select"
import { Panel, PanelHeader, PanelSection } from "@/components/common/panel"
import { SearchInput } from "@/components/common/search-input"
import { DataTable } from "@/components/common/table/data-table"
import { Button } from "@/components/ui/button"
import { useQueryParams } from "@/hooks/use-query-params"
import { type UserRole, userRoleOptions } from "@/lib/enums/user"
import { formatNumber } from "@/lib/format"
import { getErrorMessage } from "@/lib/http"
import { deactivateUser, getUsers, updateUser } from "@/lib/services/user"
import { useSession } from "@/lib/session"
import type { User } from "@/lib/types/user"

import { getUserColumns } from "./columns"
import { UserFormDialog } from "./user-form-dialog"

const PAGE_SIZE = 20
const FILTER_KEYS = ["search", "role", "isActive"] as const
const ACTIVE_OPTIONS = [
  { value: "true" as const, label: "Aktif" },
  { value: "false" as const, label: "Nonaktif" },
]

export default function UsersPage() {
  const { user: currentUser } = useSession()
  const queryClient = useQueryClient()
  const { values, page, setParams, resetParams, hasActiveFilters } = useQueryParams(FILTER_KEYS)

  /** `undefined` = dialog tertutup, `null` = tambah pengguna, `User` = edit. */
  const [editing, setEditing] = useState<User | null | undefined>(undefined)
  const [toggling, setToggling] = useState<User | null>(null)

  const usersQuery = useQuery({
    queryKey: ["users", { ...values, page }],
    queryFn: () =>
      getUsers({
        search: values.search || undefined,
        role: (values.role || undefined) as UserRole | undefined,
        isActive: (values.isActive || undefined) as "true" | "false" | undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const toggleMutation = useMutation({
    mutationFn: (user: User) => (user.isActive ? deactivateUser(user.id) : updateUser(user.id, { isActive: true })),
    onSuccess: (response) => {
      toast.success(response.data.isActive ? `${response.data.name} diaktifkan kembali` : `${response.data.name} dinonaktifkan`)
      setToggling(null)
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["statistics"] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Gagal mengubah status pengguna")),
  })

  const columns = useMemo(
    () =>
      getUserColumns({
        currentUserId: currentUser?.id ?? "",
        onEdit: (user) => setEditing(user),
        onToggleActive: (user) => setToggling(user),
      }),
    [currentUser?.id],
  )

  const users = usersQuery.data?.data ?? []
  const pagination = usersQuery.data?.meta?.pagination ?? null

  return (
    <>
      <Panel>
        <PanelHeader
          title="Pengguna"
          description={
            pagination ? `${formatNumber(pagination.total)} pengguna${hasActiveFilters ? " sesuai filter" : ""}` : "Memuat pengguna..."
          }
          actions={
            <Button onClick={() => setEditing(null)}>
              <PlusIcon />
              Tambah pengguna
            </Button>
          }
        />

        <PanelSection className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput value={values.search} onSearch={(search) => setParams({ search })} placeholder="Cari nama atau email"
            label="Cari pengguna"
            className="sm:w-72"
          />
          <FilterSelect
            value={values.role as UserRole | ""}
            onChange={(role) => setParams({ role })}
            options={userRoleOptions}
            allLabel="Semua role"
            label="Filter role"
          />
          <FilterSelect
            value={values.isActive as "true" | "false" | ""}
            onChange={(isActive) => setParams({ isActive })}
            options={ACTIVE_OPTIONS}
            allLabel="Semua status"
            label="Filter status"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetParams}>
              Reset filter
            </Button>
          )}
        </PanelSection>

        <DataTable
          bordered={false}
          columns={columns}
          data={users}
          isLoading={usersQuery.isPending}
          pagination={pagination}
          onPageChange={(next) => setParams({ page: next })}
          onRowClick={(user) => setEditing(user)}
          getRowLabel={(user) => `Edit pengguna: ${user.name}`}
          emptyState={
            usersQuery.isError ? (
              <EmptyState icon={SearchXIcon} title="Gagal memuat pengguna" description={getErrorMessage(usersQuery.error)} />
            ) : hasActiveFilters ? (
              <EmptyState
                icon={SearchXIcon}
                title="Tidak ada pengguna yang cocok"
                description="Ubah kata kunci atau filter yang dipakai."
                action={
                  <Button variant="outline" size="sm" onClick={resetParams}>
                    Reset filter
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={UsersIcon} title="Belum ada pengguna" />
            )
          }
        />
      </Panel>

      <UserFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        user={editing}
        isSelf={!!editing && editing.id === currentUser?.id}
        onSaved={() => {
          setEditing(undefined)
          queryClient.invalidateQueries({ queryKey: ["users"] })
          queryClient.invalidateQueries({ queryKey: ["session"] })
        }}
      />

      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.isActive ? `Nonaktifkan ${toggling.name}?` : `Aktifkan ${toggling?.name ?? ""}?`}
        description={
          toggling?.isActive
            ? "Pengguna ini langsung keluar dari semua perangkat dan tidak bisa masuk sampai diaktifkan kembali. Laporannya tetap tersimpan."
            : "Pengguna ini bisa masuk kembali dengan password yang sama."
        }
        confirmText={toggling?.isActive ? "Nonaktifkan" : "Aktifkan"}
        destructive={toggling?.isActive}
        isPending={toggleMutation.isPending}
        onConfirm={() => toggling && toggleMutation.mutate(toggling)}
      />
    </>
  )
}
