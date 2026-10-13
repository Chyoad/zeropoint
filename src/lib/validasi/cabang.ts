import { z } from 'zod'
import type { Database, TipeCabang } from '@/types/database.types'

export type Cabang = Database['public']['Tables']['cabang']['Row']

export const tipeCabangEnum = z.enum(['pusat', 'cabang', 'gudang'] as const)

export const cabangSchema = z.object({
  nama: z
    .string({
      error: (issue) =>
        issue.code === 'invalid_type'
          ? 'Nama fasilitas harus berupa teks'
          : undefined,
    })
    .trim()
    .min(2, 'Nama cabang minimal 2 karakter'),
  tipe: tipeCabangEnum,
  alamat: z.string().optional().nullable(),
  kota: z.string().optional().nullable(),
  telepon: z.string().optional().nullable(),
  is_aktif: z.boolean().default(true),
})

export type CabangInput = z.infer<typeof cabangSchema>
export type CabangFormInput = z.input<typeof cabangSchema>

export function urutkanCabang<T extends { tipe: TipeCabang; nama: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // Pusat selalu di urutan paling atas
    if (a.tipe === 'pusat' && b.tipe !== 'pusat') return -1
    if (a.tipe !== 'pusat' && b.tipe === 'pusat') return 1
    // Urutkan alfabetis berdasarkan nama
    return a.nama.localeCompare(b.nama, 'id-ID')
  })
}

export type { TipeCabang }
