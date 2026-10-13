import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { HugeiconsIcon } from '@hugeicons/react'
import { Invoice01Icon } from '@hugeicons/core-free-icons'

import {
  ambilBukuBesarKartuStok,
  ambilOpsiFilterKartuStok,
} from '@/server/queries/kartu-stok'
import { KartuStokFilter } from '@/components/kartu-stok/kartu-stok-filter'
import { KartuStokTable } from '@/components/kartu-stok/kartu-stok-table'
import { ACTIVE_BRANCH_COOKIE, parseActiveBranchId } from '@/lib/branch-session'

export const metadata: Metadata = {
  title: 'Buku Besar Kartu Stok / Stock Ledger | Zeropoint Admin',
  description:
    'Laporan buku besar mutasi inventaris barang per cabang dan produk dengan running balance Moving Average presisi tinggi.',
}

interface PageProps {
  searchParams: Promise<{
    cabang_id?: string
    produk_id?: string
    tanggal_mulai?: string
    tanggal_selesai?: string
    jenis_mutasi?: string
  }>
}

export default async function KartuStokPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams
  const cookieStore = await cookies()
  const activeBranchFromCookie = parseActiveBranchId(
    cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value
  )

  // Gunakan parameter URL jika ada; jika tidak, gunakan cabang aktif dari sesi (jika bukan 'all')
  const cabangIdParam =
    resolvedSearchParams.cabang_id !== undefined
      ? resolvedSearchParams.cabang_id
      : activeBranchFromCookie || 'all'

  const queryParams = {
    cabang_id: cabangIdParam,
    produk_id: resolvedSearchParams.produk_id,
    tanggal_mulai: resolvedSearchParams.tanggal_mulai,
    tanggal_selesai: resolvedSearchParams.tanggal_selesai,
    jenis_mutasi: resolvedSearchParams.jenis_mutasi,
  }

  const [bukuBesar, opsiFilter] = await Promise.all([
    ambilBukuBesarKartuStok(queryParams),
    ambilOpsiFilterKartuStok(),
  ])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon
                icon={Invoice01Icon}
                strokeWidth={1.5}
                className="size-5"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Buku Besar Kartu Stok
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Laporan mutasi pergerakan inventaris, mutasi kuantitas, dan
            kalkulasi Moving Average running balance per cabang & produk.
          </p>
        </div>
      </div>

      {/* Baris Filter & Export */}
      <KartuStokFilter
        daftarCabang={opsiFilter.daftarCabang}
        daftarProduk={opsiFilter.daftarProduk}
        initialFilters={{
          cabang_id: cabangIdParam,
          produk_id: resolvedSearchParams.produk_id,
          tanggal_mulai: resolvedSearchParams.tanggal_mulai,
          tanggal_selesai: resolvedSearchParams.tanggal_selesai,
          jenis_mutasi: resolvedSearchParams.jenis_mutasi,
        }}
        dataToExport={bukuBesar.data}
      />

      {/* Ringkasan Metrik & Tabel Buku Besar */}
      <KartuStokTable data={bukuBesar.data} ringkasan={bukuBesar.ringkasan} />
    </div>
  )
}
