import type { Metadata } from "next"
import { ambilDaftarCabang } from "@/server/queries/cabang"
import { CabangTable } from "@/components/cabang/cabang-table"

export const metadata: Metadata = {
  title: "Manajemen Cabang & Gudang | Zeropoint Admin",
  description:
    "Kelola data kantor pusat, cabang operasional retail, dan gudang logistik persediaan dalam struktur multi-cabang.",
}

export default async function CabangPage() {
  const daftarCabang = await ambilDaftarCabang()

  return <CabangTable initialData={daftarCabang} />
}
