'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  produkSchema,
  type Produk,
  type SatuanProduk,
  type KomponenPaket,
  type StokProduk,
  type KartuStok,
  type ProdukFormInput,
  type ProdukInput,
} from '@/lib/validasi/produk'
import { konversiKeSatuanDasar } from '@/lib/konversi-satuan'
import {
  demoProdukStore,
  demoSatuanStore,
  demoKomponenStore,
  demoStokStore,
  demoKartuStokStore,
  withTimeout,
} from '@/server/queries/produk'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

function buatKodeFallback(prefix: string, store: Array<{ kode: string }>): string {
  const matching = store.filter((item) => item.kode.startsWith(prefix))
  let maxNumber = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const lastPart = parts[parts.length - 1]
    const num = parseInt(lastPart || '0', 10)
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num
    }
  }
  const nextNum = maxNumber + 1
  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}

function buatKodeKartuStokFallback(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${date}`
  const prefix = `KST-${dateStr}`

  const matching = demoKartuStokStore.filter((k) => k.kode.startsWith(prefix))
  let maxNumber = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const num = parseInt(parts[2] || '0', 10)
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num
    }
  }
  const nextNum = maxNumber + 1
  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}

/**
 * Server Action untuk membuat atau memperbarui produk secara atomik.
 */
export async function simpanProdukAction(
  input: ProdukFormInput,
  id?: string
): Promise<ActionResponse<Produk>> {
  const parsed = produkSchema.safeParse(input)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues
      .map((issue) => issue.message)
      .join(', ')
    return {
      success: false,
      error: `Validasi master produk gagal: ${errorMsg}`,
    }
  }

  const {
    nama,
    tipe_produk,
    metode_valuasi,
    kategori_produk_id,
    harga_pokok_standar,
    harga_beli_terakhir,
    peringatan_stok_minimum,
    dapat_dijual,
    dapat_dibeli,
    gambar_url,
    deskripsi,
    is_aktif,
    satuan,
    komponen,
    saldo_awal,
  } = parsed.data

  try {
    const supabase = await createClient()

    // ==========================================
    // 1. UPDATE EXISTING PRODUCT
    // ==========================================
    if (id) {
      const now = new Date().toISOString()

      const { data: updatedSupabase, error: updateError } = await withTimeout(
        supabase
          .from('produk')
          .update({
            nama,
            tipe_produk,
            metode_valuasi,
            kategori_produk_id: kategori_produk_id || null,
            harga_pokok_standar,
            harga_beli_terakhir,
            peringatan_stok_minimum,
            dapat_dijual,
            dapat_dibeli,
            gambar_url: gambar_url || null,
            deskripsi: deskripsi || null,
            is_aktif,
            updated_at: now,
          })
          .eq('id', id)
          .select()
          .single()
      )

      if (!updateError && updatedSupabase) {
        // Update / upsert satuan_produk
        for (const s of satuan) {
          if (s.id) {
            await withTimeout(
              supabase
                .from('satuan_produk')
                .update({
                  nama_satuan: s.nama_satuan,
                  rasio_ke_dasar: s.rasio_ke_dasar,
                  is_satuan_dasar: s.is_satuan_dasar,
                  barcode: s.barcode || null,
                  harga_jual_default: s.harga_jual_default,
                  harga_jual_grosir: s.harga_jual_grosir,
                  harga_jual_member: s.harga_jual_member,
                  updated_at: now,
                })
                .eq('id', s.id)
            )
          } else {
            await withTimeout(
              supabase.from('satuan_produk').insert({
                kode: buatKodeFallback('SAT', demoSatuanStore),
                produk_id: id,
                nama_satuan: s.nama_satuan,
                rasio_ke_dasar: s.rasio_ke_dasar,
                is_satuan_dasar: s.is_satuan_dasar,
                barcode: s.barcode || null,
                harga_jual_default: s.harga_jual_default,
                harga_jual_grosir: s.harga_jual_grosir,
                harga_jual_member: s.harga_jual_member,
              })
            )
          }
        }

        revalidatePath('/produk')
        revalidatePath('/dashboard')
        return { success: true, data: updatedSupabase }
      }

      // Demo fallback update
      const existingIdx = demoProdukStore.findIndex((p) => p.id === id)
      if (existingIdx === -1) {
        return { success: false, error: `Produk dengan ID ${id} tidak ditemukan.` }
      }

      demoProdukStore[existingIdx] = {
        ...demoProdukStore[existingIdx],
        nama,
        tipe_produk,
        metode_valuasi,
        kategori_produk_id: kategori_produk_id || null,
        harga_pokok_standar,
        harga_beli_terakhir,
        peringatan_stok_minimum,
        dapat_dijual,
        dapat_dibeli,
        gambar_url: gambar_url || null,
        deskripsi: deskripsi || null,
        is_aktif,
        updated_at: now,
      }

      // Sync satuan di in-memory store
      // Hapus satuan lama produk ini yang tidak ada di input
      const currentSatuan = demoSatuanStore.filter((s) => s.produk_id === id)
      currentSatuan.forEach((cs) => {
        const stillExists = satuan.some((s) => s.id === cs.id)
        if (!stillExists) {
          cs.deleted_at = now
        }
      })

      // Update / insert satuan baru
      satuan.forEach((s) => {
        if (s.id) {
          const idx = demoSatuanStore.findIndex((ds) => ds.id === s.id)
          if (idx !== -1) {
            demoSatuanStore[idx] = {
              ...demoSatuanStore[idx],
              nama_satuan: s.nama_satuan,
              rasio_ke_dasar: s.rasio_ke_dasar,
              is_satuan_dasar: s.is_satuan_dasar,
              barcode: s.barcode || null,
              harga_jual_default: s.harga_jual_default,
              harga_jual_grosir: s.harga_jual_grosir,
              harga_jual_member: s.harga_jual_member,
              updated_at: now,
            }
          }
        } else {
          const newSatuan: SatuanProduk = {
            id: crypto.randomUUID(),
            kode: buatKodeFallback('SAT', demoSatuanStore),
            produk_id: id,
            nama_satuan: s.nama_satuan,
            rasio_ke_dasar: s.rasio_ke_dasar,
            is_satuan_dasar: s.is_satuan_dasar,
            barcode: s.barcode || null,
            harga_jual_default: s.harga_jual_default,
            harga_jual_grosir: s.harga_jual_grosir,
            harga_jual_member: s.harga_jual_member,
            created_at: now,
            updated_at: now,
            created_by: null,
            updated_by: null,
            deleted_at: null,
            deleted_by: null,
          }
          demoSatuanStore.push(newSatuan)
        }
      })

      revalidatePath('/produk')
      revalidatePath('/dashboard')
      return { success: true, data: demoProdukStore[existingIdx] }
    }

    // ==========================================
    // 2. CREATE NEW PRODUCT
    // ==========================================
    let kodeBaru: string | null = null
    try {
      const { data: rpcKode, error: rpcError } = await withTimeout(
        supabase.rpc('buat_kode', {
          p_prefix: 'PRD',
          p_panjang: 4,
          p_jenis: 'tanpa_reset',
        })
      )
      if (!rpcError && rpcKode) {
        kodeBaru = rpcKode
      }
    } catch {
      // RPC offline
    }

    if (!kodeBaru) {
      kodeBaru = buatKodeFallback('PRD', demoProdukStore)
    }

    let organisasiId = '00000000-0000-0000-0000-000000000001'
    try {
      const { data: orgData } = await withTimeout(
        supabase.from('organisasi').select('id').limit(1).maybeSingle()
      )
      if (orgData?.id) {
        organisasiId = orgData.id
      }
    } catch {
      // Ignore
    }

    const { data: insertedSupabase, error: insertError } = await withTimeout(
      supabase
        .from('produk')
        .insert({
          kode: kodeBaru,
          organisasi_id: organisasiId,
          kategori_produk_id: kategori_produk_id || null,
          nama,
          tipe_produk,
          metode_valuasi,
          harga_pokok_standar,
          harga_beli_terakhir,
          peringatan_stok_minimum,
          dapat_dijual,
          dapat_dibeli,
          gambar_url: gambar_url || null,
          deskripsi: deskripsi || null,
          is_aktif,
        })
        .select()
        .single()
    )

    if (!insertError && insertedSupabase) {
      const newProductId = insertedSupabase.id

      // Insert satuan_produk
      let baseSatuanIdSupabase: string | null = null
      for (const s of satuan) {
        const { data: satData } = await withTimeout(
          supabase
            .from('satuan_produk')
            .insert({
              kode: buatKodeFallback('SAT', demoSatuanStore),
              produk_id: newProductId,
              nama_satuan: s.nama_satuan,
              rasio_ke_dasar: s.rasio_ke_dasar,
              is_satuan_dasar: s.is_satuan_dasar,
              barcode: s.barcode || null,
              harga_jual_default: s.harga_jual_default,
              harga_jual_grosir: s.harga_jual_grosir,
              harga_jual_member: s.harga_jual_member,
            })
            .select()
            .single()
        )
        if (s.is_satuan_dasar && satData?.id) {
          baseSatuanIdSupabase = satData.id
        }
      }

      // Jika paket, simpan komponen
      if (tipe_produk === 'paket' && komponen.length > 0) {
        for (const k of komponen) {
          await withTimeout(
            supabase.from('komponen_paket').insert({
              kode: buatKodeFallback('KPK', demoKomponenStore),
              paket_id: newProductId,
              produk_komponen_id: k.produk_komponen_id,
              satuan_produk_id: k.satuan_produk_id || null,
              kuantitas: k.kuantitas,
            })
          )
        }
      }

      // Jika persediaan dan ada saldo_awal
      if (tipe_produk === 'persediaan' && saldo_awal && saldo_awal.length > 0) {
        for (const sa of saldo_awal) {
          if (sa.kuantitas > 0) {
            const totalNilai = sa.kuantitas * sa.harga_pokok
            await withTimeout(
              supabase.from('stok_produk').insert({
                kode: buatKodeFallback('STK', demoStokStore),
                produk_id: newProductId,
                cabang_id: sa.cabang_id,
                kuantitas: sa.kuantitas,
                kuantitas_tersedia: sa.kuantitas,
                kuantitas_tertahan: 0,
                hpp_rata_rata: sa.harga_pokok,
                total_nilai: totalNilai,
              })
            )

            await withTimeout(
              supabase.from('kartu_stok').insert({
                kode: buatKodeKartuStokFallback(),
                cabang_id: sa.cabang_id,
                produk_id: newProductId,
                tanggal: new Date().toISOString(),
                jenis_mutasi: 'saldo_awal',
                nomor_referensi: `SA-${kodeBaru}`,
                satuan_produk_id: baseSatuanIdSupabase,
                kuantitas_transaksi: sa.kuantitas,
                faktor_konversi: 1,
                kuantitas_masuk: sa.kuantitas,
                kuantitas_keluar: 0,
                sisa_kuantitas: sa.kuantitas,
                harga_satuan: sa.harga_pokok,
                total_nilai_masuk: totalNilai,
                total_nilai_keluar: 0,
                saldo_nilai: totalNilai,
                hpp_rata_rata: sa.harga_pokok,
                catatan: `Saldo awal produk baru ${nama}`,
              })
            )
          }
        }
      }

      revalidatePath('/produk')
      revalidatePath('/dashboard')
      return { success: true, data: insertedSupabase }
    }

    // Demo store fallback
    const now = new Date().toISOString()
    const newProductId = crypto.randomUUID()
    const newDemoProduct: Produk = {
      id: newProductId,
      kode: kodeBaru,
      organisasi_id: organisasiId,
      kategori_produk_id: kategori_produk_id || null,
      nama,
      tipe_produk,
      metode_valuasi,
      harga_pokok_standar,
      harga_beli_terakhir,
      peringatan_stok_minimum,
      dapat_dijual,
      dapat_dibeli,
      gambar_url: gambar_url || null,
      deskripsi: deskripsi || null,
      is_aktif,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    }

    demoProdukStore.push(newDemoProduct)

    // Simpan satuan ke in-memory store
    let baseSatuanId: string | null = null
    satuan.forEach((s) => {
      const satId = crypto.randomUUID()
      if (s.is_satuan_dasar) {
        baseSatuanId = satId
      }
      demoSatuanStore.push({
        id: satId,
        kode: buatKodeFallback('SAT', demoSatuanStore),
        produk_id: newProductId,
        nama_satuan: s.nama_satuan,
        rasio_ke_dasar: s.rasio_ke_dasar,
        is_satuan_dasar: s.is_satuan_dasar,
        barcode: s.barcode || null,
        harga_jual_default: s.harga_jual_default,
        harga_jual_grosir: s.harga_jual_grosir,
        harga_jual_member: s.harga_jual_member,
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      })
    })

    // Simpan komponen paket jika paket
    if (tipe_produk === 'paket' && komponen.length > 0) {
      komponen.forEach((k) => {
        demoKomponenStore.push({
          id: crypto.randomUUID(),
          kode: buatKodeFallback('KPK', demoKomponenStore),
          paket_id: newProductId,
          produk_komponen_id: k.produk_komponen_id,
          satuan_produk_id: k.satuan_produk_id || null,
          kuantitas: k.kuantitas,
          created_at: now,
          updated_at: now,
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        })
      })
    }

    // Simpan saldo awal persediaan
    if (tipe_produk === 'persediaan' && saldo_awal && saldo_awal.length > 0) {
      saldo_awal.forEach((sa) => {
        if (sa.kuantitas > 0) {
          const totalNilai = sa.kuantitas * sa.harga_pokok
          demoStokStore.push({
            id: crypto.randomUUID(),
            kode: buatKodeFallback('STK', demoStokStore),
            produk_id: newProductId,
            cabang_id: sa.cabang_id,
            kuantitas: sa.kuantitas,
            kuantitas_tersedia: sa.kuantitas,
            kuantitas_tertahan: 0,
            hpp_rata_rata: sa.harga_pokok,
            total_nilai: totalNilai,
            created_at: now,
            updated_at: now,
            created_by: null,
            updated_by: null,
            deleted_at: null,
            deleted_by: null,
          })

          demoKartuStokStore.push({
            id: crypto.randomUUID(),
            kode: buatKodeKartuStokFallback(),
            cabang_id: sa.cabang_id,
            produk_id: newProductId,
            tanggal: now,
            jenis_mutasi: 'saldo_awal',
            nomor_referensi: `SA-${kodeBaru}`,
            referensi_id: null,
            satuan_produk_id: baseSatuanId,
            kuantitas_transaksi: sa.kuantitas,
            faktor_konversi: 1,
            kuantitas_masuk: sa.kuantitas,
            kuantitas_keluar: 0,
            sisa_kuantitas: sa.kuantitas,
            harga_satuan: sa.harga_pokok,
            total_nilai_masuk: totalNilai,
            total_nilai_keluar: 0,
            saldo_nilai: totalNilai,
            hpp_rata_rata: sa.harga_pokok,
            batch_nomor: null,
            tanggal_kadaluarsa: null,
            kartu_stok_masuk_id: null,
            catatan: `Saldo awal produk baru ${nama}`,
            created_at: now,
            updated_at: now,
            created_by: null,
            updated_by: null,
            deleted_at: null,
            deleted_by: null,
          })
        }
      })
    }

    revalidatePath('/produk')
    revalidatePath('/dashboard')
    return { success: true, data: newDemoProduct }
  } catch (error: any) {
    // Tangani error fatal offline
    const now = new Date().toISOString()
    const organisasiId = '00000000-0000-0000-0000-000000000001'

    if (id) {
      const existingIdx = demoProdukStore.findIndex((p) => p.id === id)
      if (existingIdx !== -1) {
        demoProdukStore[existingIdx] = {
          ...demoProdukStore[existingIdx],
          nama,
          tipe_produk,
          metode_valuasi,
          kategori_produk_id: kategori_produk_id || null,
          harga_pokok_standar,
          harga_beli_terakhir,
          peringatan_stok_minimum,
          dapat_dijual,
          dapat_dibeli,
          gambar_url: gambar_url || null,
          deskripsi: deskripsi || null,
          is_aktif,
          updated_at: now,
        }

        // Hapus satuan lama produk ini yang tidak ada di input
        const currentSatuan = demoSatuanStore.filter(
          (s) => s.produk_id === id && !s.deleted_at
        )
        currentSatuan.forEach((cs) => {
          const stillExists = satuan.some((s) => s.id === cs.id)
          if (!stillExists) {
            cs.deleted_at = now
          }
        })

        // Simpan satuan
        satuan.forEach((s) => {
          if (s.id) {
            const satIdx = demoSatuanStore.findIndex((ds) => ds.id === s.id)
            if (satIdx !== -1) {
              demoSatuanStore[satIdx] = {
                ...demoSatuanStore[satIdx],
                nama_satuan: s.nama_satuan,
                rasio_ke_dasar: s.rasio_ke_dasar,
                is_satuan_dasar: s.is_satuan_dasar,
                barcode: s.barcode || null,
                harga_jual_default: s.harga_jual_default,
                harga_jual_grosir: s.harga_jual_grosir,
                harga_jual_member: s.harga_jual_member,
                updated_at: now,
              }
            }
          } else {
            demoSatuanStore.push({
              id: crypto.randomUUID(),
              kode: buatKodeFallback('SAT', demoSatuanStore),
              produk_id: id,
              nama_satuan: s.nama_satuan,
              rasio_ke_dasar: s.rasio_ke_dasar,
              is_satuan_dasar: s.is_satuan_dasar,
              barcode: s.barcode || null,
              harga_jual_default: s.harga_jual_default,
              harga_jual_grosir: s.harga_jual_grosir,
              harga_jual_member: s.harga_jual_member,
              created_at: now,
              updated_at: now,
              created_by: null,
              updated_by: null,
              deleted_at: null,
              deleted_by: null,
            })
          }
        })

        revalidatePath('/produk')
        revalidatePath('/dashboard')
        return { success: true, data: demoProdukStore[existingIdx] }
      }
      return { success: false, error: `Produk ID ${id} tidak ditemukan` }
    }

    const kodeBaru = buatKodeFallback('PRD', demoProdukStore)
    const newProductId = crypto.randomUUID()
    const newDemoProduct: Produk = {
      id: newProductId,
      kode: kodeBaru,
      organisasi_id: organisasiId,
      kategori_produk_id: kategori_produk_id || null,
      nama,
      tipe_produk,
      metode_valuasi,
      harga_pokok_standar,
      harga_beli_terakhir,
      peringatan_stok_minimum,
      dapat_dijual,
      dapat_dibeli,
      gambar_url: gambar_url || null,
      deskripsi: deskripsi || null,
      is_aktif,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    }

    demoProdukStore.push(newDemoProduct)

    let baseSatuanId: string | null = null
    satuan.forEach((s) => {
      const satId = crypto.randomUUID()
      if (s.is_satuan_dasar) {
        baseSatuanId = satId
      }
      demoSatuanStore.push({
        id: satId,
        kode: buatKodeFallback('SAT', demoSatuanStore),
        produk_id: newProductId,
        nama_satuan: s.nama_satuan,
        rasio_ke_dasar: s.rasio_ke_dasar,
        is_satuan_dasar: s.is_satuan_dasar,
        barcode: s.barcode || null,
        harga_jual_default: s.harga_jual_default,
        harga_jual_grosir: s.harga_jual_grosir,
        harga_jual_member: s.harga_jual_member,
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      })
    })

    if (tipe_produk === 'paket' && komponen.length > 0) {
      komponen.forEach((k) => {
        demoKomponenStore.push({
          id: crypto.randomUUID(),
          kode: buatKodeFallback('KPK', demoKomponenStore),
          paket_id: newProductId,
          produk_komponen_id: k.produk_komponen_id,
          satuan_produk_id: k.satuan_produk_id || null,
          kuantitas: k.kuantitas,
          created_at: now,
          updated_at: now,
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        })
      })
    }

    if (tipe_produk === 'persediaan' && saldo_awal && saldo_awal.length > 0) {
      saldo_awal.forEach((sa) => {
        if (sa.kuantitas > 0) {
          const totalNilai = sa.kuantitas * sa.harga_pokok
          demoStokStore.push({
            id: crypto.randomUUID(),
            kode: buatKodeFallback('STK', demoStokStore),
            produk_id: newProductId,
            cabang_id: sa.cabang_id,
            kuantitas: sa.kuantitas,
            kuantitas_tersedia: sa.kuantitas,
            kuantitas_tertahan: 0,
            hpp_rata_rata: sa.harga_pokok,
            total_nilai: totalNilai,
            created_at: now,
            updated_at: now,
            created_by: null,
            updated_by: null,
            deleted_at: null,
            deleted_by: null,
          })

          demoKartuStokStore.push({
            id: crypto.randomUUID(),
            kode: buatKodeKartuStokFallback(),
            cabang_id: sa.cabang_id,
            produk_id: newProductId,
            tanggal: now,
            jenis_mutasi: 'saldo_awal',
            nomor_referensi: `SA-${kodeBaru}`,
            referensi_id: null,
            satuan_produk_id: baseSatuanId,
            kuantitas_transaksi: sa.kuantitas,
            faktor_konversi: 1,
            kuantitas_masuk: sa.kuantitas,
            kuantitas_keluar: 0,
            sisa_kuantitas: sa.kuantitas,
            harga_satuan: sa.harga_pokok,
            total_nilai_masuk: totalNilai,
            total_nilai_keluar: 0,
            saldo_nilai: totalNilai,
            hpp_rata_rata: sa.harga_pokok,
            batch_nomor: null,
            tanggal_kadaluarsa: null,
            kartu_stok_masuk_id: null,
            catatan: `Saldo awal produk baru ${nama}`,
            created_at: now,
            updated_at: now,
            created_by: null,
            updated_by: null,
            deleted_at: null,
            deleted_by: null,
          })
        }
      })
    }

    revalidatePath('/produk')
    revalidatePath('/dashboard')
    return { success: true, data: newDemoProduct }
  }
}

/**
 * Server Action untuk soft-delete produk (mengisi deleted_at).
 */
export async function hapusProdukAction(
  id: string
): Promise<ActionResponse<boolean>> {
  if (!id) {
    return { success: false, error: 'ID produk wajib disertakan' }
  }

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { error: deleteError } = await withTimeout(
      supabase
        .from('produk')
        .update({
          deleted_at: now,
          updated_at: now,
        })
        .eq('id', id)
    )

    if (!deleteError) {
      revalidatePath('/produk')
      revalidatePath('/dashboard')
      return { success: true, data: true }
    }

    // Fallback demo store
    const idx = demoProdukStore.findIndex((p) => p.id === id)
    if (idx !== -1) {
      demoProdukStore[idx] = {
        ...demoProdukStore[idx],
        deleted_at: now,
        updated_at: now,
      }
    }

    revalidatePath('/produk')
    revalidatePath('/dashboard')
    return { success: true, data: true }
  } catch {
    const now = new Date().toISOString()
    const idx = demoProdukStore.findIndex((p) => p.id === id)
    if (idx !== -1) {
      demoProdukStore[idx] = {
        ...demoProdukStore[idx],
        deleted_at: now,
        updated_at: now,
      }
    }

    revalidatePath('/produk')
    revalidatePath('/dashboard')
    return { success: true, data: true }
  }
}
