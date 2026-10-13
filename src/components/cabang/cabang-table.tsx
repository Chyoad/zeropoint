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
  Location01Icon,
  Call02Icon,
  Store01Icon,
  Building04Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { BranchTypeBadge } from "@/components/layout/branch-switcher"
import { CabangDialog } from "@/components/cabang/cabang-dialog"
import { hapusCabangAction } from "@/server/actions/cabang"
import { urutkanCabang, type Cabang } from "@/lib/validasi/cabang"

export interface CabangTableProps {
  initialData: Cabang[]
}

type TipeFilter = "semua" | "pusat" | "cabang" | "gudang"

export function CabangTable({ initialData }: CabangTableProps) {
  const [data, setData] = React.useState<Cabang[]>(initialData)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [tipeFilter, setTipeFilter] = React.useState<TipeFilter>("semua")

  // State Dialog Form Create/Edit
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [cabangToEdit, setCabangToEdit] = React.useState<Cabang | null>(null)

  // State Dialog Konfirmasi Hapus
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [cabangToDelete, setCabangToDelete] = React.useState<Cabang | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Sinkronkan state jika initialData berubah
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Filter client-side
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // Filter tipe
      if (tipeFilter !== "semua" && item.tipe !== tipeFilter) {
        return false
      }

      // Filter query pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNama = item.nama.toLowerCase().includes(q)
        const matchKode = item.kode.toLowerCase().includes(q)
        const matchKota = item.kota?.toLowerCase().includes(q) ?? false
        const matchAlamat = item.alamat?.toLowerCase().includes(q) ?? false
        if (!matchNama && !matchKode && !matchKota && !matchAlamat) {
          return false
        }
      }

      return true
    })
  }, [data, searchQuery, tipeFilter])

  // Hitung jumlah tiap kategori untuk badge ringkasan
  const summaryCounts = React.useMemo(() => {
    return {
      total: data.length,
      pusat: data.filter((c) => c.tipe === "pusat").length,
      cabang: data.filter((c) => c.tipe === "cabang").length,
      gudang: data.filter((c) => c.tipe === "gudang").length,
      aktif: data.filter((c) => c.is_aktif).length,
    }
  }, [data])

  const handleOpenCreate = () => {
    setCabangToEdit(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (cabang: Cabang) => {
    setCabangToEdit(cabang)
    setDialogOpen(true)
  }

  const handleOpenDelete = (cabang: Cabang) => {
    setCabangToDelete(cabang)
    setDeleteDialogOpen(true)
  }

  const handleSaveSuccess = (saved: Cabang) => {
    setData((prev) => {
      const idx = prev.findIndex((item) => item.id === saved.id)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = saved
        return urutkanCabang(next)
      }
      return urutkanCabang([...prev, saved])
    })
  }

  const handleConfirmDelete = async () => {
    if (!cabangToDelete) return
    try {
      setIsDeleting(true)
      const res = await hapusCabangAction(cabangToDelete.id)
      if (res.success) {
        toast.success(`Fasilitas "${cabangToDelete.nama}" berhasil dinonaktifkan.`)
        setData((prev) => prev.filter((item) => item.id !== cabangToDelete.id))
        setDeleteDialogOpen(false)
        setCabangToDelete(null)
      } else {
        toast.error(res.error || "Gagal menghapus fasilitas.")
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Cabang & Gudang
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data kantor pusat, cabang operasional retail, dan gudang logistik persediaan.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="shrink-0">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 me-1.5" />
          <span>Tambah Fasilitas</span>
        </Button>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <HugeiconsIcon icon={Building04Icon} strokeWidth={1.5} className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Kantor Pusat</div>
            <div className="text-lg font-bold">{summaryCounts.pusat} Lokasi</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <HugeiconsIcon icon={Store01Icon} strokeWidth={1.5} className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Cabang Retail</div>
            <div className="text-lg font-bold">{summaryCounts.cabang} Lokasi</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <HugeiconsIcon icon={WarehouseIcon} strokeWidth={1.5} className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Gudang Logistik</div>
            <div className="text-lg font-bold">{summaryCounts.gudang} Lokasi</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl border bg-card shadow-xs">
          <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={1.5} className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Aktif</div>
            <div className="text-lg font-bold">
              {summaryCounts.aktif} / {summaryCounts.total}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md relative">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={1.5}
            className="absolute start-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Cari kode, nama cabang, atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={FilterHorizontalIcon}
            strokeWidth={1.5}
            className="size-4 text-muted-foreground hidden sm:inline-block"
          />
          <Select
            value={tipeFilter}
            onValueChange={(val) => {
              if (val) setTipeFilter(val as TipeFilter)
            }}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filter Tipe Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Tipe</SelectItem>
              <SelectItem value="pusat">Kantor Pusat (HQ)</SelectItem>
              <SelectItem value="cabang">Cabang Operasional</SelectItem>
              <SelectItem value="gudang">Gudang Logistik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[110px]">Kode</TableHead>
              <TableHead className="min-w-[200px]">Nama Fasilitas & Alamat</TableHead>
              <TableHead className="w-[120px]">Tipe</TableHead>
              <TableHead className="min-w-[150px]">Kota / Wilayah</TableHead>
              <TableHead className="min-w-[140px]">Telepon</TableHead>
              <TableHead className="w-[110px] text-center">Status</TableHead>
              <TableHead className="w-[70px] text-end">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="size-5" />
                    </div>
                    <div className="font-medium text-sm text-foreground">
                      Tidak ada fasilitas ditemukan
                    </div>
                    <div className="text-xs">
                      {searchQuery || tipeFilter !== "semua"
                        ? "Coba ubah kata kunci pencarian atau reset filter tipe lokasi."
                        : "Belum ada cabang atau gudang terdaftar."}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                  {/* Kode */}
                  <TableCell>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/80 text-foreground border border-border/60 inline-block">
                      {item.kode}
                    </span>
                  </TableCell>

                  {/* Nama & Alamat */}
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground">
                      {item.nama}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                      {item.alamat || "Alamat belum diatur"}
                    </div>
                  </TableCell>

                  {/* Tipe Badge */}
                  <TableCell>
                    <BranchTypeBadge tipe={item.tipe} />
                  </TableCell>

                  {/* Kota */}
                  <TableCell>
                    {item.kota ? (
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <HugeiconsIcon
                          icon={Location01Icon}
                          strokeWidth={1.5}
                          className="size-3.5 text-muted-foreground shrink-0"
                        />
                        <span className="truncate">{item.kota}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Telepon */}
                  <TableCell>
                    {item.telepon ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-foreground">
                        <HugeiconsIcon
                          icon={Call02Icon}
                          strokeWidth={1.5}
                          className="size-3.5 text-muted-foreground shrink-0"
                        />
                        <span>{item.telepon}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">-</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    {item.is_aktif ? (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1"
                      >
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] font-semibold bg-muted/50 text-muted-foreground border-border gap-1"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                        Nonaktif
                      </Badge>
                    )}
                  </TableCell>

                  {/* Aksi Dropdown */}
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Menu aksi untuk ${item.nama}`}
                          />
                        }
                      >
                        <HugeiconsIcon
                          icon={MoreHorizontalIcon}
                          strokeWidth={1.5}
                          className="size-4"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(item)}
                          className="cursor-pointer gap-2"
                        >
                          <HugeiconsIcon
                            icon={Edit02Icon}
                            strokeWidth={1.5}
                            className="size-4 text-muted-foreground"
                          />
                          <span>Edit Data</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDelete(item)}
                          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            strokeWidth={1.5}
                            className="size-4 text-destructive"
                          />
                          <span>Hapus Cabang</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer info count */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          <span>
            Menampilkan <strong>{filteredData.length}</strong> dari{" "}
            <strong>{data.length}</strong> fasilitas
          </span>
          {tipeFilter !== "semua" && (
            <button
              onClick={() => setTipeFilter("semua")}
              className="text-primary hover:underline font-medium"
            >
              Reset filter tipe
            </button>
          )}
        </div>
      </div>

      {/* Modal Dialog Form Tambah / Edit */}
      <CabangDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cabangToEdit={cabangToEdit}
        onSuccess={handleSaveSuccess}
      />

      {/* Modal Dialog Konfirmasi Hapus */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={1.5}
                className="size-5"
              />
              <span>Hapus Cabang / Fasilitas</span>
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus fasilitas{" "}
              <strong className="text-foreground">
                {cabangToDelete?.nama}
              </strong>{" "}
              ({cabangToDelete?.kode})? Data akan dinonaktifkan secara aman (soft-delete).
            </DialogDescription>
          </DialogHeader>

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
              onClick={handleConfirmDelete}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Fasilitas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
