import { z } from 'zod'
import type { Database, RolePengguna } from '@/types/database.types'

export type UserProfile = Database['public']['Tables']['user_profile']['Row']
export type UserCabang = Database['public']['Tables']['user_cabang']['Row']
export type { RolePengguna }

export const rolePenggunaEnum = z.enum([
  'superadmin',
  'hq_manager',
  'branch_manager',
  'staff',
  'viewer',
] as const)

export interface CabangRingkas {
  id: string
  kode: string
  nama: string
  tipe: string
  is_default?: boolean
}

export interface UserWithCabang extends UserProfile {
  cabang_list: CabangRingkas[]
  cabang_default_id?: string | null
}

export const userSchema = z
  .object({
    nama_lengkap: z
      .string({
        error: (issue) =>
          issue.code === 'invalid_type'
            ? 'Nama lengkap harus berupa teks'
            : undefined,
      })
      .trim()
      .min(2, 'Nama lengkap minimal 2 karakter'),
    email: z
      .string({
        error: (issue) =>
          issue.code === 'invalid_type'
            ? 'Email harus berupa teks'
            : undefined,
      })
      .trim()
      .email('Format email tidak valid'),
    role: rolePenggunaEnum,
    avatar_url: z.string().optional().nullable().or(z.literal('')),
    telepon: z.string().optional().nullable().or(z.literal('')),
    is_aktif: z.boolean().default(true),
    cabang_ids: z.array(z.string()).default([]),
    cabang_default_id: z.string().optional().nullable().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Role branch_manager dan staff wajib ditugaskan ke minimal 1 cabang
      if (data.role === 'branch_manager' || data.role === 'staff') {
        return Array.isArray(data.cabang_ids) && data.cabang_ids.length >= 1
      }
      return true
    },
    {
      message: 'Role Branch Manager dan Staff wajib ditugaskan ke minimal 1 cabang',
      path: ['cabang_ids'],
    }
  )
  .refine(
    (data) => {
      // Jika cabang_default_id diisi dan bukan string kosong, wajib berada di dalam cabang_ids
      if (data.cabang_default_id && data.cabang_default_id.trim() !== '') {
        return (
          Array.isArray(data.cabang_ids) &&
          data.cabang_ids.includes(data.cabang_default_id)
        )
      }
      return true
    },
    {
      message: 'Cabang default harus dipilih dari daftar cabang yang ditugaskan',
      path: ['cabang_default_id'],
    }
  )

export type UserInput = z.infer<typeof userSchema>
export type UserFormInput = z.input<typeof userSchema>

export const ROLE_CONFIG: Record<
  RolePengguna,
  {
    label: string
    badgeClass: string
    deskripsi: string
  }
> = {
  superadmin: {
    label: 'Superadmin (Direksi)',
    badgeClass:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
    deskripsi: 'Akses penuh tanpa batas ke seluruh data dan sistem',
  },
  hq_manager: {
    label: 'HQ Manager',
    badgeClass:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
    deskripsi: 'Manajemen terpusat seluruh cabang dan master data',
  },
  branch_manager: {
    label: 'Branch Manager',
    badgeClass:
      'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300',
    deskripsi: 'Kepala operasional dan persediaan cabang terkait',
  },
  staff: {
    label: 'Staff Operasional',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    deskripsi: 'Operator transaksi dan gudang pada cabang aktif',
  },
  viewer: {
    label: 'Viewer / Auditor',
    badgeClass:
      'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    deskripsi: 'Hak akses baca (read-only) untuk pemeriksaan audit',
  },
}

const ROLE_PRIORITY: Record<RolePengguna, number> = {
  superadmin: 1,
  hq_manager: 2,
  branch_manager: 3,
  staff: 4,
  viewer: 5,
}

export function urutkanUser<T extends { role: RolePengguna; nama_lengkap: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const priorityDiff =
      (ROLE_PRIORITY[a.role] || 99) - (ROLE_PRIORITY[b.role] || 99)
    if (priorityDiff !== 0) return priorityDiff
    return a.nama_lengkap.localeCompare(b.nama_lengkap, 'id-ID')
  })
}
