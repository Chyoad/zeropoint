'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  userSchema,
  type UserInput,
  type UserFormInput,
  type UserWithCabang,
  type CabangRingkas,
} from '@/lib/validasi/user'
import {
  demoUserStore,
  tambahDemoUser,
  updateDemoUser,
  hapusDemoUser,
  withTimeout,
} from '@/server/queries/user'
import { demoCabangStore, INITIAL_DEMO_CABANG } from '@/server/queries/cabang'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

function buatKodeUserFallback(): string {
  const matching = demoUserStore.filter((u) => u.kode.startsWith('USR-'))
  let maxNumber = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const num = parseInt(parts[1] || '0', 10)
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num
    }
  }
  const nextNum = maxNumber + 1
  return `USR-${String(nextNum).padStart(4, '0')}`
}

function resolveCabangList(
  cabangIds: string[],
  cabangDefaultId?: string | null
): CabangRingkas[] {
  const allCabang =
    demoCabangStore.length > 0 ? demoCabangStore : INITIAL_DEMO_CABANG

  return cabangIds.map((cid, idx) => {
    const found = allCabang.find((c) => c.id === cid)
    const isDefault = cabangDefaultId ? cid === cabangDefaultId : idx === 0
    return {
      id: cid,
      kode: found?.kode ?? `CBG-${cid.slice(0, 4)}`,
      nama: found?.nama ?? `Cabang ${cid.slice(0, 8)}`,
      tipe: found?.tipe ?? 'cabang',
      is_default: isDefault,
    }
  })
}

/**
 * Server Action untuk menyimpan user (create atau update).
 * Memvalidasi input melalui userSchema, menyinkronkan user_cabang,
 * dan memanggil revalidatePath('/pengguna').
 */
