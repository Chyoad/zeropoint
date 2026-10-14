'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  FilterHorizontalIcon,
  RotateLeft01Icon,
  Download01Icon,
  Store01Icon,
  PackageIcon,
  Calendar01Icon,
  Invoice01Icon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LABEL_JENIS_MUTASI,
  unduhCSVKartuStok,
  type KartuStokItem,
} from '@/lib/kartu-stok-csv'
import type { JenisMutasiStok } from '@/lib/validasi/produk'

export { unduhCSVKartuStok }

export interface KartuStokFilterProps {
  daftarCabang: Array<{ id: string; kode: string; nama: string }>
  daftarProduk: Array<{
    id: string
    kode: string
    nama: string
    tipe_produk: string
  }>
  initialFilters: {
    cabang_id?: string
    produk_id?: string
    tanggal_mulai?: string
    tanggal_selesai?: string
    jenis_mutasi?: string
  }
  dataToExport?: KartuStokItem[]
  onExportCSV?: () => void
}

export function KartuStokFilter({
  daftarCabang,
  daftarProduk,
  initialFilters,
  dataToExport = [],
  onExportCSV,
}: KartuStokFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [cabangId, setCabangId] = React.useState<string>(
    initialFilters.cabang_id || 'all'
  )
  const [produkId, setProdukId] = React.useState<string>(
    initialFilters.produk_id || 'all'
  )
  const [jenisMutasi, setJenisMutasi] = React.useState<string>(
    initialFilters.jenis_mutasi || 'all'
  )
  const [tanggalMulai, setTanggalMulai] = React.useState<string>(
    initialFilters.tanggal_mulai || ''
  )
  const [tanggalSelesai, setTanggalSelesai] = React.useState<string>(
    initialFilters.tanggal_selesai || ''
  )

  const [isPending, startTransition] = React.useTransition()

  const searchCabang = searchParams.get('cabang_id') ?? initialFilters.cabang_id ?? 'all'
  const searchProduk = searchParams.get('produk_id') ?? initialFilters.produk_id ?? 'all'
  const searchJenis = searchParams.get('jenis_mutasi') ?? initialFilters.jenis_mutasi ?? 'all'
  const searchMulai = searchParams.get('tanggal_mulai') ?? initialFilters.tanggal_mulai ?? ''
  const searchSelesai = searchParams.get('tanggal_selesai') ?? initialFilters.tanggal_selesai ?? ''

  const currentParamsKey = `${searchCabang}|${searchProduk}|${searchJenis}|${searchMulai}|${searchSelesai}`
  const [prevParamsKey, setPrevParamsKey] = React.useState(currentParamsKey)

  if (currentParamsKey !== prevParamsKey) {
    setPrevParamsKey(currentParamsKey)
    setCabangId(searchCabang)
    setProdukId(searchProduk)
    setJenisMutasi(searchJenis)
    setTanggalMulai(searchMulai)
    setTanggalSelesai(searchSelesai)
  }

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const params = new URLSearchParams()
    if (cabangId) params.set('cabang_id', cabangId)
    if (produkId && produkId !== 'all') params.set('produk_id', produkId)
    if (jenisMutasi && jenisMutasi !== 'all')
      params.set('jenis_mutasi', jenisMutasi)
    if (tanggalMulai) params.set('tanggal_mulai', tanggalMulai)
    if (tanggalSelesai) params.set('tanggal_selesai', tanggalSelesai)

    startTransition(() => {
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const handleResetFilter = () => {
    setCabangId('all')
    setProdukId('all')
    setJenisMutasi('all')
    setTanggalMulai('')
    setTanggalSelesai('')

    startTransition(() => {
      router.push(`${pathname}?cabang_id=all`)
    })
  }

  const handleExport = () => {
    if (onExportCSV) {
      onExportCSV()
    } else {
      const timestamp = new Date().toISOString().slice(0, 10)
      unduhCSVKartuStok(
        dataToExport,
        `kartu-stok-${cabangId !== 'all' ? cabangId : 'semua-cabang'}-${timestamp}.csv`
      )
    }
  }

  const isFiltered =
    (cabangId && cabangId !== (initialFilters.cabang_id || 'all')) ||
    (produkId && produkId !== 'all') ||
    (jenisMutasi && jenisMutasi !== 'all') ||
    Boolean(tanggalMulai) ||
    Boolean(tanggalSelesai) ||
    searchParams.has('cabang_id') ||
    searchParams.has('produk_id') ||
    searchParams.has('jenis_mutasi') ||
    searchParams.has('tanggal_mulai') ||
    searchParams.has('tanggal_selesai')

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs space-y-4">
      <form onSubmit={handleApplyFilter} className="space-y-4">
        {/* Baris Kontrol Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Pemilih Cabang */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Store01Icon}
                strokeWidth={1.5}
                className="size-3.5 text-primary"
              />
              Cabang / Lokasi
            </label>
            <Select
              value={cabangId}
              onValueChange={(val) => setCabangId(val || 'all')}
            >
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="Pilih Cabang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {daftarCabang.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nama} ({c.kode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Pemilih Produk */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon
                icon={PackageIcon}
                strokeWidth={1.5}
                className="size-3.5 text-primary"
              />
              Produk Persediaan
            </label>
            <Select
              value={produkId}
              onValueChange={(val) => setProdukId(val || 'all')}
            >
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="Pilih Produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Produk</SelectItem>
                {daftarProduk.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama} ({p.kode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Filter Jenis Mutasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Invoice01Icon}
                strokeWidth={1.5}
                className="size-3.5 text-primary"
              />
              Jenis Mutasi
            </label>
            <Select
              value={jenisMutasi}
              onValueChange={(val) => setJenisMutasi(val || 'all')}
            >
              <SelectTrigger className="w-full text-xs h-9">
                <SelectValue placeholder="Semua Mutasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mutasi</SelectItem>
                {(
                  Object.keys(LABEL_JENIS_MUTASI) as Array<JenisMutasiStok>
                ).map((k) => (
                  <SelectItem key={k} value={k}>
                    {LABEL_JENIS_MUTASI[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Tanggal Mulai */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Calendar01Icon}
                strokeWidth={1.5}
                className="size-3.5 text-primary"
              />
              Tanggal Mulai
            </label>
            <Input
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* 5. Tanggal Selesai */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Calendar01Icon}
                strokeWidth={1.5}
                className="size-3.5 text-primary"
              />
              Tanggal Selesai
            </label>
            <Input
              type="date"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Baris Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                strokeWidth={1.5}
                className="size-3.5"
              />
              Terapkan Filter
            </Button>

            {isFiltered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                disabled={isPending}
                className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={RotateLeft01Icon}
                  strokeWidth={1.5}
                  className="size-3.5"
                />
                Reset Filter
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isPending || dataToExport.length === 0}
            className="h-8 gap-1.5 text-xs font-medium border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-600/50"
          >
            <HugeiconsIcon
              icon={Download01Icon}
              strokeWidth={1.5}
              className="size-3.5"
            />
            Export CSV ({dataToExport.length} baris)
          </Button>
        </div>
      </form>
    </div>
  )
}
