import { createClient } from '@/lib/supabase/server'
import {
  urutkanUser,
  type UserProfile,
  type UserWithCabang,
} from '@/lib/validasi/user'
import type { Database } from '@/types/database.types'

export type UserProfileInsert =
  Database['public']['Tables']['user_profile']['Insert']
export type UserProfileUpdate =
  Database['public']['Tables']['user_profile']['Update']

export const INITIAL_DEMO_USERS: UserWithCabang[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    kode: 'USR-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    user_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@zeropoint.local',
    nama_lengkap: 'Superadmin Direksi',
    role: 'superadmin',
    avatar_url: null,
    telepon: '0811-0001-0001',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    cabang_list: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        kode: 'HQ-0001',
        nama: 'Kantor Pusat Jakarta (HQ)',
        tipe: 'pusat',
        is_default: true,
      },
    ],
    cabang_default_id: '10000000-0000-0000-0000-000000000001',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    kode: 'USR-0002',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    user_id: 'a0000000-0000-0000-0000-000000000002',
    email: 'manager.hq@zeropoint.local',
    nama_lengkap: 'Budi Santoso',
    role: 'hq_manager',
    avatar_url: null,
    telepon: '0812-2222-3333',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    cabang_list: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        kode: 'HQ-0001',
        nama: 'Kantor Pusat Jakarta (HQ)',
        tipe: 'pusat',
        is_default: true,
      },
    ],
    cabang_default_id: '10000000-0000-0000-0000-000000000001',
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    kode: 'USR-0003',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    user_id: 'a0000000-0000-0000-0000-000000000003',
    email: 'bm.sby@zeropoint.local',
    nama_lengkap: 'Siti Rahayu',
    role: 'branch_manager',
    avatar_url: null,
    telepon: '0813-4444-5555',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    cabang_list: [
      {
        id: '10000000-0000-0000-0000-000000000002',
        kode: 'CBG-0001',
        nama: 'Cabang Surabaya',
        tipe: 'cabang',
        is_default: true,
      },
    ],
    cabang_default_id: '10000000-0000-0000-0000-000000000002',
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    kode: 'USR-0004',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    user_id: 'a0000000-0000-0000-0000-000000000004',
    email: 'staff.ckr@zeropoint.local',
    nama_lengkap: 'Ahmad Fauzi',
    role: 'staff',
    avatar_url: null,
    telepon: '0814-6666-7777',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    cabang_list: [
      {
        id: '10000000-0000-0000-0000-000000000003',
        kode: 'GDG-0001',
        nama: 'Gudang Logistik Cikarang',
        tipe: 'gudang',
        is_default: true,
      },
    ],
    cabang_default_id: '10000000-0000-0000-0000-000000000003',
  },
]

// Mutable in-memory store for offline / demo mode
export let demoUserStore: UserWithCabang[] = INITIAL_DEMO_USERS.map((u) => ({
  ...u,
  cabang_list: [...u.cabang_list],
}))

export function resetDemoUsers() {
  demoUserStore = INITIAL_DEMO_USERS.map((u) => ({
    ...u,
    cabang_list: [...u.cabang_list],
  }))
}

export function tambahDemoUser(user: UserWithCabang) {
  demoUserStore.push(user)
}

export function updateDemoUser(
  id: string,
  updates: Partial<UserWithCabang>
): UserWithCabang | null {
  const index = demoUserStore.findIndex((u) => u.id === id)
  if (index !== -1) {
    demoUserStore[index] = {
      ...demoUserStore[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    return demoUserStore[index]
  }
  return null
}

export function hapusDemoUser(id: string): boolean {
  const index = demoUserStore.findIndex((u) => u.id === id)
  if (index !== -1) {
    demoUserStore[index] = {
      ...demoUserStore[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return true
  }
  return false
}

export { urutkanUser } from '@/lib/validasi/user'

const TIMEOUT_MS = process.env.NODE_ENV === 'test' ? 150 : 2000

export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = TIMEOUT_MS
): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timeout')), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timer!)
  }
}

interface SupabaseUserJoin extends UserProfile {
  user_cabang?: Array<{
    id: string
    kode: string
    cabang_id: string
    is_default: boolean
    deleted_at?: string | null
    cabang?: {
      id: string
      kode: string
      nama: string
      tipe: string
    } | null
  }> | null
}

function mapSupabaseUserToUserWithCabang(
  row: SupabaseUserJoin
): UserWithCabang {
  const userCabangItems = (row.user_cabang ?? []).filter(
    (uc) => uc.cabang && !uc.deleted_at
  )

  const cabang_list = userCabangItems.map((uc) => ({
    id: uc.cabang!.id,
    kode: uc.cabang!.kode,
    nama: uc.cabang!.nama,
    tipe: uc.cabang!.tipe,
    is_default: uc.is_default,
  }))

  const defaultCabang = userCabangItems.find((uc) => uc.is_default)

  return {
    ...row,
    cabang_list,
    cabang_default_id: defaultCabang?.cabang_id || null,
  }
}

/**
 * Mengambil daftar user aktif (deleted_at IS NULL)
 * beserta daftar relasi cabang yang ditugaskan.
 * Jika Supabase offline atau belum terkonfigurasi, mengembalikan data demo fallback.
 */
export async function ambilDaftarUser(): Promise<UserWithCabang[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await withTimeout(
      supabase
        .from('user_profile')
        .select(`
          *,
          user_cabang (
            id,
            kode,
            cabang_id,
            is_default,
            deleted_at,
            cabang (
              id,
              kode,
              nama,
              tipe
            )
          )
        `)
        .is('deleted_at', null)
    )

    if (error || !data || data.length === 0) {
      return urutkanUser(demoUserStore.filter((u) => !u.deleted_at))
    }

    const mapped = (data as SupabaseUserJoin[]).map(
      mapSupabaseUserToUserWithCabang
    )
    return urutkanUser(mapped)
  } catch {
    return urutkanUser(demoUserStore.filter((u) => !u.deleted_at))
  }
}

/**
 * Mengambil data user berdasarkan ID beserta daftar cabang yang ditugaskan.
 * Mengembalikan null jika tidak ditemukan atau sudah terhapus.
 */
export async function ambilUserById(
  id: string
): Promise<UserWithCabang | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await withTimeout(
      supabase
        .from('user_profile')
        .select(`
          *,
          user_cabang (
            id,
            kode,
            cabang_id,
            is_default,
            deleted_at,
            cabang (
              id,
              kode,
              nama,
              tipe
            )
          )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
    )

    if (error || !data) {
      const demo = demoUserStore.find((u) => u.id === id && !u.deleted_at)
      return demo ? { ...demo, cabang_list: [...demo.cabang_list] } : null
    }

    return mapSupabaseUserToUserWithCabang(data as SupabaseUserJoin)
  } catch {
    const demo = demoUserStore.find((u) => u.id === id && !u.deleted_at)
    return demo ? { ...demo, cabang_list: [...demo.cabang_list] } : null
  }
}
