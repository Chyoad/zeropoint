import type { Metadata } from "next"
import {
  ambilDaftarKategori,
  ambilDaftarProduk,
} from "@/server/queries/produk"
import { ambilDaftarCabang } from "@/server/queries/cabang"
import { ProdukFormTabs } from "@/components/produk/produk-form-tabs"

export const metadata: Metadata = {
  title: "Tambah Master Produk Baru | Zeropoint Admin",
  description:
    "Form pendaftaran master data produk persediaan multi-satuan, jasa, atau paket bundling ala Accurate.",
}

export default async function BaruProdukPage() {
  const [daftarKategori, daftarCabang, daftarProduk] = await Promise.all([
    ambilDaftarKategori(),
    ambilDaftarCabang(),
    ambilDaftarProduk(),
  ])

  return (
    <ProdukFormTabs
      daftarKategori={daftarKategori}
      daftarCabang={daftarCabang}
      daftarProduk={daftarProduk}
    />
  )
}
