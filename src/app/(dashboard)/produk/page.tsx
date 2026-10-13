import type { Metadata } from "next"
import { ambilDaftarProduk, ambilDaftarKategori } from "@/server/queries/produk"
import { ProdukTable } from "@/components/produk/produk-table"

export const metadata: Metadata = {
  title: "Master Data Produk & Multi-Satuan | Zeropoint Admin",
  description:
    "Katalog dan master data produk persediaan multi-satuan, non-persediaan, jasa, dan paket bundling ala Accurate.",
}

export default async function ProdukPage() {
  const [daftarProduk, daftarKategori] = await Promise.all([
    ambilDaftarProduk(),
    ambilDaftarKategori(),
  ])

  return (
    <ProdukTable
      initialData={daftarProduk}
      daftarKategori={daftarKategori}
    />
  )
}
