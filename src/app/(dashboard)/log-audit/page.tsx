import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { HugeiconsIcon } from '@hugeicons/react'
import { ShieldUserIcon } from '@hugeicons/core-free-icons'

import { ambilDaftarLogAudit } from '@/server/queries/log-audit'
import { ambilDaftarCabang } from '@/server/queries/cabang'
import { LogAuditTable } from '@/components/log-audit/log-audit-table'
import { ACTIVE_BRANCH_COOKIE, parseActiveBranchId } from '@/lib/branch-session'

export const metadata: Metadata = {
  title: 'Audit Trail & Log Aktivitas | Zeropoint Admin',
  description:
    'Rekam jejak komprehensif seluruh mutasi data, otorisasi pengguna, dan riwayat operasional multi-cabang.',
}

interface PageProps {
  searchParams: Promise<{
    cabang_id?: string
    aksi?: string
    entitas?: string
    q?: string
  }>
}

export default async function LogAuditPage(props: PageProps) {
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

  const [daftarLog, daftarCabang] = await Promise.all([
    ambilDaftarLogAudit({
      cabang_id: cabangIdForQuery,
      aksi: resolvedSearchParams.aksi,
      entitas: resolvedSearchParams.entitas,
      search: resolvedSearchParams.q,
    }),
    ambilDaftarCabang(),
  ])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <HugeiconsIcon icon={ShieldUserIcon} size={26} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-outfit">
              Audit Trail & Rekam Jejak
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Inspeksi seluruh aktivitas sistem, perubahan master data, penyesuaian stok, dan audit keamanan.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Data & Filter Riwayat */}
      <LogAuditTable initialLogs={daftarLog} daftarCabang={daftarCabang} />
    </div>
  )
}
