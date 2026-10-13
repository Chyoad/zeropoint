"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Search01Icon,
  FilterHorizontalIcon,
  Edit02Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  Tick02Icon,
  Cancel01Icon,
  ShieldUserIcon,
  GlobalIcon,
  Building04Icon,
  Store01Icon,
  WarehouseIcon,
  StarIcon,
  AlertCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserDialog } from "@/components/user/user-dialog"
import { hapusUserAction } from "@/server/actions/user"
import {
  ROLE_CONFIG,
  urutkanUser,
  type UserWithCabang,
  type RolePengguna,
} from "@/lib/validasi/user"
import type { Cabang } from "@/lib/validasi/cabang"

export interface UserTableProps {
  initialData: UserWithCabang[]
  daftarCabang: Cabang[]
}

type RoleFilter = "semua" | RolePengguna

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getCabangIcon(tipe: string) {
  switch (tipe) {
    case "pusat":
      return Building04Icon
    case "gudang":
      return WarehouseIcon
    case "cabang":
    default:
      return Store01Icon
  }
}

export function UserTable({ initialData, daftarCabang }: UserTableProps) {
  const [data, setData] = React.useState<UserWithCabang[]>(initialData)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("semua")
  const [cabangFilter, setCabangFilter] = React.useState<string>("semua")

  // State Dialog Create / Edit
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [userToEdit, setUserToEdit] = React.useState<UserWithCabang | null>(null)

  // State Dialog Konfirmasi Hapus
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userToDelete, setUserToDelete] = React.useState<UserWithCabang | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Sinkronkan state jika initialData berubah
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Filter client-side
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // Filter role
      if (roleFilter !== "semua" && item.role !== roleFilter) {
        return false
      }

      // Filter cabang
      if (cabangFilter !== "semua") {
        const isGlobalRole =
          item.role === "superadmin" || item.role === "hq_manager"
        const hasAssignedCabang = item.cabang_list.some(
          (c) => c.id === cabangFilter
        )
        if (!isGlobalRole && !hasAssignedCabang) {
          return false
        }
      }

      // Filter query pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNama = item.nama_lengkap.toLowerCase().includes(q)
        const matchKode = item.kode.toLowerCase().includes(q)
        const matchEmail = item.email.toLowerCase().includes(q)
        const matchCabang = item.cabang_list.some((c) =>
          c.nama.toLowerCase().includes(q)
        )
        if (!matchNama && !matchKode && !matchEmail && !matchCabang) {
          return false
        }
      }

      return true
    })
  }, [data, searchQuery, roleFilter, cabangFilter])

  // Hitung jumlah tiap kategori untuk badge ringkasan
  const summaryCounts = React.useMemo(() => {
    return {
      total: data.length,
      superadmin: data.filter((u) => u.role === "superadmin").length,
      hq_manager: data.filter((u) => u.role === "hq_manager").length,
      branch_manager: data.filter((u) => u.role === "branch_manager").length,
      staff: data.filter((u) => u.role === "staff").length,
      viewer: data.filter((u) => u.role === "viewer").length,
      aktif: data.filter((u) => u.is_aktif).length,
    }
  }, [data])

  const handleOpenCreate = () => {
    setUserToEdit(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: UserWithCabang) => {
    setUserToEdit(user)
    setDialogOpen(true)
  }

  const handleOpenDelete = (user: UserWithCabang) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleSaveSuccess = (savedUser: UserWithCabang) => {
    setData((prev) => {
      const index = prev.findIndex((u) => u.id === savedUser.id)
      if (index !== -1) {
        const updated = [...prev]
        updated[index] = savedUser
        return urutkanUser(updated)
      }
      return urutkanUser([...prev, savedUser])
    })
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      const res = await hapusUserAction(userToDelete.id)

      if (res.success) {
        toast.success(
          `Pengguna "${userToDelete.nama_lengkap}" berhasil dinonaktifkan.`
        )
        setData((prev) => prev.filter((u) => u.id !== userToDelete.id))
        setDeleteDialogOpen(false)
        setUserToDelete(null)
      } else {
        toast.error(res.error || "Gagal menghapus pengguna.")
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus pengguna."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Tombol Tambah */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pengguna & Hak Akses
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola data staf, peran RBAC hierarki, dan hak akses penugasan multi-cabang.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={1.5} className="size-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Ringkasan Metrik Pengguna */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">
            Total Pengguna
          </div>
          <div className="text-xl font-bold mt-1">{summaryCounts.total}</div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-medium text-purple-600 dark:text-purple-400">
            Superadmin
          </div>
          <div className="text-xl font-bold mt-1 text-purple-700 dark:text-purple-300">
            {summaryCounts.superadmin}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            HQ Manager
          </div>
          <div className="text-xl font-bold mt-1 text-blue-700 dark:text-blue-300">
            {summaryCounts.hq_manager}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
            Branch Manager
          </div>
          <div className="text-xl font-bold mt-1 text-cyan-700 dark:text-cyan-300">
            {summaryCounts.branch_manager}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Staff & Viewer
          </div>
          <div className="text-xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
            {summaryCounts.staff + summaryCounts.viewer}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">
            Status Aktif
          </div>
          <div className="text-xl font-bold mt-1">
            {summaryCounts.aktif} / {summaryCounts.total}
          </div>
        </div>
      </div>

      {/* Filter & Toolbar Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Cari berdasarkan nama, email, kode USR, atau cabang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Role */}
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              if (val) setRoleFilter(val as RoleFilter)
            }}
          >
            <SelectTrigger className="w-[180px] gap-2">
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                strokeWidth={1.5}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <SelectValue placeholder="Semua Peran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Peran</SelectItem>
              {(Object.keys(ROLE_CONFIG) as RolePengguna[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_CONFIG[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Cabang */}
          <Select
            value={cabangFilter}
            onValueChange={(val) => {
              if (val) setCabangFilter(val)
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Semua Cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Cabang</SelectItem>
              {daftarCabang.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[280px]">Pengguna</TableHead>
              <TableHead className="w-[220px]">Email & Kontak</TableHead>
              <TableHead className="w-[180px]">Peran (Role)</TableHead>
              <TableHead>Cabang Ditugaskan</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <HugeiconsIcon
                      icon={ShieldUserIcon}
                      strokeWidth={1.5}
                      className="size-8 text-muted-foreground/40 mb-1"
                    />
                    <p className="text-sm font-medium">
                      Tidak ada pengguna yang cocok dengan filter
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Coba ubah kata kunci pencarian atau reset pilihan filter.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role]
                const isGlobalRole =
                  user.role === "superadmin" || user.role === "hq_manager"
                const initials = getInitials(user.nama_lengkap)

                return (
                  <TableRow key={user.id} className="hover:bg-muted/30">
                    {/* Pengguna (Avatar + Nama + Kode) */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border">
                          {user.avatar_url && (
                            <AvatarImage
                              src={user.avatar_url}
                              alt={user.nama_lengkap}
                            />
                          )}
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground text-sm">
                            {user.nama_lengkap}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {user.kode}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email & Kontak */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {user.email}
                        </span>
                        {user.telepon ? (
                          <span className="text-xs text-muted-foreground">
                            {user.telepon}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Peran (Role Badge) */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${roleConfig.badgeClass}`}
                      >
                        {roleConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Cabang Ditugaskan */}
                    <TableCell>
                      {isGlobalRole ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-xs gap-1.5 font-normal bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            <HugeiconsIcon
                              icon={GlobalIcon}
                              strokeWidth={1.5}
                              className="size-3.5 text-purple-600"
                            />
                            <span>Semua Cabang (Global)</span>
                          </Badge>
                          {user.cabang_list.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              Default:{" "}
                              {user.cabang_list.find(
                                (c) => c.id === user.cabang_default_id
                              )?.nama || user.cabang_list[0].nama}
                            </span>
                          )}
                        </div>
                      ) : user.cabang_list.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.cabang_list.map((cabang) => {
                            const isDefault =
                              cabang.is_default ||
                              cabang.id === user.cabang_default_id
                            const Icon = getCabangIcon(cabang.tipe)

                            return (
                              <Badge
                                key={cabang.id}
                                variant="outline"
                                className={`text-xs gap-1 font-normal py-0.5 ${
                                  isDefault
                                    ? "border-amber-300 bg-amber-50/60 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                                    : "border-border bg-background"
                                }`}
                              >
                                <HugeiconsIcon
                                  icon={Icon}
                                  strokeWidth={1.5}
                                  className="size-3 text-muted-foreground"
                                />
                                <span>{cabang.nama}</span>
                                {isDefault && (
                                  <HugeiconsIcon
                                    icon={StarIcon}
                                    strokeWidth={1.5}
                                    className="size-3 text-amber-500 fill-amber-500"
                                  />
                                )}
                              </Badge>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Belum ditugaskan
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {user.is_aktif ? (
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            strokeWidth={1.5}
                            className="size-3"
                          />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            strokeWidth={1.5}
                            className="size-3"
                          />
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>

                    {/* Menu Aksi */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 p-0"
                            />
                          }
                        >
                          <HugeiconsIcon
                            icon={MoreHorizontalIcon}
                            strokeWidth={1.5}
                            className="size-4"
                          />
                          <span className="sr-only">Menu aksi pengguna</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(user)}
                            className="gap-2 cursor-pointer"
                          >
                            <HugeiconsIcon
                              icon={Edit02Icon}
                              strokeWidth={1.5}
                              className="size-4 text-muted-foreground"
                            />
                            <span>Edit Pengguna</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(user)}
                            className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={1.5}
                              className="size-4"
                            />
                            <span>Hapus / Nonaktifkan</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dialog Tambah / Edit Pengguna */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userToEdit={userToEdit}
        daftarCabang={daftarCabang}
        onSuccess={handleSaveSuccess}
      />

      {/* Modal Konfirmasi Hapus Pengguna */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={1.5}
                className="size-5"
              />
              <span>Konfirmasi Hapus Pengguna</span>
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menonaktifkan pengguna{" "}
              <strong className="text-foreground">
                {userToDelete?.nama_lengkap} ({userToDelete?.kode})
              </strong>
              ? Data akun tidak akan dihapus secara fisik demi integritas audit riwayat
              transaksi persediaan (soft delete).
            </DialogDescription>
          </DialogHeader>

          {userToDelete?.role === "superadmin" && (
            <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
              <strong>Peringatan Keamanan:</strong> Pengguna ini memiliki peran
              Superadmin. Sistem memblokir penghapusan jika ini adalah Superadmin
              terakhir.
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
            >
              {isDeleting ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    strokeWidth={1.5}
                    className="size-4 animate-spin me-1.5"
                  />
                  <span>Menghapus...</span>
                </>
              ) : (
                "Hapus Pengguna"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
