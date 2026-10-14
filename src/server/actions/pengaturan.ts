'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  profilOrganisasiSchema,
  type ProfilOrganisasi,
  type ProfilOrganisasiFormInput,
} from '@/lib/validasi/pengaturan'
import {
  demoOrganisasiStore,
  updateDemoOrganisasi,
  withTimeout,
} from '@/server/queries/pengaturan'
import { tambahDemoLogAudit } from '@/server/queries/log-audit'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Server action untuk memperbarui profil organisasi dan preferensi regional.
 * Memvalidasi input melalui profilOrganisasiSchema dan memanggil revalidatePath('/pengaturan').
 */
export async function perbaruiProfilOrganisasiAction(
  input: ProfilOrganisasiFormInput
): Promise<ActionResponse<ProfilOrganisasi>> {
  const parsed = profilOrganisasiSchema.safeParse(input)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues
      .map((issue) => issue.message)
      .join(', ')
    return {
      success: false,
      error: `Validasi profil organisasi gagal: ${errorMsg}`,
    }
  }

  const validData = parsed.data
  const targetId: string = validData.id || demoOrganisasiStore.id || '00000000-0000-0000-0000-000000000001'

  try {
    const supabase = await createClient()

    const pengaturanPayload = {
      npwp: validData.npwp,
      alamat: validData.alamat,
      kota: validData.kota,
      provinsi: validData.provinsi,
      telepon: validData.telepon,
      email: validData.email,
      mata_uang_default: validData.mata_uang_default,
      mata_uang: validData.mata_uang_default,
      zona_waktu: validData.zona_waktu,
      pemisah_angka: validData.pemisah_angka,
      format_tanggal: validData.format_tanggal,
    }

    const { data: updatedSupabase, error: updateError } = await withTimeout(
      supabase
        .from('organisasi')
        .update({
          nama: validData.nama,
          pengaturan: pengaturanPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select()
        .single()
    )

    if (!updateError && updatedSupabase) {
      const result: ProfilOrganisasi = {
        ...validData,
        id: updatedSupabase.id,
        kode: updatedSupabase.kode,
        nama: updatedSupabase.nama,
        logo_url: updatedSupabase.logo_url,
        supabase_status: 'connected',
        versi_aplikasi: '1.0.0-enterprise',
        updated_at: updatedSupabase.updated_at,
      }

      const logKode = `LOG-${Date.now().toString().slice(-8)}`
      const nowIso = new Date().toISOString()

      // Insert audit record ke Supabase
      try {
        await withTimeout(
          supabase.from('log_audit').insert({
            kode: logKode,
            organisasi_id: targetId,
            cabang_id: null,
            user_id: null,
            tabel_nama: 'organisasi',
            record_id: targetId,
            aksi: 'UPDATE',
            data_lama: { nama: demoOrganisasiStore.nama, email: demoOrganisasiStore.email },
            data_baru: { nama: validData.nama, email: validData.email },
            ip_address: '127.0.0.1',
            user_agent: 'Zeropoint-App/1.0',
            created_at: nowIso,
            updated_at: nowIso,
          })
        )
      } catch {
        // Abaikan jika insert audit ke Supabase gagal agar flow utama tetap sukses
      }

      // Log audit demo store
      tambahDemoLogAudit({
        id: crypto.randomUUID(),
        kode: logKode,
        organisasi_id: targetId,
        cabang_id: null,
        cabang_nama: 'Kantor Pusat Jakarta (HQ)',
        user_id: null,
        user_nama: 'Superadmin Direksi',
        aksi: 'UPDATE',
        entitas: 'organisasi',
        entitas_id: targetId,
        tabel_nama: 'organisasi',
        record_id: targetId,
        data_lama: { nama: demoOrganisasiStore.nama, email: demoOrganisasiStore.email },
        data_baru: { nama: validData.nama, email: validData.email },
        deskripsi: `Memperbarui profil organisasi ${validData.nama}`,
        ip_address: '127.0.0.1',
        created_at: nowIso,
      })

      revalidatePath('/pengaturan')
      return { success: true, data: result }
    }

    // Fallback in-memory
    const updated = updateDemoOrganisasi({
      ...validData,
      id: targetId,
      supabase_status: 'demo',
      versi_aplikasi: '1.0.0-enterprise',
    })

    tambahDemoLogAudit({
      id: crypto.randomUUID(),
      kode: `LOG-${Date.now().toString().slice(-8)}`,
      organisasi_id: targetId,
      cabang_id: null,
      cabang_nama: 'Kantor Pusat Jakarta (HQ)',
      user_id: null,
      user_nama: 'Superadmin Direksi',
      aksi: 'UPDATE',
      entitas: 'organisasi',
      entitas_id: targetId,
      tabel_nama: 'organisasi',
      record_id: targetId,
      data_lama: { nama: demoOrganisasiStore.nama, email: demoOrganisasiStore.email },
      data_baru: { nama: validData.nama, email: validData.email },
      deskripsi: `Memperbarui profil organisasi ${validData.nama}`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    })

    revalidatePath('/pengaturan')
    return { success: true, data: updated }
  } catch {
    const updated = updateDemoOrganisasi({
      ...validData,
      id: targetId,
      supabase_status: 'demo',
      versi_aplikasi: '1.0.0-enterprise',
    })

    tambahDemoLogAudit({
      id: crypto.randomUUID(),
      kode: `LOG-${Date.now().toString().slice(-8)}`,
      organisasi_id: targetId,
      cabang_id: null,
      cabang_nama: 'Kantor Pusat Jakarta (HQ)',
      user_id: null,
      user_nama: 'Superadmin Direksi',
      aksi: 'UPDATE',
      entitas: 'organisasi',
      entitas_id: targetId,
      tabel_nama: 'organisasi',
      record_id: targetId,
      data_lama: { nama: demoOrganisasiStore.nama, email: demoOrganisasiStore.email },
      data_baru: { nama: validData.nama, email: validData.email },
      deskripsi: `Memperbarui profil organisasi ${validData.nama}`,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    })

    revalidatePath('/pengaturan')
    return { success: true, data: updated }
  }
}
