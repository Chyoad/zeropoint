import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { HugeiconsIcon } from '@hugeicons/react'
import { Task01Icon } from '@hugeicons/core-free-icons'

import { ambilDaftarPenyesuaianStok } from '@/server/queries/penyesuaian-stok'
import { ambilDaftarCabang } from '@/server/queries/cabang'
import { PenyesuaianTable } from '@/components/penyesuaian-stok/penyesuaian-table'
import { ACTIVE_BRANCH_COOKIE, parseActiveBranchId } from '@/lib/branch-session'

export const metadata: Metadata = {
  title: 'Penyesuaian Stok / Stock Opname | Zeropoint Admin',
  description:
    'Modul rekonsiliasi dan penyesuaian stok opname fisik per cabang atau gudang dengan sinkronisasi otomatis buku besar kartu stok.',
}

interface PageProps {
  searchParams: Promise<{
    cabang_id?: string
    status?: string
    tipe?: string
    q?: string
  }>
}

export default async function PenyesuaianStokPage(props: PageProps) {
  const resolvedSearchParams = await props.searchParams
  const cookieStore = await cookies()
  const activeBranchFromCookie = parseActiveBranchId(
    cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value
  )

  const isExplicitAll = resolvedSearchParams.cabang_id === 'all'
  const cabangIdForQuery = isExplicitAll
    ? undefined
    : (resolvedSearchParams.cabang_id ||
       (activeBranchFromCookie === 'all' ? undefined : activeBranchFromCookie) ||
       undefined)

  const [daftarPenyesuaian, daftarCabang] = await Promise.all([
    ambilDaftarPenyesuaianStok({
      cabang_id: cabangIdForQuery,
      status: resolvedSearchParams.status,
      tipe_penyesuaian: resolvedSearchParams.tipe,
      pencarian: resolvedSearchParams.q,
    }),
    ambilDaftarCabang(),
  ])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <HugeiconsIcon icon={Task01Icon} size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-outfit">
                Penyesuaian Stok / Stock Opname
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Rekonsiliasi inventaris riil gudang dengan saldo buku akuntansi serta audit trail penyesuaian.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data & Filter Riwayat */}
      <PenyesuaianTable
        data={daftarPenyesuaian}
        cabangList={daftarCabang}
        activeBranchId={activeBranchFromCookie || undefined}
      />
    </div>
  )
}
