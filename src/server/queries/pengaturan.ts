import { createClient } from '@/lib/supabase/server'
import {
  profilOrganisasiSchema,
  INITIAL_DEMO_ORGANISASI,
  type ProfilOrganisasi,
  type ProfilOrganisasiInput,
  type ProfilOrganisasiFormInput,
} from '@/lib/validasi/pengaturan'

export {
  profilOrganisasiSchema,
  INITIAL_DEMO_ORGANISASI,
  type ProfilOrganisasi,
  type ProfilOrganisasiInput,
  type ProfilOrganisasiFormInput,
}

export let demoOrganisasiStore: ProfilOrganisasi = {
  ...INITIAL_DEMO_ORGANISASI,
}

export function resetDemoOrganisasi() {
  demoOrganisasiStore = {
    ...INITIAL_DEMO_ORGANISASI,
  }
}

export function updateDemoOrganisasi(
  updates: Partial<ProfilOrganisasi>
): ProfilOrganisasi {
  demoOrganisasiStore = {
    ...demoOrganisasiStore,
    ...updates,
    updated_at: new Date().toISOString(),
  }
  return demoOrganisasiStore
}

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
 * Mengambil profil organisasi perusahaan dan preferensi sistem.
 * Mendukung in-memory demo fallback saat offline.
 */
export async function ambilProfilOrganisasi(): Promise<ProfilOrganisasi> {
  try {
    const supabase = await createClient()
    const { data, error } = await withTimeout(
      supabase.from('organisasi').select('*').limit(1).maybeSingle()
    )

    if (error || !data) {
      return {
        ...demoOrganisasiStore,
        supabase_status: 'demo',
      }
    }

    const peng = (data.pengaturan as Record<string, unknown>) || {}

    return {
      id: data.id,
      kode: data.kode,
      nama: data.nama,
      logo_url: data.logo_url,
      npwp: (peng.npwp as string) || demoOrganisasiStore.npwp,
      alamat: (peng.alamat as string) || demoOrganisasiStore.alamat,
      kota: (peng.kota as string) || demoOrganisasiStore.kota,
      provinsi: (peng.provinsi as string) || demoOrganisasiStore.provinsi,
      telepon: (peng.telepon as string) || demoOrganisasiStore.telepon,
      email: (peng.email as string) || demoOrganisasiStore.email,
      mata_uang_default: (peng.mata_uang_default as string) || (peng.mata_uang as string) || 'IDR',
      zona_waktu:
        (peng.zona_waktu as 'Asia/Jakarta (WIB)' | 'Asia/Makassar (WITA)' | 'Asia/Jayapura (WIT)') ||
        'Asia/Jakarta (WIB)',
      pemisah_angka: (peng.pemisah_angka as 'titik' | 'koma') || 'titik',
      format_tanggal: (peng.format_tanggal as string) || 'DD/MM/YYYY',
      supabase_status: 'connected',
      versi_aplikasi: '1.0.0-enterprise',
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch {
    return {
      ...demoOrganisasiStore,
      supabase_status: 'demo',
    }
  }
}
