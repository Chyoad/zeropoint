import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  ambilDetailProduk,
  ambilDaftarKategori,
  ambilDaftarProduk,
} from "@/server/queries/produk"
import { ambilDaftarCabang } from "@/server/queries/cabang"
import { ProdukFormTabs } from "@/components/produk/produk-form-tabs"

export interface EditProdukPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: EditProdukPageProps): Promise<Metadata> {
  const { id } = await params
  const produk = await ambilDetailProduk(id)

  if (!produk) {
    return {
      title: "Produk Tidak Ditemukan | Zeropoint Admin",
    }
  }

  return {
    title: `Edit ${produk.nama} (${produk.kode}) | Zeropoint Admin`,
    description: `Kelola data multi-satuan dan harga jual untuk ${produk.nama}.`,
  }
}

export default async function EditProdukPage({ params }: EditProdukPageProps) {
  const { id } = await params

  const [produk, daftarKategori, daftarCabang, daftarProduk] =
    await Promise.all([
      ambilDetailProduk(id),
      ambilDaftarKategori(),
      ambilDaftarCabang(),
      ambilDaftarProduk(),
    ])

  if (!produk) {
    notFound()
  }

  return (
    <ProdukFormTabs
      initialData={produk}
      daftarKategori={daftarKategori}
      daftarCabang={daftarCabang}
      daftarProduk={daftarProduk}
    />
  )
}
