import type { Metadata } from "next"
import { ambilDaftarUser } from "@/server/queries/user"
import { ambilDaftarCabang } from "@/server/queries/cabang"
import { UserTable } from "@/components/user/user-table"

export const metadata: Metadata = {
  title: "Manajemen Pengguna & Hak Akses | Zeropoint Admin",
  description:
    "Kelola data pengguna, peran RBAC hierarki, serta penugasan multi-cabang terintegrasi.",
}

export default async function PenggunaPage() {
  const [daftarUser, daftarCabang] = await Promise.all([
    ambilDaftarUser(),
    ambilDaftarCabang(),
  ])

  return <UserTable initialData={daftarUser} daftarCabang={daftarCabang} />
}
