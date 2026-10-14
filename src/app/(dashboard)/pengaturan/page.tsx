import type { Metadata } from 'next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Settings02Icon } from '@hugeicons/core-free-icons'

import { ambilProfilOrganisasi } from '@/server/queries/pengaturan'
import { PengaturanForm } from '@/components/pengaturan/pengaturan-form'

export const metadata: Metadata = {
  title: 'Pengaturan Organisasi & Preferensi | Zeropoint Admin',
  description:
    'Konfigurasi identitas perusahaan, preferensi regional mata uang IDR, dan status sistem multi-cabang.',
}

export default async function PengaturanPage() {
  const profilOrganisasi = await ambilProfilOrganisasi()

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header Halaman */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
          <HugeiconsIcon icon={Settings02Icon} size={26} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-outfit">
            Pengaturan Organisasi & Preferensi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Kelola profil resmi perusahaan, preferensi regional moneter Rupiah (IDR), dan status runtime sistem.
          </p>
        </div>
      </div>

      {/* Form Pengaturan */}
      <PengaturanForm initialData={profilOrganisasi} />
    </div>
  )
}
