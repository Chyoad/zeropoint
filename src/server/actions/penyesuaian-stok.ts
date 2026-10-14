'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  penyesuaianStokSchema,
  hitungSelisihOpname,
  type PenyesuaianStok,
  type PenyesuaianStokItem,
  type PenyesuaianStokFormInput,
} from '@/lib/validasi/penyesuaian-stok'
import type { KartuStok, StokProduk } from '@/lib/validasi/produk'
import {
  demoPenyesuaianStokStore,
  demoPenyesuaianStokItemStore,
  ambilProdukDanStokBuku,
  type ProdukStokBuku,
} from '@/server/queries/penyesuaian-stok'
import {
  demoStokStore,
  demoKartuStokStore,
  demoSatuanStore,
  withTimeout,
} from '@/server/queries/produk'
import { konversiKeSatuanDasar } from '@/lib/konversi-satuan'

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

function formatTanggalYMD(tanggalStr?: string | Date): string {
  const d = tanggalStr ? new Date(tanggalStr) : new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dt = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${dt}`
}

function buatKodePenyesuaianFallback(
  tanggalStr?: string,
  store = demoPenyesuaianStokStore
): string {
  const dateStr = formatTanggalYMD(tanggalStr)
  const prefix = `ADJ-${dateStr}`
  const matching = store.filter((k) => k.kode.startsWith(prefix))
  let maxNum = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const last = parts[parts.length - 1]
    const num = parseInt(last || '0', 10)
    if (!isNaN(num) && num > maxNum) maxNum = num
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`
}