export async function simpanUserAction(
  input: UserFormInput,
  id?: string
): Promise<ActionResponse<UserWithCabang>> {
  const parsed = userSchema.safeParse(input)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues
      .map((issue) => issue.message)
      .join(', ')
    return {
      success: false,
      error: `Validasi data pengguna gagal: ${errorMsg}`,
    }
  }

  const {
    nama_lengkap,
    email,
    role,
    avatar_url,
    telepon,
    is_aktif,
    cabang_ids,
    cabang_default_id,
  } = parsed.data

  try {
    const supabase = await createClient()

    // 1. UPDATE EXISTING USER
    if (id) {
      const { data: updatedUser, error: updateError } = await withTimeout(
        supabase
          .from('user_profile')
          .update({
            nama_lengkap,
            email,
            role,
            avatar_url: avatar_url || null,
            telepon: telepon || null,
            is_aktif,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()
      )

      if (!updateError && updatedUser) {
        // Sinkronisasi tabel user_cabang
        try {
          // Soft-delete atau hapus pemetaan lama
          await withTimeout(
            supabase.from('user_cabang').delete().eq('user_profile_id', id)
          )

          // Masukkan pemetaan cabang baru
          if (cabang_ids && cabang_ids.length > 0) {
            const mappings = cabang_ids.map((cid, idx) => ({
              kode: `UCB-${String(Date.now()).slice(-4)}${String(idx + 1).padStart(2, '0')}`,
              user_profile_id: id,
              cabang_id: cid,
              is_default: cabang_default_id
                ? cid === cabang_default_id
                : idx === 0,
            }))

            await withTimeout(supabase.from('user_cabang').insert(mappings))
          }
        } catch {
          // Abaikan kegagalan sinkronisasi tabel relasi jika offline
        }

        const cabang_list = resolveCabangList(
          cabang_ids || [],
          cabang_default_id
        )
        const result: UserWithCabang = {
          ...updatedUser,
          cabang_list,
          cabang_default_id:
            cabang_default_id || (cabang_ids?.[0] ?? null),
        }

        revalidatePath('/pengguna')
        return { success: true, data: result }
      }

      // Fallback ke in-memory store jika Supabase query gagal
      const cabang_list = resolveCabangList(
        cabang_ids || [],
        cabang_default_id
      )
      const updatedDemo = updateDemoUser(id, {
        nama_lengkap,
        email,
        role,
        avatar_url: avatar_url || null,
        telepon: telepon || null,
        is_aktif,
        cabang_list,
        cabang_default_id:
          cabang_default_id || (cabang_ids?.[0] ?? null),
      })

      if (!updatedDemo) {
        return {
          success: false,
          error: `Pengguna dengan ID ${id} tidak ditemukan.`,
        }
      }

      revalidatePath('/pengguna')
      return { success: true, data: updatedDemo }
    }

    // 2. CREATE NEW USER
    let kodeBaru: string | null = null
    try {
      const { data: rpcKode, error: rpcError } = await withTimeout(
        supabase.rpc('buat_kode', {
          p_prefix: 'USR',
          p_panjang: 4,
          p_jenis: 'tanpa_reset',
        })
      )
      if (!rpcError && rpcKode) {
        kodeBaru = rpcKode
      }
    } catch {
      // Abaikan jika RPC tidak terjangkau
    }

    if (!kodeBaru) {
      kodeBaru = buatKodeUserFallback()
    }

    // Ambil organisasi default
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

    const newUserId = crypto.randomUUID()
    const { data: insertedUser, error: insertError } = await withTimeout(
      supabase
        .from('user_profile')
        .insert({
          id: newUserId,
          kode: kodeBaru,
          organisasi_id: organisasiId,
          user_id: crypto.randomUUID(), // placeholder auth user id jika auth terpisah
          nama_lengkap,
          email,
          role,
          avatar_url: avatar_url || null,
          telepon: telepon || null,
          is_aktif,
        })
        .select()
        .single()
    )

    if (!insertError && insertedUser) {
      // Masukkan pemetaan cabang baru
      if (cabang_ids && cabang_ids.length > 0) {
        try {
          const mappings = cabang_ids.map((cid, idx) => ({
            kode: `UCB-${String(Date.now()).slice(-4)}${String(idx + 1).padStart(2, '0')}`,
            user_profile_id: insertedUser.id,
            cabang_id: cid,
            is_default: cabang_default_id
              ? cid === cabang_default_id
              : idx === 0,
          }))
          await withTimeout(supabase.from('user_cabang').insert(mappings))
        } catch {
          // Abaikan
        }
      }

      const cabang_list = resolveCabangList(
        cabang_ids || [],
        cabang_default_id
      )
      const result: UserWithCabang = {
        ...insertedUser,
        cabang_list,
        cabang_default_id:
          cabang_default_id || (cabang_ids?.[0] ?? null),
      }

      revalidatePath('/pengguna')
      return { success: true, data: result }
    }

    // Fallback ke in-memory store jika Supabase offline
    const now = new Date().toISOString()
    const cabang_list = resolveCabangList(
      cabang_ids || [],
      cabang_default_id
    )
    const newDemoUser: UserWithCabang = {
      id: crypto.randomUUID(),
      kode: kodeBaru,
      organisasi_id: organisasiId,
      user_id: crypto.randomUUID(),
      nama_lengkap,
      email,
      role,
      avatar_url: avatar_url || null,
      telepon: telepon || null,
      is_aktif,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      cabang_list,
      cabang_default_id:
        cabang_default_id || (cabang_ids?.[0] ?? null),
    }

    tambahDemoUser(newDemoUser)
    revalidatePath('/pengguna')
    return { success: true, data: newDemoUser }
  } catch {
    // Total offline fallback
    const kodeBaru = buatKodeUserFallback()
    const now = new Date().toISOString()
    const organisasiId = '00000000-0000-0000-0000-000000000001'
    const cabang_list = resolveCabangList(
      cabang_ids || [],
      cabang_default_id
    )

    if (id) {
      const updatedDemo = updateDemoUser(id, {
        nama_lengkap,
        email,
        role,
        avatar_url: avatar_url || null,
        telepon: telepon || null,
        is_aktif,
        cabang_list,
        cabang_default_id:
          cabang_default_id || (cabang_ids?.[0] ?? null),
      })
      if (!updatedDemo) {
        return {
          success: false,
          error: `Pengguna dengan ID ${id} tidak ditemukan.`,
        }
      }
      revalidatePath('/pengguna')
      return { success: true, data: updatedDemo }
    }

    const newDemoUser: UserWithCabang = {
      id: crypto.randomUUID(),
      kode: kodeBaru,
      organisasi_id: organisasiId,
      user_id: crypto.randomUUID(),
      nama_lengkap,
      email,
      role,
      avatar_url: avatar_url || null,
      telepon: telepon || null,
      is_aktif,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      cabang_list,
      cabang_default_id:
        cabang_default_id || (cabang_ids?.[0] ?? null),
    }

    tambahDemoUser(newDemoUser)
    revalidatePath('/pengguna')
    return { success: true, data: newDemoUser }
  }
}

/**
 * Server Action untuk soft-delete pengguna (mengisi deleted_at).
 * Proteksi keamanan: Tidak boleh menghapus user Superadmin terakhir.
 * Memanggil revalidatePath('/pengguna').
 */
export async function hapusUserAction(
  id: string
): Promise<ActionResponse<boolean>> {
  if (!id) {
    return { success: false, error: 'ID pengguna wajib disertakan.' }
  }

  // 1. Cek proteksi superadmin terakhir pada in-memory store terlebih dahulu
  const targetDemo = demoUserStore.find((u) => u.id === id && !u.deleted_at)
  if (targetDemo && targetDemo.role === 'superadmin') {
    const activeSuperadmins = demoUserStore.filter(
      (u) => u.role === 'superadmin' && !u.deleted_at
    )
    if (activeSuperadmins.length <= 1) {
      return {
        success: false,
        error:
          'Tidak dapat menghapus pengguna dengan peran Superadmin terakhir demi keamanan sistem.',
      }
    }
  }

  try {
    const supabase = await createClient()

    // 2. Cek proteksi superadmin pada Supabase jika terhubung
    try {
      const { data: targetUser } = await withTimeout(
        supabase
          .from('user_profile')
          .select('id, role')
          .eq('id', id)
          .is('deleted_at', null)
          .maybeSingle()
      )

      if (targetUser && targetUser.role === 'superadmin') {
        const { data: superadmins } = await withTimeout(
          supabase
            .from('user_profile')
            .select('id')
            .eq('role', 'superadmin')
            .is('deleted_at', null)
        )
        if (superadmins && superadmins.length <= 1) {
          return {
            success: false,
            error:
              'Tidak dapat menghapus pengguna dengan peran Superadmin terakhir demi keamanan sistem.',
          }
        }
      }
    } catch {
      // Abaikan jika query pengecekan Supabase timeout
    }

    const now = new Date().toISOString()
    const { error: deleteError } = await withTimeout(
      supabase
        .from('user_profile')
        .update({
          deleted_at: now,
          updated_at: now,
        })
        .eq('id', id)
    )

    if (!deleteError) {
      hapusDemoUser(id)
      revalidatePath('/pengguna')
      return { success: true, data: true }
    }

    // Fallback in-memory
    hapusDemoUser(id)
    revalidatePath('/pengguna')
    return { success: true, data: true }
  } catch {
    hapusDemoUser(id)
    revalidatePath('/pengguna')
    return { success: true, data: true }
  }
}
