'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  cabangSchema,
  type CabangInput,
  type CabangFormInput,
} from '@/lib/validasi/cabang'
import {
  type Cabang,
  demoCabangStore,
  tambahDemoCabang,
  updateDemoCabang,
  hapusDemoCabang,
  withTimeout,
} from '@/server/queries/cabang'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

function tentukanPrefix(tipe: 'pusat' | 'cabang' | 'gudang'): string {
  switch (tipe) {
    case 'pusat':
      return 'HQ'
    case 'gudang':
      return 'GDG'
    case 'cabang':
    default:
      return 'CBG'
  }
}

function buatKodeFallback(prefix: string): string {
  const matching = demoCabangStore.filter((c) => c.kode.startsWith(prefix))
  let maxNumber = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const num = parseInt(parts[1] || '0', 10)
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num
    }
  }
  const nextNum = maxNumber + 1
  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}

/**
 * Server Action untuk menyimpan cabang (create atau update).
 * Memvalidasi input melalui cabangSchema, menggunakan RPC buat_kode saat create,
 * dan memanggil revalidatePath('/cabang').
 */
export async function simpanCabangAction(
  input: CabangFormInput,
  id?: string
): Promise<ActionResponse<Cabang>> {
  const parsed = cabangSchema.safeParse(input)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues
      .map((issue) => issue.message)
      .join(', ')
    return {
      success: false,
      error: `Validasi data fasilitas gagal: ${errorMsg}`,
    }
  }

  const { nama, tipe, alamat, kota, telepon, is_aktif } = parsed.data

  try {
    const supabase = await createClient()

    // 1. UPDATE EXISTING CABANG
    if (id) {
      const { data: updatedSupabase, error: updateError } = await withTimeout(
        supabase
          .from('cabang')
          .update({
            nama,
            tipe,
            alamat: alamat || null,
            kota: kota || null,
            telepon: telepon || null,
            is_aktif,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      )

      if (!updateError && updatedSupabase) {
        revalidatePath('/cabang')
        return { success: true, data: updatedSupabase }
      }

      // Fallback ke in-memory store
      const updatedDemo = updateDemoCabang(id, {
        nama,
        tipe,
        alamat: alamat || null,
        kota: kota || null,
        telepon: telepon || null,
        is_aktif,
      })

      if (!updatedDemo) {
        return {
          success: false,
          error: `Fasilitas dengan ID ${id} tidak ditemukan.`,
        }
      }

      revalidatePath('/cabang')
      return { success: true, data: updatedDemo }
    }

    // 2. CREATE NEW CABANG
    const prefix = tentukanPrefix(tipe)
    let kodeBaru: string | null = null

    // Coba generator kode via Supabase RPC buat_kode
    try {
      const { data: rpcKode, error: rpcError } = await withTimeout(
        supabase.rpc('buat_kode', {
          p_prefix: prefix,
          p_panjang: 4,
          p_jenis: 'tanpa_reset',
        })
      )
      if (!rpcError && rpcKode) {
        kodeBaru = rpcKode
      }
    } catch {
      // Abaikan jika RPC tidak dapat dijangkau
    }

    if (!kodeBaru) {
      kodeBaru = buatKodeFallback(prefix)
    }

    // Ambil organisasi_id default
    let organisasiId = '00000000-0000-0000-0000-000000000001'
    try {
      const { data: orgData } = await withTimeout(
        supabase.from('organisasi').select('id').limit(1).maybeSingle()
      )
      if (orgData?.id) {
        organisasiId = orgData.id
      }
    } catch {
      // Gunakan organisasi default
    }

    const { data: insertedSupabase, error: insertError } = await withTimeout(
      supabase
        .from('cabang')
        .insert({
          kode: kodeBaru,
          organisasi_id: organisasiId,
          nama,
          tipe,
          alamat: alamat || null,
          kota: kota || null,
          telepon: telepon || null,
          is_aktif,
        })
        .select()
        .single()
    )

    if (!insertError && insertedSupabase) {
      revalidatePath('/cabang')
      return { success: true, data: insertedSupabase }
    }

    // Fallback ke in-memory store jika Supabase offline
    const now = new Date().toISOString()
    const newDemoCabang: Cabang = {
      id: crypto.randomUUID(),
      kode: kodeBaru,
      organisasi_id: organisasiId,
      nama,
      tipe,
      alamat: alamat || null,
      kota: kota || null,
      telepon: telepon || null,
      is_aktif,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    }

    tambahDemoCabang(newDemoCabang)
    revalidatePath('/cabang')
    return { success: true, data: newDemoCabang }
  } catch {
    // Penanganan error total offline
    const prefix = tentukanPrefix(tipe)
    const kodeBaru = buatKodeFallback(prefix)
    const now = new Date().toISOString()
    const organisasiId = '00000000-0000-0000-0000-000000000001'

    if (id) {
      const updatedDemo = updateDemoCabang(id, {
        nama,
        tipe,
        alamat: alamat || null,
        kota: kota || null,
        telepon: telepon || null,
        is_aktif,
      })
      if (!updatedDemo) {
        return {
          success: false,
          error: `Fasilitas dengan ID ${id} tidak ditemukan.`,
        }
      }
      revalidatePath('/cabang')
      return { success: true, data: updatedDemo }
    }

    const newDemoCabang: Cabang = {
      id: crypto.randomUUID(),
      kode: kodeBaru,
      organisasi_id: organisasiId,
      nama,
      tipe,
      alamat: alamat || null,
      kota: kota || null,
      telepon: telepon || null,
      is_aktif,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    }

    tambahDemoCabang(newDemoCabang)
    revalidatePath('/cabang')
    return { success: true, data: newDemoCabang }
  }
}

/**
 * Server Action untuk soft-delete cabang (mengisi deleted_at).
 * Memanggil revalidatePath('/cabang').
 */
export async function hapusCabangAction(
  id: string
): Promise<ActionResponse<boolean>> {
  if (!id) {
    return { success: false, error: 'ID cabang wajib disertakan.' }
  }

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { error: deleteError } = await withTimeout(
      supabase
        .from('cabang')
        .update({
          deleted_at: now,
          updated_at: now,
        })
        .eq('id', id)
    )

    if (!deleteError) {
      revalidatePath('/cabang')
      return { success: true, data: true }
    }

    // Fallback in-memory
    hapusDemoCabang(id)
    revalidatePath('/cabang')
    return { success: true, data: true }
  } catch {
    hapusDemoCabang(id)
    revalidatePath('/cabang')
    return { success: true, data: true }
  }
}
