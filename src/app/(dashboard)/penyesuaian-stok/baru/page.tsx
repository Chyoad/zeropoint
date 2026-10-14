import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ambilDaftarCabang } from '@/server/queries/cabang'
import { ambilProdukDanStokBuku } from '@/server/queries/penyesuaian-stok'
import { PenyesuaianForm } from '@/components/penyesuaian-stok/penyesuaian-form'
import { ACTIVE_BRANCH_COOKIE, parseActiveBranchId } from '@/lib/branch-session'

export const metadata: Metadata = {
  title: 'Input Stock Opname Baru | Zeropoint Admin',
  description:
    'Form input penghitungan fisik stock opname per fasilitas cabang dan rekonsiliasi saldo buku inventaris.',
}

export default async function PenyesuaianStokBaruPage() {
  const cookieStore = await cookies()
  const activeBranchFromCookie = parseActiveBranchId(
    cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value
  )

  const daftarCabang = await ambilDaftarCabang()
  const initialBranchId =
    (activeBranchFromCookie && activeBranchFromCookie !== 'all'
      ? activeBranchFromCookie
      : daftarCabang[0]?.id) || ''

  const availableProducts = initialBranchId
    ? await ambilProdukDanStokBuku(initialBranchId)
    : []

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PenyesuaianForm
        cabangList={daftarCabang}
        availableProducts={availableProducts}
      />
    </div>
  )
}
