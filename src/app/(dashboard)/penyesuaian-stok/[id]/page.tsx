import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'

import {
  ambilDetailPenyesuaianStok,
  ambilProdukDanStokBuku,
} from '@/server/queries/penyesuaian-stok'
import { ambilDaftarCabang } from '@/server/queries/cabang'
import { PenyesuaianForm } from '@/components/penyesuaian-stok/penyesuaian-form'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params
  const detail = await ambilDetailPenyesuaianStok(id)

  return {
    title: detail
      ? `${detail.kode} - Rincian Penyesuaian Stok | Zeropoint Admin`
      : 'Detail Penyesuaian Stok | Zeropoint Admin',
    description: 'Rincian transaksi penyesuaian stok opname dan status mutasi.',
  }
}

export default async function DetailPenyesuaianStokPage(props: PageProps) {
  const { id } = await props.params

  const [detail, daftarCabang] = await Promise.all([
    ambilDetailPenyesuaianStok(id),
    ambilDaftarCabang(),
  ])

  if (!detail) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <HugeiconsIcon icon={Alert02Icon} size={24} strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold">Data Opname Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Dokumen penyesuaian stok dengan identifikasi tersebut tidak ditemukan atau telah dihapus.
        </p>
        <Link href="/penyesuaian-stok">
          <Button variant="outline" className="gap-1.5 text-xs">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.5} />
            Kembali ke Daftar Penyesuaian
          </Button>
        </Link>
      </div>
    )
  }

  const isReadOnly = detail.status !== 'draft'
  const availableProducts = await ambilProdukDanStokBuku(detail.cabang_id)

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PenyesuaianForm
        cabangList={daftarCabang}
        initialData={detail}
        isReadOnly={isReadOnly}
        availableProducts={availableProducts}
      />
    </div>
  )
}
