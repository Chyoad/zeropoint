import { createClient } from '@/lib/supabase/server'
import { urutkanCabang } from '@/lib/validasi/cabang'
import type { Database } from '@/types/database.types'

export type Cabang = Database['public']['Tables']['cabang']['Row']
export type CabangInsert = Database['public']['Tables']['cabang']['Insert']
export type CabangUpdate = Database['public']['Tables']['cabang']['Update']

export const INITIAL_DEMO_CABANG: Cabang[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    kode: 'HQ-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Kantor Pusat Jakarta (HQ)',
    tipe: 'pusat',
    alamat: 'Jl. Jenderal Sudirman Kav. 52-53',
    kota: 'Jakarta Selatan',
    telepon: '021-5551234',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    kode: 'CBG-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Cabang Surabaya',
    tipe: 'cabang',
    alamat: 'Jl. Basuki Rahmat No. 45',
    kota: 'Surabaya',
    telepon: '031-5554321',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    kode: 'GDG-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Gudang Logistik Cikarang',
    tipe: 'gudang',
    alamat: 'Kawasan Industri GIIC Blok C No. 12',
    kota: 'Cikarang, Bekasi',
    telepon: '021-8998001',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// Mutable in-memory store for offline / demo mode
export let demoCabangStore: Cabang[] = [...INITIAL_DEMO_CABANG]

export function resetDemoCabang() {
  demoCabangStore = [...INITIAL_DEMO_CABANG]
}

export function tambahDemoCabang(cabang: Cabang) {
  demoCabangStore.push(cabang)
}

export function updateDemoCabang(id: string, updates: Partial<Cabang>) {
  const index = demoCabangStore.findIndex((c) => c.id === id)
  if (index !== -1) {
    demoCabangStore[index] = {
      ...demoCabangStore[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    return demoCabangStore[index]
  }
  return null
}

export function hapusDemoCabang(id: string) {
  const index = demoCabangStore.findIndex((c) => c.id === id)
  if (index !== -1) {
    demoCabangStore[index] = {
      ...demoCabangStore[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return true
  }
  return false
}

export { urutkanCabang } from '@/lib/validasi/cabang'

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

/**
 * Mengambil daftar cabang aktif (deleted_at IS NULL),
 * terurut dari tipe = 'pusat' lalu nama secara alfabetis.
 * Jika Supabase offline atau unconfigured, mengembalikan data demo fallback.
 */
export async function ambilDaftarCabang(): Promise<Cabang[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await withTimeout(
      supabase.from('cabang').select('*').is('deleted_at', null)
    )

    if (error || !data || data.length === 0) {
      return urutkanCabang(demoCabangStore.filter((c) => !c.deleted_at))
    }

    return urutkanCabang(data)
  } catch {
    return urutkanCabang(demoCabangStore.filter((c) => !c.deleted_at))
  }
}

/**
 * Mengambil data cabang berdasarkan ID.
 * Mengembalikan null jika tidak ditemukan atau sudah terhapus.
 */
export async function ambilCabangById(id: string): Promise<Cabang | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await withTimeout(
      supabase
        .from('cabang')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
    )

    if (error || !data) {
      return demoCabangStore.find((c) => c.id === id && !c.deleted_at) ?? null
    }

    return data
  } catch {
    return demoCabangStore.find((c) => c.id === id && !c.deleted_at) ?? null
  }
}
