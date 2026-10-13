"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Search01Icon,
  Edit02Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PackageIcon,
  Layers01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Loading03Icon,
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
import type {
  ProdukWithRelations,
  KategoriProduk,
  TipeProduk,
} from "@/lib/validasi/produk"
import { hapusProdukAction } from "@/server/actions/produk"

export interface ProdukTableProps {
  initialData: ProdukWithRelations[]
  daftarKategori: KategoriProduk[]
}

export function ProductTypeBadge({ tipe }: { tipe: TipeProduk }) {
  switch (tipe) {
    case "persediaan":
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
          Persediaan
        </Badge>
      )
    case "non_persediaan":
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-xs">
          Non-Persediaan
        </Badge>
      )
    case "jasa":
      return (
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium text-xs">
          Jasa
        </Badge>
      )
    case "paket":
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-xs">
          Paket
        </Badge>
      )
    default:
      return <Badge variant="secondary">{tipe}</Badge>
  }
}

export function ProdukTable({ initialData, daftarKategori }: ProdukTableProps) {
  const router = useRouter()
  const [data, setData] = React.useState<ProdukWithRelations[]>(initialData)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedTipe, setSelectedTipe] = React.useState<string>("semua")
  const [selectedKategori, setSelectedKategori] = React.useState<string>("semua")
  const [selectedStatus, setSelectedStatus] = React.useState<string>("semua")

  // State untuk dialog konfirmasi hapus
  const [produkToDelete, setProdukToDelete] = React.useState<ProdukWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Sinkronkan state lokal jika initialData berubah
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Filter Data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // 1. Filter Pencarian
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchNama = item.nama.toLowerCase().includes(query)
        const matchKode = item.kode.toLowerCase().includes(query)
        const matchBarcode = item.satuan?.some((s) =>
          s.barcode?.toLowerCase().includes(query)
        )
        if (!matchNama && !matchKode && !matchBarcode) return false
      }

      // 2. Filter Tipe Produk
      if (selectedTipe !== "semua" && item.tipe_produk !== selectedTipe) {
        return false
      }

      // 3. Filter Kategori
      if (
        selectedKategori !== "semua" &&
        item.kategori_produk_id !== selectedKategori
      ) {
        return false
      }

      // 4. Filter Status
      if (selectedStatus === "aktif" && !item.is_aktif) return false
      if (selectedStatus === "non_aktif" && item.is_aktif) return false

      return true
    })
  }, [data, searchQuery, selectedTipe, selectedKategori, selectedStatus])

  // Handle Hapus Produk
  const handleConfirmDelete = async () => {
    if (!produkToDelete) return

    try {
      setIsDeleting(true)
      const res = await hapusProdukAction(produkToDelete.id)

      if (res.success) {
        toast.success(`Produk "${produkToDelete.nama}" berhasil dihapus.`)
        setData((prev) => prev.filter((p) => p.id !== produkToDelete.id))
        setProdukToDelete(null)
      } else {
        toast.error(res.error || "Gagal menghapus produk.")
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan internal saat menghapus produk."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman & Tombol Tambah */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={PackageIcon} className="size-6 text-primary" strokeWidth={1.5} />
            Master Data Produk
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Katalog barang persediaan multi-satuan, non-persediaan, jasa, dan paket bundling ala Accurate.
          </p>
        </div>

        <Link href="/produk/baru">
          <Button className="gap-2 font-medium">
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={1.5} />
            Tambah Produk
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card p-3 rounded-xl border">
        {/* Search Input */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <Input
            placeholder="Cari nama, kode, atau barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Filter Tipe */}
        <Select
          value={selectedTipe}
          onValueChange={(val) => {
            if (val) setSelectedTipe(val)
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Tipe Produk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Tipe Produk</SelectItem>
            <SelectItem value="persediaan">Persediaan</SelectItem>
            <SelectItem value="non_persediaan">Non-Persediaan</SelectItem>
            <SelectItem value="jasa">Jasa</SelectItem>
            <SelectItem value="paket">Paket Bundling</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Kategori */}
        <Select
          value={selectedKategori}
          onValueChange={(val) => {
            if (val) setSelectedKategori(val)
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Kategori Produk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {daftarKategori.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Status */}
        <Select
          value={selectedStatus}
          onValueChange={(val) => {
            if (val) setSelectedStatus(val)
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Status Aktif" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif Saja</SelectItem>
            <SelectItem value="non_aktif">Non-Aktif Saja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel Produk */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[120px]">Kode</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Multi-Satuan</TableHead>
              <TableHead className="text-right">Total Stok</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-center w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[70px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-36 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <HugeiconsIcon icon={PackageIcon} className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
                    <p className="text-sm">Tidak ada produk yang sesuai dengan kriteria filter.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const satuanDasar = item.satuan_dasar?.nama_satuan || "Unit"
                const tieredUnits = (item.satuan || []).filter((s) => !s.is_satuan_dasar)
                const hargaDefault = item.satuan_dasar?.harga_jual_default || 0
                const isStockLow =
                  item.tipe_produk === "persediaan" &&
                  (item.total_stok ?? 0) <= (Number(item.peringatan_stok_minimum) || 0)

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    {/* Kode */}
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                      {item.kode}
                    </TableCell>

                    {/* Nama & Deskripsi */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/produk/${item.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
                        >
                          {item.nama}
                        </Link>
                        {item.deskripsi && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.deskripsi}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Tipe Produk */}
                    <TableCell>
                      <ProductTypeBadge tipe={item.tipe_produk} />
                    </TableCell>

                    {/* Kategori */}
                    <TableCell className="text-sm text-muted-foreground">
                      {item.kategori?.nama || "-"}
                    </TableCell>

                    {/* Multi-Satuan */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="font-medium text-xs">
                          {satuanDasar}
                        </Badge>
                        {tieredUnits.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-normal gap-1 text-muted-foreground"
                          >
                            <HugeiconsIcon icon={Layers01Icon} className="size-3" strokeWidth={1.5} />
                            +{tieredUnits.length} bertingkat
                            {tieredUnits.length === 1 && ` (${tieredUnits[0].nama_satuan} ${tieredUnits[0].rasio_ke_dasar}x)`}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Total Stok */}
                    <TableCell className="text-right">
                      {item.tipe_produk === "persediaan" ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-mono font-semibold text-sm">
                            {(item.total_stok ?? 0).toLocaleString("id-ID")} {satuanDasar}
                          </span>
                          {isStockLow && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                              <HugeiconsIcon icon={AlertCircleIcon} className="size-3" strokeWidth={1.5} />
                              Stok Menipis
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>

                    {/* Harga Jual Default */}
                    <TableCell className="text-right font-mono text-sm">
                      {hargaDefault > 0 ? (
                        <span>Rp {hargaDefault.toLocaleString("id-ID")}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      {item.is_aktif ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] gap-1"
                        >
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={1.5} />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-muted-foreground text-[11px] gap-1"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={1.5} />
                          Non-Aktif
                        </Badge>
                      )}
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="size-8" />
                          }
                        >
                          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={1.5} />
                          <span className="sr-only">Aksi produk</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/produk/${item.id}`)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={1.5} />
                            <span>Edit Produk</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setProdukToDelete(item)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 cursor-pointer"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.5} />
                            <span>Hapus Produk</span>
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

      {/* Modal Dialog Konfirmasi Hapus */}
      <Dialog
        open={Boolean(produkToDelete)}
        onOpenChange={(open) => !open && setProdukToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Produk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus produk{" "}
              <strong>{produkToDelete?.nama}</strong> ({produkToDelete?.kode})?
              Data akan dinonaktifkan dari sistem secara soft-delete.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              type="button"
              disabled={isDeleting}
              onClick={() => setProdukToDelete(null)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    className="size-4 animate-spin"
                    strokeWidth={1.5}
                  />
                  Menghapus...
                </>
              ) : (
                <>
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    className="size-4"
                    strokeWidth={1.5}
                  />
                  Hapus Produk
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
