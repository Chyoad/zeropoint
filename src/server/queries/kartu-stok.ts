import { createClient } from '@/lib/supabase/server'
import type {
  KartuStok,
  JenisMutasiStok,
  SatuanProduk,
  Produk,
  Cabang,
} from '@/lib/validasi/produk'
import {
  demoKartuStokStore,
  demoProdukStore,
  demoSatuanStore,
  withTimeout,
} from '@/server/queries/produk'
import { demoCabangStore } from '@/server/queries/cabang'
import { formatTanggalWaktuIndonesia } from '@/lib/utils'

export { demoKartuStokStore }

export * from '@/lib/kartu-stok-csv'
import {
  normalisasiPresisi,
  type KartuStokItem,
  type KartuStokSummary,
  type BukuBesarKartuStokResult,
  type OpsiFilterKartuStok,
  type AmbilKartuStokParams,
} from '@/lib/kartu-stok-csv'

/**
 * Data demo mutasi transaksi tambahan (Pembelian, Penjualan, Penyesuaian)
 * untuk demonstrasi realistis moving average stock ledger
 */
export const DEMO_MUTASI_TAMBAHAN: KartuStok[] = [
  // 1. Pembelian Indomie di HQ: 2 Karton @ 40 Pcs = 80 Pcs @ Rp 3.000 = Rp 240.000
  {
    id: '80000000-0000-0000-0000-000000000005',
    kode: 'KST-20261013-0005',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000001',
    tanggal: '2026-10-13T08:30:00.000Z',
    jenis_mutasi: 'masuk_pembelian',
    nomor_referensi: 'PO-20261013-0001',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000002', // Karton
    kuantitas_transaksi: 2,
    faktor_konversi: 40,
    kuantitas_masuk: 80,
    kuantitas_keluar: 0,
    sisa_kuantitas: 280,
    harga_satuan: 3000,
    total_nilai_masuk: 240000,
    total_nilai_keluar: 0,
    saldo_nilai: 800000,
    hpp_rata_rata: 2857.14,
    batch_nomor: 'BATCH-IND-01',
    tanggal_kadaluarsa: '2027-10-13',
    kartu_stok_masuk_id: null,
    catatan: 'Penerimaan barang PO-20261013-0001 dari supplier PT Indomarco',
    created_at: '2026-10-13T08:30:00.000Z',
    updated_at: '2026-10-13T08:30:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // 2. Penjualan Indomie di HQ: 1 Karton = 40 Pcs keluar @ HPP
  {
    id: '80000000-0000-0000-0000-000000000006',
    kode: 'KST-20261013-0006',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000001',
    tanggal: '2026-10-13T11:15:00.000Z',
    jenis_mutasi: 'keluar_penjualan',
    nomor_referensi: 'SO-20261013-0001',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000002',
    kuantitas_transaksi: 1,
    faktor_konversi: 40,
    kuantitas_masuk: 0,
    kuantitas_keluar: 40,
    sisa_kuantitas: 240,
    harga_satuan: 2857.14,
    total_nilai_masuk: 0,
    total_nilai_keluar: 114285.71,
    saldo_nilai: 685714.29,
    hpp_rata_rata: 2857.14,
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    catatan: 'Pengiriman pesanan penjualan SO-20261013-0001',
    created_at: '2026-10-13T11:15:00.000Z',
    updated_at: '2026-10-13T11:15:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // 3. Penyesuaian Masuk Indomie di HQ: Stock Opname temuan fisik +10 Pcs
  {
    id: '80000000-0000-0000-0000-000000000007',
    kode: 'KST-20261013-0007',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000001',
    tanggal: '2026-10-13T14:00:00.000Z',
    jenis_mutasi: 'penyesuaian_masuk',
    nomor_referensi: 'ADJ-20261013-0001',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000001', // Pcs
    kuantitas_transaksi: 10,
    faktor_konversi: 1,
    kuantitas_masuk: 10,
    kuantitas_keluar: 0,
    sisa_kuantitas: 250,
    harga_satuan: 2857.14,
    total_nilai_masuk: 28571.43,
    total_nilai_keluar: 0,
    saldo_nilai: 714285.71,
    hpp_rata_rata: 2857.14,
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    catatan: 'Penyesuaian lebih stok opname harian gudang',
    created_at: '2026-10-13T14:00:00.000Z',
    updated_at: '2026-10-13T14:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // 4. Penyesuaian Keluar Indomie di HQ: Rusak/kemasan sobek -5 Pcs
  {
    id: '80000000-0000-0000-0000-000000000008',
    kode: 'KST-20261013-0008',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000001',
    tanggal: '2026-10-13T16:30:00.000Z',
    jenis_mutasi: 'penyesuaian_keluar',
    nomor_referensi: 'ADJ-20261013-0002',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000001', // Pcs
    kuantitas_transaksi: 5,
    faktor_konversi: 1,
    kuantitas_masuk: 0,
    kuantitas_keluar: 5,
    sisa_kuantitas: 245,
    harga_satuan: 2857.14,
    total_nilai_masuk: 0,
    total_nilai_keluar: 14285.71,
    saldo_nilai: 699999.99,
    hpp_rata_rata: 2857.14,
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    catatan: 'Koreksi rusak terkena rembesan air di rak display',
    created_at: '2026-10-13T16:30:00.000Z',
    updated_at: '2026-10-13T16:30:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // 5. Pembelian Mouse Logitech di HQ: 15 Unit @ Rp 47.000 = Rp 705.000
  {
    id: '80000000-0000-0000-0000-000000000009',
    kode: 'KST-20261013-0009',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000002',
    tanggal: '2026-10-13T09:00:00.000Z',
    jenis_mutasi: 'masuk_pembelian',
    nomor_referensi: 'PO-20261013-0002',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000003', // Unit
    kuantitas_transaksi: 15,
    faktor_konversi: 1,
    kuantitas_masuk: 15,
    kuantitas_keluar: 0,
    sisa_kuantitas: 40,
    harga_satuan: 47000,
    total_nilai_masuk: 705000,
    total_nilai_keluar: 0,
    saldo_nilai: 1830000,
    hpp_rata_rata: 45750,
    batch_nomor: 'LOT-LOGI-99',
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    catatan: 'Restock periferal PO-20261013-0002 supplier distributor IT',
    created_at: '2026-10-13T09:00:00.000Z',
    updated_at: '2026-10-13T09:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // 6. Penjualan Mouse Logitech di HQ: 8 Unit @ Rp 45.750 = Rp 366.000
  {
    id: '80000000-0000-0000-0000-000000000010',
    kode: 'KST-20261013-0010',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000002',
    tanggal: '2026-10-13T13:30:00.000Z',
    jenis_mutasi: 'keluar_penjualan',
    nomor_referensi: 'SO-20261013-0002',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000003',
    kuantitas_transaksi: 8,
    faktor_konversi: 1,
    kuantitas_masuk: 0,
    kuantitas_keluar: 8,
    sisa_kuantitas: 32,
    harga_satuan: 45750,
    total_nilai_masuk: 0,
    total_nilai_keluar: 366000,
    saldo_nilai: 1464000,
    hpp_rata_rata: 45750,
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    catatan: 'Penjualan ke klien korporat SO-20261013-0002',
    created_at: '2026-10-13T13:30:00.000Z',
    updated_at: '2026-10-13T13:30:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

/**
 * Menghitung dan memvalidasi running balance Moving Average serta sisa kuantitas untuk mutasi kartu stok
 * Mengelompokkan per kombinasi (produk_id, cabang_id) dan memproses urutan kronologis tanggal & created_at
 */
export function hitungMovingAverageRunningBalance(
  mutasiList: KartuStokItem[]
): KartuStokItem[] {
  // Urutkan kronologis: tanggal ASC, created_at ASC
  const sorted = [...mutasiList].sort((a, b) => {
    const timeA = new Date(a.tanggal).getTime()
    const timeB = new Date(b.tanggal).getTime()
    if (timeA !== timeB) return timeA - timeB
    const createA = new Date(a.created_at).getTime()
    const createB = new Date(b.created_at).getTime()
    return createA - createB
  })

  // State akumulator per (cabang_id, produk_id)
  const streamMap = new Map<
    string,
    { sisaQty: number; saldoNilai: number; hppRataRata: number }
  >()

  return sorted.map((item) => {
    const key = `${item.cabang_id}_${item.produk_id}`
    const state = streamMap.get(key) || {
      sisaQty: 0,
      saldoNilai: 0,
      hppRataRata: 0,
    }

    const qtyMasuk = Number(item.kuantitas_masuk) || 0
    const qtyKeluar = Number(item.kuantitas_keluar) || 0
    let hargaSatuan = Number(item.harga_satuan) || 0
    let totalNilaiMasuk = Number(item.total_nilai_masuk) || 0
    let totalNilaiKeluar = Number(item.total_nilai_keluar) || 0

    let sisaQty = state.sisaQty
    let saldoNilai = state.saldoNilai
    let hppRataRata = state.hppRataRata

    if (qtyMasuk > 0) {
      if (totalNilaiMasuk <= 0 && hargaSatuan > 0) {
        totalNilaiMasuk = normalisasiPresisi(qtyMasuk * hargaSatuan)
      } else if (totalNilaiMasuk > 0 && hargaSatuan <= 0) {
        hargaSatuan = normalisasiPresisi(totalNilaiMasuk / qtyMasuk)
      }
      sisaQty = normalisasiPresisi(sisaQty + qtyMasuk)
      saldoNilai = normalisasiPresisi(saldoNilai + totalNilaiMasuk)
      hppRataRata =
        sisaQty > 0 ? normalisasiPresisi(saldoNilai / sisaQty) : hargaSatuan
    } else if (qtyKeluar > 0) {
      // Pada moving average, barang keluar dinilai berdasarkan HPP rata-rata yang sedang berlaku
      if (hppRataRata > 0) {
        hargaSatuan = hppRataRata
      }
      totalNilaiKeluar = normalisasiPresisi(
        qtyKeluar * (hppRataRata > 0 ? hppRataRata : (hargaSatuan > 0 ? hargaSatuan : 0))
      )
      sisaQty = normalisasiPresisi(sisaQty - qtyKeluar)
      saldoNilai = normalisasiPresisi(
        Math.max(0, saldoNilai - totalNilaiKeluar)
      )
      // hppRataRata tetap tidak berubah saat barang keluar (kecuali jika saldo habis)
      if (sisaQty <= 0) {
        saldoNilai = 0
      }
    }

    // Perbarui state stream
    streamMap.set(key, { sisaQty, saldoNilai, hppRataRata })

    return {
      ...item,
      harga_satuan: hargaSatuan,
      total_nilai_masuk: totalNilaiMasuk,
      total_nilai_keluar: totalNilaiKeluar,
      sisa_kuantitas: sisaQty,
      saldo_nilai: saldoNilai,
      hpp_rata_rata: hppRataRata,
    }
  })
}

/**
 * Menghitung ringkasan KPI buku besar kartu stok
 */
export function hitungRingkasanKartuStok(
  items: KartuStokItem[]
): KartuStokSummary {
  const totalKuantitasMasuk = normalisasiPresisi(
    items.reduce((acc, i) => acc + (Number(i.kuantitas_masuk) || 0), 0)
  )
  const totalKuantitasKeluar = normalisasiPresisi(
    items.reduce((acc, i) => acc + (Number(i.kuantitas_keluar) || 0), 0)
  )
  const totalNilaiMasuk = normalisasiPresisi(
    items.reduce((acc, i) => acc + (Number(i.total_nilai_masuk) || 0), 0)
  )
  const totalNilaiKeluar = normalisasiPresisi(
    items.reduce((acc, i) => acc + (Number(i.total_nilai_keluar) || 0), 0)
  )

  let sisaKuantitasAkhir = 0
  let saldoNilaiAkhir = 0
  let hppRataRataAkhir = 0

  if (items.length > 0) {
    const streamFinal = new Map<
      string,
      { sisaQty: number; saldoNilai: number; hpp: number }
    >()
    for (const item of items) {
      const key = `${item.cabang_id}_${item.produk_id}`
      streamFinal.set(key, {
        sisaQty: item.sisa_kuantitas,
        saldoNilai: item.saldo_nilai,
        hpp: item.hpp_rata_rata,
      })
    }

    if (streamFinal.size === 1) {
      const last = Array.from(streamFinal.values())[0]
      sisaKuantitasAkhir = last.sisaQty
      saldoNilaiAkhir = last.saldoNilai
      hppRataRataAkhir = last.hpp
    } else {
      for (const val of streamFinal.values()) {
        sisaKuantitasAkhir = normalisasiPresisi(sisaKuantitasAkhir + val.sisaQty)
        saldoNilaiAkhir = normalisasiPresisi(saldoNilaiAkhir + val.saldoNilai)
      }
      hppRataRataAkhir =
        sisaKuantitasAkhir > 0
          ? normalisasiPresisi(saldoNilaiAkhir / sisaKuantitasAkhir)
          : 0
    }
  }

  return {
    totalKuantitasMasuk,
    totalKuantitasKeluar,
    sisaKuantitasAkhir,
    totalNilaiMasuk,
    totalNilaiKeluar,
    saldoNilaiAkhir,
    hppRataRataAkhir,
  }
}

/**
 * Memastikan demo store memiliki transaksi demonstrasi lengkap
 */
function dapatkanDaftarKartuStokDemo(): KartuStok[] {
  const existingIds = new Set(demoKartuStokStore.map((k) => k.id))
  for (const mutasi of DEMO_MUTASI_TAMBAHAN) {
    if (!existingIds.has(mutasi.id)) {
      demoKartuStokStore.push(mutasi)
      existingIds.add(mutasi.id)
    }
  }
  return demoKartuStokStore.filter((k) => !k.deleted_at)
}

/**
 * Memperkaya item kartu stok mentah dengan relasi produk, cabang, satuan transaksi, dan satuan dasar
 */
function perkayaItemKartuStok(
  rawItem: any,
  produkMap?: Map<string, Produk>,
  cabangMap?: Map<string, Cabang>,
  satuanMap?: Map<string, SatuanProduk>
): KartuStokItem {
  const produk =
    rawItem.produk ||
    produkMap?.get(rawItem.produk_id) ||
    demoProdukStore.find((p) => p.id === rawItem.produk_id) ||
    null

  const cabang =
    rawItem.cabang ||
    cabangMap?.get(rawItem.cabang_id) ||
    demoCabangStore.find((c) => c.id === rawItem.cabang_id) ||
    null

  const satuan =
    rawItem.satuan ||
    (rawItem.satuan_produk_id
      ? satuanMap?.get(rawItem.satuan_produk_id) ||
        demoSatuanStore.find((s) => s.id === rawItem.satuan_produk_id)
      : null) ||
    null

  const satuanDasar =
    demoSatuanStore.find(
      (s) => s.produk_id === rawItem.produk_id && s.is_satuan_dasar && !s.deleted_at
    ) || null

  return {
    ...rawItem,
    produk: produk
      ? {
          id: produk.id,
          kode: produk.kode,
          nama: produk.nama,
          tipe_produk: produk.tipe_produk,
          metode_valuasi: produk.metode_valuasi,
        }
      : null,
    cabang: cabang
      ? {
          id: cabang.id,
          kode: cabang.kode,
          nama: cabang.nama,
        }
      : null,
    satuan: satuan
      ? {
          id: satuan.id,
          kode: satuan.kode,
          nama_satuan: satuan.nama_satuan,
          rasio_ke_dasar: Number(satuan.rasio_ke_dasar) || 1,
          is_satuan_dasar: Boolean(satuan.is_satuan_dasar),
        }
      : null,
    satuan_dasar: satuanDasar
      ? {
          id: satuanDasar.id,
          kode: satuanDasar.kode,
          nama_satuan: satuanDasar.nama_satuan,
        }
      : null,
  }
}

/**
 * Mengambil buku besar kartu stok / stock ledger dengan running balance moving average
 */
export async function ambilBukuBesarKartuStok(
  params?: AmbilKartuStokParams
): Promise<BukuBesarKartuStokResult> {
  const cabangId =
    params?.cabang_id && params.cabang_id !== 'all' ? params.cabang_id : undefined
  const produkId =
    params?.produk_id && params.produk_id !== 'all' ? params.produk_id : undefined
  const jenisMutasi =
    params?.jenis_mutasi && params.jenis_mutasi !== 'all'
      ? params.jenis_mutasi
      : undefined
  const tanggalMulai = params?.tanggal_mulai || undefined
  const tanggalSelesai = params?.tanggal_selesai || undefined

  try {
    const supabase = await createClient()

    let query = supabase
      .from('kartu_stok')
      .select(
        `
        *,
        produk:produk(id, kode, nama, tipe_produk, metode_valuasi),
        cabang:cabang(id, kode, nama),
        satuan:satuan_produk(id, kode, nama_satuan, rasio_ke_dasar, is_satuan_dasar)
      `
      )
      .is('deleted_at', null)

    if (cabangId) {
      query = query.eq('cabang_id', cabangId)
    }
    if (produkId) {
      query = query.eq('produk_id', produkId)
    }
    if (jenisMutasi) {
      query = query.eq('jenis_mutasi', jenisMutasi as JenisMutasiStok)
    }
    if (tanggalMulai) {
      query = query.gte('tanggal', tanggalMulai)
    }
    if (tanggalSelesai) {
      query = query.lte('tanggal', `${tanggalSelesai}T23:59:59.999Z`)
    }

    query = query
      .order('tanggal', { ascending: true })
      .order('created_at', { ascending: true })

    const { data, error } = await withTimeout(query)

    if (error || !data || data.length === 0) {
      return ambilBukuBesarDariDemoStore(params)
    }

    // Perkaya data dengan satuan dasar
    const enrichedItems: KartuStokItem[] = (data as any[]).map((raw) =>
      perkayaItemKartuStok(raw)
    )

    const hasTruncatedFilter = Boolean(tanggalMulai || jenisMutasi)
    const hasStoredSnapshots = enrichedItems.some(
      (r) =>
        r.sisa_kuantitas !== undefined &&
        r.sisa_kuantitas !== null &&
        Number(r.sisa_kuantitas) !== 0
    )

    let finalItems: KartuStokItem[]
    if (hasTruncatedFilter && hasStoredSnapshots) {
      // Saat filter tanggal mulai atau jenis mutasi aktif, pertahankan running balance snapshot
      // yang tersimpan di baris database kartu_stok agar tidak dihitung ulang dari 0.
      finalItems = enrichedItems.map((item) => ({
        ...item,
        sisa_kuantitas: Number(item.sisa_kuantitas) || 0,
        saldo_nilai: Number(item.saldo_nilai) || 0,
        hpp_rata_rata: Number(item.hpp_rata_rata) || 0,
        total_nilai_masuk: Number(item.total_nilai_masuk) || 0,
        total_nilai_keluar: Number(item.total_nilai_keluar) || 0,
      }))
    } else {
      // Hitung running balance moving average secara deterministik dari urutan kronologis
      finalItems = hitungMovingAverageRunningBalance(enrichedItems)
    }

    const ringkasan = hitungRingkasanKartuStok(finalItems)

    return {
      data: finalItems,
      ringkasan,
    }
  } catch {
    return ambilBukuBesarDariDemoStore(params)
  }
}

/**
 * Fallback in-memory demo store untuk stock ledger
 */
function ambilBukuBesarDariDemoStore(
  params?: AmbilKartuStokParams
): BukuBesarKartuStokResult {
  const cabangId =
    params?.cabang_id && params.cabang_id !== 'all' ? params.cabang_id : undefined
  const produkId =
    params?.produk_id && params.produk_id !== 'all' ? params.produk_id : undefined
  const jenisMutasi =
    params?.jenis_mutasi && params.jenis_mutasi !== 'all'
      ? params.jenis_mutasi
      : undefined
  const tanggalMulai = params?.tanggal_mulai || undefined
  const tanggalSelesai = params?.tanggal_selesai || undefined

  const rawList = dapatkanDaftarKartuStokDemo()

  const produkMap = new Map(demoProdukStore.map((p) => [p.id, p]))
  const cabangMap = new Map(demoCabangStore.map((c) => [c.id, c]))
  const satuanMap = new Map(demoSatuanStore.map((s) => [s.id, s]))

  // Perkaya seluruh data
  const enrichedAll = rawList.map((raw) =>
    perkayaItemKartuStok(raw, produkMap, cabangMap, satuanMap)
  )

  // Hitung running balance secara keseluruhan per stream
  const computedAll = hitungMovingAverageRunningBalance(enrichedAll)

  // Filter sesuai kriteria query
  const filtered = computedAll.filter((item) => {
    if (cabangId && item.cabang_id !== cabangId) return false
    if (produkId && item.produk_id !== produkId) return false
    if (jenisMutasi && item.jenis_mutasi !== jenisMutasi) return false

    if (tanggalMulai) {
      const itemDate = item.tanggal.slice(0, 10)
      if (itemDate < tanggalMulai) return false
    }
    if (tanggalSelesai) {
      const itemDate = item.tanggal.slice(0, 10)
      if (itemDate > tanggalSelesai) return false
    }

    return true
  })

  const ringkasan = hitungRingkasanKartuStok(filtered)

  return {
    data: filtered,
    ringkasan,
  }
}

/**
 * Mengambil opsi filter buku besar kartu stok (daftar cabang aktif & produk aktif)
 */
export async function ambilOpsiFilterKartuStok(): Promise<OpsiFilterKartuStok> {
  try {
    const supabase = await createClient()

    const [cabangRes, produkRes] = await Promise.all([
      withTimeout(
        supabase
          .from('cabang')
          .select('id, kode, nama')
          .eq('is_aktif', true)
          .is('deleted_at', null)
          .order('nama', { ascending: true })
      ),
      withTimeout(
        supabase
          .from('produk')
          .select('id, kode, nama, tipe_produk')
          .eq('is_aktif', true)
          .is('deleted_at', null)
          .order('nama', { ascending: true })
      ),
    ])

    const cabangData =
      !cabangRes.error && cabangRes.data && cabangRes.data.length > 0
        ? cabangRes.data
        : demoCabangStore
            .filter((c) => c.is_aktif && !c.deleted_at)
            .map((c) => ({ id: c.id, kode: c.kode, nama: c.nama }))

    const produkData =
      !produkRes.error && produkRes.data && produkRes.data.length > 0
        ? produkRes.data
        : demoProdukStore
            .filter((p) => p.is_aktif && !p.deleted_at)
            .map((p) => ({
              id: p.id,
              kode: p.kode,
              nama: p.nama,
              tipe_produk: p.tipe_produk,
            }))

    return {
      daftarCabang: cabangData,
      daftarProduk: produkData,
    }
  } catch {
    return {
      daftarCabang: demoCabangStore
        .filter((c) => c.is_aktif && !c.deleted_at)
        .map((c) => ({ id: c.id, kode: c.kode, nama: c.nama })),
      daftarProduk: demoProdukStore
        .filter((p) => p.is_aktif && !p.deleted_at)
        .map((p) => ({
          id: p.id,
          kode: p.kode,
          nama: p.nama,
          tipe_produk: p.tipe_produk,
        })),
    }
  }
}
