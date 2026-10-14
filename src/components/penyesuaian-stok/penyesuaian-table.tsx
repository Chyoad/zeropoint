'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Search01Icon,
  FilterHorizontalIcon,
  Task01Icon,
  Building04Icon,
  ViewIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Alert02Icon,
  Calendar03Icon,
} from '@hugeicons/core-free-icons'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  formatKuantitas,
  formatRupiah,
  formatTanggalWaktuIndonesia,
} from '@/lib/utils'
import {
  formatStatusPenyesuaian,
  formatTipePenyesuaian,
  type StatusPenyesuaianStok,
} from '@/lib/validasi/penyesuaian-stok'
import type { PenyesuaianStokWithRelations } from '@/server/queries/penyesuaian-stok'
import type { Cabang } from '@/lib/validasi/cabang'

export interface PenyesuaianTableProps {
  data: PenyesuaianStokWithRelations[]
  cabangList: Cabang[]
  activeBranchId?: string
}

export function PenyesuaianTable({
  data,
  cabangList,
  activeBranchId,
}: PenyesuaianTableProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [cabangFilter, setCabangFilter] = React.useState<string>(
    activeBranchId || 'all'
  )

  // Sinkronisasi saat activeBranchId berubah dari switcher
  React.useEffect(() => {
    if (activeBranchId) {
      setCabangFilter(activeBranchId)
    }
  }, [activeBranchId])

  // Filter data secara reaktif di client
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // 1. Cabang
      if (cabangFilter !== 'all' && item.cabang_id !== cabangFilter) {
        return false
      }
      // 2. Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }
      // 3. Pencarian
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchKode = item.kode.toLowerCase().includes(query)
        const matchCatatan = item.catatan?.toLowerCase().includes(query) ?? false
        const matchCabang =
          item.cabang?.nama.toLowerCase().includes(query) ?? false
        if (!matchKode && !matchCatatan && !matchCabang) {
          return false
        }
      }
      return true
    })
  }, [data, cabangFilter, statusFilter, search])

  // Agregat ringkasan atas
  const ringkasan = React.useMemo(() => {
    const totalSelesai = data.filter((d) => d.status === 'selesai').length
    const totalDraft = data.filter((d) => d.status === 'draft').length
    const totalDibatalkan = data.filter((d) => d.status === 'dibatalkan').length
    return {
      total: data.length,
      selesai: totalSelesai,
      draft: totalDraft,
      dibatalkan: totalDibatalkan,
    }
  }, [data])

  return (
    <div className="space-y-4">
      {/* Kartu Metrik Ringkas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border rounded-lg p-3.5 shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Total Dokumen</p>
          <p className="text-2xl font-bold mt-1 text-foreground">
            {ringkasan.total}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-3.5 shadow-xs border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            Selesai / Mutasi Aktif
          </p>
          <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
            {ringkasan.selesai}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-3.5 shadow-xs border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Draft Tertunda
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">
            {ringkasan.draft}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-3.5 shadow-xs border-rose-500/20 bg-rose-500/5">
          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
            Dibatalkan
          </p>
          <p className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-400">
            {ringkasan.dibatalkan}
          </p>
        </div>
      </div>

      {/* Toolbar Filter & Aksi Tambah */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border rounded-lg p-3 shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Input Pencarian */}
          <div className="relative flex-1 min-w-[200px]">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              strokeWidth={1.5}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Cari kode opname, catatan, fasilitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filter Cabang */}
          <div className="w-full sm:w-[200px]">
            <select
              value={cabangFilter}
              onChange={(e) => setCabangFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">Semua Cabang & Gudang</option>
              {cabangList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.tipe})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('selesai')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === 'selesai'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Selesai
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === 'draft'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('dibatalkan')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === 'dibatalkan'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dibatalkan
            </button>
          </div>
        </div>

        {/* Tombol Buat Baru */}
        <Link href="/penyesuaian-stok/baru">
          <Button className="h-9 gap-1.5 w-full sm:w-auto font-medium">
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.5} />
            Stock Opname Baru
          </Button>
        </Link>
      </div>

      {/* Tabel Data Riwayat Penyesuaian Stok */}
      <div className="bg-card border rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[170px]">Tanggal & Waktu</TableHead>
                <TableHead className="w-[160px]">Kode Dokumen</TableHead>
                <TableHead>Fasilitas / Cabang</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-center w-[90px]">Item</TableHead>
                <TableHead className="text-right">Total Selisih Fisik</TableHead>
                <TableHead className="text-right">Nilai Selisih (Rp)</TableHead>
                <TableHead className="w-[120px] text-center">Status</TableHead>
                <TableHead className="w-[100px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <HugeiconsIcon
                        icon={Task01Icon}
                        size={36}
                        strokeWidth={1.5}
                        className="opacity-40"
                      />
                      <p className="font-medium text-sm">
                        Tidak ada riwayat penyesuaian stok yang cocok
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Coba sesuaikan kata kunci pencarian, filter status, atau buat
                        dokumen stock opname baru untuk fasilitas terkait.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => {
                  const statusInfo = formatStatusPenyesuaian(row.status)
                  const totalSelisih = row.total_selisih_fisik ?? 0
                  const totalNilai = row.total_nilai_selisih ?? 0

                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      {/* Tanggal & Waktu */}
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={Calendar03Icon}
                            size={14}
                            strokeWidth={1.5}
                            className="text-muted-foreground"
                          />
                          {formatTanggalWaktuIndonesia(row.tanggal)}
                        </div>
                      </TableCell>

                      {/* Kode */}
                      <TableCell>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                          {row.kode}
                        </span>
                      </TableCell>

                      {/* Cabang */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={Building04Icon}
                            size={15}
                            strokeWidth={1.5}
                            className="text-muted-foreground shrink-0"
                          />
                          <div className="truncate max-w-[180px]">
                            <p className="text-sm font-medium leading-none">
                              {row.cabang?.nama || 'Semua Cabang'}
                            </p>
                            {row.cabang?.tipe && (
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {row.cabang.tipe}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Tipe Penyesuaian */}
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {formatTipePenyesuaian(row.tipe_penyesuaian)}
                        </Badge>
                      </TableCell>

                      {/* Item Count */}
                      <TableCell className="text-center font-mono text-xs">
                        {row.items_count ?? 0}
                      </TableCell>

                      {/* Total Selisih Fisik */}
                      <TableCell className="text-right">
                        {totalSelisih > 0 ? (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatKuantitas(totalSelisih)}
                          </span>
                        ) : totalSelisih < 0 ? (
                          <span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
                            {formatKuantitas(totalSelisih)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            0
                          </span>
                        )}
                      </TableCell>

                      {/* Total Nilai Selisih */}
                      <TableCell className="text-right font-mono text-xs">
                        {totalNilai > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{formatRupiah(totalNilai)}
                          </span>
                        ) : totalNilai < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            {formatRupiah(totalNilai)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatRupiah(0)}
                          </span>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-center">
                        <Link href={`/penyesuaian-stok/${row.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs gap-1 hover:text-primary"
                          >
                            <HugeiconsIcon
                              icon={ViewIcon}
                              size={14}
                              strokeWidth={1.5}
                            />
                            {row.status === 'draft' ? 'Lanjutkan' : 'Detail'}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