function buatKodeKartuStokFallback(tanggalStr?: string): string {
  const dateStr = formatTanggalYMD(tanggalStr)
  const prefix = `KST-${dateStr}`
  const matching = demoKartuStokStore.filter((k) => k.kode.startsWith(prefix))
  let maxNum = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const last = parts[parts.length - 1]
    const num = parseInt(last || '0', 10)
    if (!isNaN(num) && num > maxNum) maxNum = num
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`
}

function buatKodeStokFallback(): string {
  const matching = demoStokStore.filter((k) => k.kode.startsWith('STK'))
  let maxNum = 0
  for (const item of matching) {
    const parts = item.kode.split('-')
    const last = parts[parts.length - 1]
    const num = parseInt(last || '0', 10)
    if (!isNaN(num) && num > maxNum) maxNum = num
  }
  return `STK-${String(maxNum + 1).padStart(4, '0')}`
}

/**
 * Eksekusi mutasi saldo stok_produk dan catatan kartu_stok untuk item penyesuaian yang selesai
 */
async function eksekusiMutasiStok(
  header: PenyesuaianStok,
  items: PenyesuaianStokItem[]
) {
  const now = new Date().toISOString()
  let supabase: any = null
  try {
    supabase = await createClient()
  } catch {
    // Supabase offline / in-memory fallback
  }

  for (const item of items) {
    const satuan = item.satuan_produk_id
      ? demoSatuanStore.find((s) => s.id === item.satuan_produk_id && !s.deleted_at)
      : null
    const rasioKeDasar = satuan ? Number(satuan.rasio_ke_dasar) || 1 : 1

    const { selisih, totalNilaiSelisih, jenisMutasi } = hitungSelisihOpname(
      item.stok_buku,
      item.stok_fisik,
      item.harga_satuan,
      rasioKeDasar
    )

    const stokFisikDasar = konversiKeSatuanDasar(item.stok_fisik, rasioKeDasar)

    // Update demo store saldo stok_produk
    let demoStok = demoStokStore.find(
      (s) =>
        s.cabang_id === header.cabang_id &&
        s.produk_id === item.produk_id &&
        !s.deleted_at
    )

    if (demoStok) {
      const kuantitasTertahan = Number(demoStok.kuantitas_tertahan) || 0
      demoStok.kuantitas = stokFisikDasar
      demoStok.kuantitas_tersedia = Math.max(0, stokFisikDasar - kuantitasTertahan)
      demoStok.total_nilai = parseFloat(
        (stokFisikDasar * (item.harga_satuan || demoStok.hpp_rata_rata)).toPrecision(12)
      )
      demoStok.updated_at = now
    } else {
      demoStok = {
        id: crypto.randomUUID(),
        kode: buatKodeStokFallback(),
        cabang_id: header.cabang_id,
        produk_id: item.produk_id,
        kuantitas: stokFisikDasar,
        kuantitas_tersedia: stokFisikDasar,
        kuantitas_tertahan: 0,
        hpp_rata_rata: item.harga_satuan,
        total_nilai: parseFloat((stokFisikDasar * item.harga_satuan).toPrecision(12)),
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      }
      demoStokStore.push(demoStok)
    }

    // Update Supabase stok_produk jika online
    if (supabase) {
      try {
        const { data: dbStok } = await withTimeout<any>(
          supabase
            .from('stok_produk')
            .select('id, hpp_rata_rata, kuantitas_tertahan')
            .eq('cabang_id', header.cabang_id)
            .eq('produk_id', item.produk_id)
            .is('deleted_at', null)
            .maybeSingle()
        )

        if (dbStok) {
          const tertahan = Number(dbStok.kuantitas_tertahan) || 0
          await withTimeout(
            supabase
              .from('stok_produk')
              .update({
                kuantitas: stokFisikDasar,
                kuantitas_tersedia: Math.max(0, stokFisikDasar - tertahan),
                total_nilai:
                  stokFisikDasar * (item.harga_satuan || dbStok.hpp_rata_rata),
                updated_at: now,
              })
              .eq('id', dbStok.id)
          )
        } else {
          await withTimeout(
            supabase.from('stok_produk').insert({
              kode: buatKodeStokFallback(),
              cabang_id: header.cabang_id,
              produk_id: item.produk_id,
              kuantitas: stokFisikDasar,
              kuantitas_tersedia: stokFisikDasar,
              kuantitas_tertahan: 0,
              hpp_rata_rata: item.harga_satuan,
              total_nilai: stokFisikDasar * item.harga_satuan,
              created_at: now,
              updated_at: now,
            })
          )
        }
      } catch {
        // Supabase offline, demo store already updated
      }
    }

    // Catat mutasi kartu stok jika ada selisih kuantitas
    if (jenisMutasi) {
      const kartuStokKode = buatKodeKartuStokFallback(header.tanggal)
      const absSelisih = Math.abs(selisih)
      const kuantitasMasuk = selisih > 0 ? selisih : 0
      const kuantitasKeluar = selisih < 0 ? absSelisih : 0
      const totalNilaiMasuk = selisih > 0 ? totalNilaiSelisih : 0
      const totalNilaiKeluar = selisih < 0 ? Math.abs(totalNilaiSelisih) : 0
      const saldoNilai = parseFloat(
        (stokFisikDasar * (item.harga_satuan || demoStok.hpp_rata_rata)).toPrecision(12)
      )

      const kartuStokEntry: KartuStok = {
        id: crypto.randomUUID(),
        kode: kartuStokKode,
        cabang_id: header.cabang_id,
        produk_id: item.produk_id,
        tanggal: header.tanggal,
        jenis_mutasi: jenisMutasi,
        nomor_referensi: header.kode,
        referensi_id: header.id,
        satuan_produk_id: item.satuan_produk_id || null,
        kuantitas_transaksi: Math.abs(item.stok_fisik - item.stok_buku),
        faktor_konversi: rasioKeDasar,
        kuantitas_masuk: kuantitasMasuk,
        kuantitas_keluar: kuantitasKeluar,
        sisa_kuantitas: stokFisikDasar,
        harga_satuan: item.harga_satuan,
        total_nilai_masuk: totalNilaiMasuk,
        total_nilai_keluar: totalNilaiKeluar,
        saldo_nilai: saldoNilai,
        hpp_rata_rata: item.harga_satuan || demoStok.hpp_rata_rata,
        batch_nomor: null,
        tanggal_kadaluarsa: null,
        kartu_stok_masuk_id: null,
        catatan: item.alasan
          ? `Penyesuaian stok (${header.kode}): ${item.alasan}`
          : `Penyesuaian stok (${header.kode})`,
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      }

      demoKartuStokStore.push(kartuStokEntry)

      if (supabase) {
        try {
          await withTimeout(
            supabase.from('kartu_stok').insert({
              kode: kartuStokKode,
              cabang_id: header.cabang_id,
              produk_id: item.produk_id,
              tanggal: header.tanggal,
              jenis_mutasi: jenisMutasi,
              nomor_referensi: header.kode,
              referensi_id: header.id,
              satuan_produk_id: item.satuan_produk_id || null,
              kuantitas_transaksi: Math.abs(item.stok_fisik - item.stok_buku),
              faktor_konversi: rasioKeDasar,
              kuantitas_masuk: kuantitasMasuk,
              kuantitas_keluar: kuantitasKeluar,
              sisa_kuantitas: stokFisikDasar,
              harga_satuan: item.harga_satuan,
              total_nilai_masuk: totalNilaiMasuk,
              total_nilai_keluar: totalNilaiKeluar,
              saldo_nilai: saldoNilai,
              hpp_rata_rata: item.harga_satuan || demoStok.hpp_rata_rata,
              catatan: kartuStokEntry.catatan,
              created_at: now,
              updated_at: now,
            })
          )
        } catch {
          // Supabase offline, demo store handled
        }
      }
    }
  }
}

/**
 * Server Action untuk menyimpan penyesuaian stok (draft atau langsung selesai).
 */
export async function simpanPenyesuaianStokAction(
  input: PenyesuaianStokFormInput,
  id?: string
): Promise<ActionResponse<PenyesuaianStok>> {
  const parsed = penyesuaianStokSchema.safeParse(input)
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ')
    return {
      success: false,
      error: `Validasi penyesuaian stok gagal: ${errorMsg}`,
    }
  }

  const {
    cabang_id,
    tanggal,
    tipe_penyesuaian,
    status,
    catatan,
    items,
  } = parsed.data

  const now = new Date().toISOString()
  let supabase: any = null
  try {
    supabase = await createClient()
  } catch {
    // Offline / demo fallback
  }

  // Generate kode unik harian atomik: buat_kode('ADJ', 4, 'harian', input.tanggal)
  let kodeBaru: string | null = null
  if (supabase) {
    try {
      const { data: rpcKode, error: rpcError } = await withTimeout<any>(
        supabase.rpc('buat_kode', {
          p_prefix: 'ADJ',
          p_panjang: 4,
          p_jenis: 'harian',
          p_tanggal: tanggal,
        })
      )
      if (!rpcError && rpcKode) {
        kodeBaru = rpcKode
      }
    } catch {
      // Offline
    }
  }

  if (!kodeBaru) {
    kodeBaru = buatKodePenyesuaianFallback(tanggal, demoPenyesuaianStokStore)
  }

  let recordHeader: PenyesuaianStok
  const itemsToSave: PenyesuaianStokItem[] = []

  if (id) {
    // UPDATE EXISTING RECORD (jika status masih draft)
    const existingIndex = demoPenyesuaianStokStore.findIndex(
      (p) => p.id === id && !p.deleted_at
    )
    if (existingIndex >= 0) {
      const existing = demoPenyesuaianStokStore[existingIndex]
      if (existing.status === 'selesai') {
        return {
          success: false,
          error: 'Penyesuaian stok yang sudah selesai tidak dapat diedit.',
        }
      }
      if (existing.status === 'dibatalkan') {
        return {
          success: false,
          error: 'Penyesuaian stok yang dibatalkan tidak dapat diedit.',
        }
      }

      recordHeader = {
        ...existing,
        cabang_id,
        tanggal,
        tipe_penyesuaian,
        status,
        catatan: catatan || null,
        updated_at: now,
      }
      demoPenyesuaianStokStore[existingIndex] = recordHeader

      // Hapus item lama di demo store
      for (let i = demoPenyesuaianStokItemStore.length - 1; i >= 0; i--) {
        if (demoPenyesuaianStokItemStore[i].penyesuaian_stok_id === id) {
          demoPenyesuaianStokItemStore.splice(i, 1)
        }
      }
    } else {
      recordHeader = {
        id,
        kode: kodeBaru,
        cabang_id,
        tanggal,
        tipe_penyesuaian,
        status,
        catatan: catatan || null,
        created_at: now,
        updated_at: now,
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      }
      demoPenyesuaianStokStore.push(recordHeader)
    }
  } else {
    // CREATE NEW RECORD
    const newId = crypto.randomUUID()
    recordHeader = {
      id: newId,
      kode: kodeBaru,
      cabang_id,
      tanggal,
      tipe_penyesuaian,
      status,
      catatan: catatan || null,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    }
    demoPenyesuaianStokStore.unshift(recordHeader)
  }

  // Populate items
  items.forEach((item, index) => {
    const satuan = item.satuan_produk_id
      ? demoSatuanStore.find((s) => s.id === item.satuan_produk_id && !s.deleted_at)
      : null
    const rasioKeDasar = satuan ? Number(satuan.rasio_ke_dasar) || 1 : 1

    const { selisih, totalNilaiSelisih } = hitungSelisihOpname(
      item.stok_buku,
      item.stok_fisik,
      item.harga_satuan,
      rasioKeDasar
    )
    const itemKode = `${recordHeader.kode}-${String(index + 1).padStart(2, '0')}`
    const itemRecord: PenyesuaianStokItem = {
      id: item.id || crypto.randomUUID(),
      kode: itemKode,
      penyesuaian_stok_id: recordHeader.id,
      produk_id: item.produk_id,
      satuan_produk_id: item.satuan_produk_id || null,
      stok_buku: item.stok_buku,
      stok_fisik: item.stok_fisik,
      selisih,
      harga_satuan: item.harga_satuan,
      total_nilai_penyesuaian: totalNilaiSelisih,
      alasan: item.alasan || null,
      created_at: now,
      updated_at: now,
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    }
    itemsToSave.push(itemRecord)
    demoPenyesuaianStokItemStore.push(itemRecord)
  })

  // Coba persist ke Supabase
  if (supabase) {
    try {
      await withTimeout(
        supabase.from('penyesuaian_stok').upsert({
          id: recordHeader.id,
          kode: recordHeader.kode,
          cabang_id: recordHeader.cabang_id,
          tanggal: recordHeader.tanggal,
          tipe_penyesuaian: recordHeader.tipe_penyesuaian,
          status: recordHeader.status,
          catatan: recordHeader.catatan,
          created_at: recordHeader.created_at,
          updated_at: recordHeader.updated_at,
        })
      )

      // Delete existing items if updating
      if (id) {
        await withTimeout(
          supabase
            .from('penyesuaian_stok_item')
            .delete()
            .eq('penyesuaian_stok_id', recordHeader.id)
        )
      }

      // Insert items
      await withTimeout(
        supabase.from('penyesuaian_stok_item').insert(
          itemsToSave.map((it) => ({
            id: it.id,
            kode: it.kode,
            penyesuaian_stok_id: it.penyesuaian_stok_id,
            produk_id: it.produk_id,
            satuan_produk_id: it.satuan_produk_id,
            stok_buku: it.stok_buku,
            stok_fisik: it.stok_fisik,
            selisih: it.selisih,
            harga_satuan: it.harga_satuan,
            total_nilai_penyesuaian: it.total_nilai_penyesuaian,
            alasan: it.alasan,
            created_at: it.created_at,
            updated_at: it.updated_at,
          }))
        )
      )
    } catch {
      // Supabase offline, demo store already up-to-date
    }
  }

  // Jika status 'selesai', eksekusi mutasi saldo stok dan kartu stok
  if (status === 'selesai') {
    await eksekusiMutasiStok(recordHeader, itemsToSave)
  }

  revalidatePath('/penyesuaian-stok')
  revalidatePath('/kartu-stok')
  revalidatePath('/dashboard')

  return {
    success: true,
    data: recordHeader,
  }
}

/**
 * Server Action untuk memfinalisasi penyesuaian stok yang berstatus draft menjadi selesai.
 */
export async function selesaikanPenyesuaianStokAction(
  id: string
): Promise<ActionResponse<PenyesuaianStok>> {
  let supabase: any = null
  try {
    supabase = await createClient()
  } catch {
    // offline
  }
  const now = new Date().toISOString()

  // Ambil data header & items dari demo store
  let header = demoPenyesuaianStokStore.find((p) => p.id === id && !p.deleted_at)
  let items = demoPenyesuaianStokItemStore.filter(
    (it) => it.penyesuaian_stok_id === id && !it.deleted_at
  )

  // Coba ambil dari Supabase jika demo store kosong
  if (!header && supabase) {
    try {
      const { data: dbHeader } = await withTimeout<any>(
        supabase
          .from('penyesuaian_stok')
          .select('*')
          .eq('id', id)
          .maybeSingle()
      )
      if (dbHeader) header = dbHeader as PenyesuaianStok

      const { data: dbItems } = await withTimeout<any>(
        supabase
          .from('penyesuaian_stok_item')
          .select('*')
          .eq('penyesuaian_stok_id', id)
      )
      if (dbItems) items = dbItems as PenyesuaianStokItem[]
    } catch {
      // offline
    }
  }

  if (!header) {
    return {
      success: false,
      error: 'Data penyesuaian stok tidak ditemukan.',
    }
  }

  if (header.status === 'selesai') {
    return {
      success: false,
      error: 'Penyesuaian stok ini sudah berstatus selesai.',
    }
  }

  if (header.status === 'dibatalkan') {
    return {
      success: false,
      error: 'Penyesuaian stok yang telah dibatalkan tidak dapat diselesaikan.',
    }
  }

  // Update status menjadi selesai
  header.status = 'selesai'
  header.updated_at = now

  if (supabase) {
    try {
      await withTimeout(
        supabase
          .from('penyesuaian_stok')
          .update({ status: 'selesai', updated_at: now })
          .eq('id', id)
      )
    } catch {
      // offline
    }
  }

  // Eksekusi mutasi stok & kartu stok
  await eksekusiMutasiStok(header, items)

  revalidatePath('/penyesuaian-stok')
  revalidatePath('/kartu-stok')
  revalidatePath('/dashboard')

  return {
    success: true,
    data: header,
  }
}

/**
 * Server Action untuk membatalkan penyesuaian stok yang berstatus draft.
 */
export async function batalkanPenyesuaianStokAction(
  id: string
): Promise<ActionResponse<PenyesuaianStok>> {
  let supabase: any = null
  try {
    supabase = await createClient()
  } catch {
    // offline
  }
  const now = new Date().toISOString()

  let header = demoPenyesuaianStokStore.find((p) => p.id === id && !p.deleted_at)

  if (!header && supabase) {
    try {
      const { data: dbHeader } = await withTimeout<any>(
        supabase
          .from('penyesuaian_stok')
          .select('*')
          .eq('id', id)
          .maybeSingle()
      )
      if (dbHeader) header = dbHeader as PenyesuaianStok
    } catch {
      // offline
    }
  }

  if (!header) {
    return {
      success: false,
      error: 'Data penyesuaian stok tidak ditemukan.',
    }
  }

  if (header.status === 'selesai') {
    return {
      success: false,
      error: 'Penyesuaian stok yang sudah selesai tidak dapat dibatalkan.',
    }
  }

  header.status = 'dibatalkan'
  header.updated_at = now

  if (supabase) {
    try {
      await withTimeout(
        supabase
          .from('penyesuaian_stok')
          .update({ status: 'dibatalkan', updated_at: now })
          .eq('id', id)
      )
    } catch {
      // offline
    }
  }

  revalidatePath('/penyesuaian-stok')

  return {
    success: true,
    data: header,
  }
}

/**
 * Server Action untuk memuat data produk persediaan dan stok buku saat ini di cabang tertentu.
 */
export async function muatStokBukuAction(
  cabangId: string
): Promise<ActionResponse<ProdukStokBuku[]>> {
  try {
    const data = await ambilProdukDanStokBuku(cabangId)
    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Gagal memuat stok buku untuk cabang tersebut.',
    }
  }
}

