import { createClient } from '@/lib/supabase/server'
import type {
  PenyesuaianStok,
  PenyesuaianStokItem,
  TipePenyesuaianStok,
  StatusPenyesuaianStok,
} from '@/lib/validasi/penyesuaian-stok'
import type { Cabang } from '@/lib/validasi/cabang'
import type { Produk, SatuanProduk } from '@/lib/validasi/produk'
import {
  demoProdukStore,
  demoSatuanStore,
  demoStokStore,
  withTimeout,
} from '@/server/queries/produk'
import { demoCabangStore } from '@/server/queries/cabang'

export interface PenyesuaianStokItemDetail extends PenyesuaianStokItem {
  produk?: Produk | null
  satuan_produk?: SatuanProduk | null
}

export interface PenyesuaianStokWithRelations extends PenyesuaianStok {
  cabang?: Cabang | null
  items_count?: number
  total_selisih_fisik?: number
  total_nilai_selisih?: number
}

export interface PenyesuaianStokDetail extends PenyesuaianStok {
  cabang?: Cabang | null
  items: PenyesuaianStokItemDetail[]
  total_selisih_fisik?: number
  total_nilai_selisih?: number
}

export interface PenyesuaianStokFilter {
  cabang_id?: string
  status?: string
  tipe_penyesuaian?: string
  tanggal_mulai?: string
  tanggal_selesai?: string
  pencarian?: string
}

export interface ProdukStokBuku {
  produk_id: string
  kode_produk: string
  nama_produk: string
  satuan_produk_id: string | null
  nama_satuan: string
  stok_buku: number
  harga_satuan: number
}

// ==========================================
// INITIAL DEMO DATA
// ==========================================

export const INITIAL_DEMO_PENYESUAIAN_STOK: PenyesuaianStok[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    kode: 'ADJ-20261013-0001',
    cabang_id: '10000000-0000-0000-0000-000000000001', // HQ Jakarta
    tanggal: '2026-10-13T09:00:00.000Z',
    tipe_penyesuaian: 'opname',
    status: 'selesai',
    catatan: 'Stock opname kuartal IV rak A dan display utama',
    created_at: '2026-10-13T09:00:00.000Z',
    updated_at: '2026-10-13T09:15:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '90000000-0000-0000-0000-000000000002',
    kode: 'ADJ-20261013-0002',
    cabang_id: '10000000-0000-0000-0000-000000000003', // Gudang Cikarang
    tanggal: '2026-10-13T14:30:00.000Z',
    tipe_penyesuaian: 'opname',
    status: 'draft',
    catatan: 'Pemeriksaan fisik pallet transit logistik',
    created_at: '2026-10-13T14:30:00.000Z',
    updated_at: '2026-10-13T14:30:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '90000000-0000-0000-0000-000000000003',
    kode: 'ADJ-20261012-0001',
    cabang_id: '10000000-0000-0000-0000-000000000002', // Surabaya
    tanggal: '2026-10-12T11:00:00.000Z',
    tipe_penyesuaian: 'koreksi',
    status: 'dibatalkan',
    catatan: 'Dibatalkan karena salah pilih gudang tujuan',
    created_at: '2026-10-12T11:00:00.000Z',
    updated_at: '2026-10-12T11:05:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

export const INITIAL_DEMO_PENYESUAIAN_STOK_ITEM: PenyesuaianStokItem[] = [
  {
    id: '91000000-0000-0000-0000-000000000001',
    kode: 'ADJ-20261013-0001-01',
    penyesuaian_stok_id: '90000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000001', // Indomie
    satuan_produk_id: '50000000-0000-0000-0000-000000000001', // Pcs
    stok_buku: 200,
    stok_fisik: 205,
    selisih: 5,
    harga_satuan: 2800,
    total_nilai_penyesuaian: 14000,
    alasan: 'Kelebihan fisik 5 pcs saat sortir dus baru',
    created_at: '2026-10-13T09:00:00.000Z',
    updated_at: '2026-10-13T09:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '91000000-0000-0000-0000-000000000002',
    kode: 'ADJ-20261013-0001-02',
    penyesuaian_stok_id: '90000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000002', // Mouse
    satuan_produk_id: '50000000-0000-0000-0000-000000000003', // Unit
    stok_buku: 25,
    stok_fisik: 24,
    selisih: -1,
    harga_satuan: 45000,
    total_nilai_penyesuaian: -45000,
    alasan: '1 unit display retak housing',
    created_at: '2026-10-13T09:00:00.000Z',
    updated_at: '2026-10-13T09:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '91000000-0000-0000-0000-000000000003',
    kode: 'ADJ-20261013-0002-01',
    penyesuaian_stok_id: '90000000-0000-0000-0000-000000000002',
    produk_id: '40000000-0000-0000-0000-000000000001', // Indomie
    satuan_produk_id: '50000000-0000-0000-0000-000000000001', // Pcs
    stok_buku: 400,
    stok_fisik: 395,
    selisih: -5,
    harga_satuan: 2750,
    total_nilai_penyesuaian: -13750,
    alasan: 'Dus lembab dan kemasan rusak',
    created_at: '2026-10-13T14:30:00.000Z',
    updated_at: '2026-10-13T14:30:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '91000000-0000-0000-0000-000000000004',
    kode: 'ADJ-20261012-0001-01',
    penyesuaian_stok_id: '90000000-0000-0000-0000-000000000003',
    produk_id: '40000000-0000-0000-0000-000000000002', // Mouse
    satuan_produk_id: '50000000-0000-0000-0000-000000000003', // Unit
    stok_buku: 10,
    stok_fisik: 10,
    selisih: 0,
    harga_satuan: 46000,
    total_nilai_penyesuaian: 0,
    alasan: 'Pemeriksaan rutin stock display',
    created_at: '2026-10-12T11:00:00.000Z',
    updated_at: '2026-10-12T11:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

export let demoPenyesuaianStokStore: PenyesuaianStok[] =
  INITIAL_DEMO_PENYESUAIAN_STOK.map((p) => ({ ...p }))
export let demoPenyesuaianStokItemStore: PenyesuaianStokItem[] =
  INITIAL_DEMO_PENYESUAIAN_STOK_ITEM.map((it) => ({ ...it }))

export function resetDemoPenyesuaianStok() {
  demoPenyesuaianStokStore = INITIAL_DEMO_PENYESUAIAN_STOK.map((p) => ({ ...p }))
  demoPenyesuaianStokItemStore = INITIAL_DEMO_PENYESUAIAN_STOK_ITEM.map((it) => ({
    ...it,
  }))
}

// ==========================================
// QUERIES
// ==========================================

/**
 * Mengambil daftar riwayat penyesuaian stok dengan join data cabang dan kalkulasi agregat item.
 */
export async function ambilDaftarPenyesuaianStok(
  filter: PenyesuaianStokFilter = {}
): Promise<PenyesuaianStokWithRelations[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('penyesuaian_stok')
      .select('*, cabang(*), items:penyesuaian_stok_item(*)')
      .is('deleted_at', null)
      .order('tanggal', { ascending: false })

    if (filter.cabang_id && filter.cabang_id !== 'all') {
      query = query.eq('cabang_id', filter.cabang_id)
    }
    if (filter.status && filter.status !== 'all') {
      query = query.eq('status', filter.status as StatusPenyesuaianStok)
    }
    if (filter.tipe_penyesuaian && filter.tipe_penyesuaian !== 'all') {
      query = query.eq(
        'tipe_penyesuaian',
        filter.tipe_penyesuaian as TipePenyesuaianStok
      )
    }
    if (filter.tanggal_mulai) {
      query = query.gte('tanggal', filter.tanggal_mulai)
    }
    if (filter.tanggal_selesai) {
      query = query.lte('tanggal', filter.tanggal_selesai)
    }
    if (filter.pencarian) {
      const q = `%${filter.pencarian}%`
      query = query.or(`kode.ilike.${q},catatan.ilike.${q}`)
    }

    const { data, error } = await withTimeout(query)

    if (error || !data) {
      throw error || new Error('Gagal mengambil data dari Supabase')
    }

    return (data as Array<any>).map((row) => {
      const itemsList = row.items || []
      const itemsCount = itemsList.length
      const totalSelisihFisik = itemsList.reduce(
        (acc: number, item: any) => acc + (Number(item.selisih) || 0),
        0
      )
      const totalNilaiSelisih = itemsList.reduce(
        (acc: number, item: any) =>
          acc + (Number(item.total_nilai_penyesuaian) || 0),
        0
      )

      return {
        ...row,
        items_count: itemsCount,
        total_selisih_fisik: parseFloat(totalSelisihFisik.toPrecision(12)),
        total_nilai_selisih: parseFloat(totalNilaiSelisih.toPrecision(12)),
      }
    })
  } catch {
    // Fallback in-memory
    let hasil = demoPenyesuaianStokStore.filter((p) => !p.deleted_at)

    if (filter.cabang_id && filter.cabang_id !== 'all') {
      hasil = hasil.filter((p) => p.cabang_id === filter.cabang_id)
    }
    if (filter.status && filter.status !== 'all') {
      hasil = hasil.filter((p) => p.status === filter.status)
    }
    if (filter.tipe_penyesuaian && filter.tipe_penyesuaian !== 'all') {
      hasil = hasil.filter(
        (p) => p.tipe_penyesuaian === filter.tipe_penyesuaian
      )
    }
    if (filter.tanggal_mulai) {
      hasil = hasil.filter((p) => p.tanggal >= filter.tanggal_mulai!)
    }
    if (filter.tanggal_selesai) {
      hasil = hasil.filter((p) => p.tanggal <= filter.tanggal_selesai!)
    }
    if (filter.pencarian) {
      const searchLower = filter.pencarian.toLowerCase()
      hasil = hasil.filter(
        (p) =>
          p.kode.toLowerCase().includes(searchLower) ||
          (p.catatan && p.catatan.toLowerCase().includes(searchLower))
      )
    }

    // Sort descending by tanggal
    hasil.sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    )

    return hasil.map((h) => {
      const cabang = demoCabangStore.find((c) => c.id === h.cabang_id) || null
      const items = demoPenyesuaianStokItemStore.filter(
        (it) => it.penyesuaian_stok_id === h.id && !it.deleted_at
      )
      const totalSelisihFisik = items.reduce((acc, it) => acc + it.selisih, 0)
      const totalNilaiSelisih = items.reduce(
        (acc, it) => acc + it.total_nilai_penyesuaian,
        0
      )

      return {
        ...h,
        cabang,
        items_count: items.length,
        total_selisih_fisik: parseFloat(totalSelisihFisik.toPrecision(12)),
        total_nilai_selisih: parseFloat(totalNilaiSelisih.toPrecision(12)),
      }
    })
  }
}

/**
 * Mengambil detail satu penyesuaian stok beserta relasi cabang, item, dan produk.
 */
export async function ambilDetailPenyesuaianStok(
  id: string
): Promise<PenyesuaianStokDetail | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await withTimeout(
      supabase
        .from('penyesuaian_stok')
        .select(
          `
          *,
          cabang(*),
          items:penyesuaian_stok_item(
            *,
            produk(*),
            satuan_produk(*)
          )
        `
        )
        .eq('id', id)
        .maybeSingle()
    )

    if (error || !data) {
      throw error || new Error('Data tidak ditemukan')
    }

    const items = (data.items || []) as any[]
    const totalSelisihFisik = items.reduce(
      (acc, it) => acc + (Number(it.selisih) || 0),
      0
    )
    const totalNilaiSelisih = items.reduce(
      (acc, it) => acc + (Number(it.total_nilai_penyesuaian) || 0),
      0
    )

    return {
      ...(data as any),
      items,
      total_selisih_fisik: parseFloat(totalSelisihFisik.toPrecision(12)),
      total_nilai_selisih: parseFloat(totalNilaiSelisih.toPrecision(12)),
    }
  } catch {
    // In-memory fallback
    const header = demoPenyesuaianStokStore.find(
      (p) => (p.id === id || p.kode === id) && !p.deleted_at
    )
    if (!header) return null

    const cabang =
      demoCabangStore.find((c) => c.id === header.cabang_id) || null
    const rawItems = demoPenyesuaianStokItemStore.filter(
      (it) => it.penyesuaian_stok_id === header.id && !it.deleted_at
    )

    const items: PenyesuaianStokItemDetail[] = rawItems.map((it) => {
      const produk = demoProdukStore.find((p) => p.id === it.produk_id) || null
      const satuan = it.satuan_produk_id
        ? demoSatuanStore.find((s) => s.id === it.satuan_produk_id) || null
        : null
      return {
        ...it,
        produk,
        satuan_produk: satuan,
      }
    })

    const totalSelisihFisik = items.reduce((acc, it) => acc + it.selisih, 0)
    const totalNilaiSelisih = items.reduce(
      (acc, it) => acc + it.total_nilai_penyesuaian,
      0
    )

    return {
      ...header,
      cabang,
      items,
      total_selisih_fisik: parseFloat(totalSelisihFisik.toPrecision(12)),
      total_nilai_selisih: parseFloat(totalNilaiSelisih.toPrecision(12)),
    }
  }
}

/**
 * Mengambil daftar produk persediaan aktif beserta posisi stok buku saat ini di cabang terkait.
 * Digunakan untuk mengisi baris opname secara otomatis di form penyesuaian stok.
 */
export async function ambilProdukDanStokBuku(
  cabangId: string
): Promise<ProdukStokBuku[]> {
  try {
    const supabase = await createClient()

    // 1. Ambil produk persediaan aktif
    const { data: produkList, error: pErr } = await withTimeout(
      supabase
        .from('produk')
        .select('*, satuan_produk(*)')
        .eq('tipe_produk', 'persediaan')
        .eq('is_aktif', true)
        .is('deleted_at', null)
        .order('nama', { ascending: true })
    )

    if (pErr || !produkList) throw pErr

    // 2. Ambil stok saat ini di cabang tersebut
    const { data: stokList } = await withTimeout(
      supabase
        .from('stok_produk')
        .select('*')
        .eq('cabang_id', cabangId)
        .is('deleted_at', null)
    )

    const stokMap = new Map<string, { kuantitas: number; hpp_rata_rata: number }>()
    if (stokList) {
      for (const st of stokList) {
        stokMap.set(st.produk_id, {
          kuantitas: Number(st.kuantitas) || 0,
          hpp_rata_rata: Number(st.hpp_rata_rata) || 0,
        })
      }
    }

    return (produkList as any[]).map((prod) => {
      const stokInfo = stokMap.get(prod.id)
      const baseSatuan = Array.isArray(prod.satuan_produk)
        ? prod.satuan_produk.find((s: any) => s.is_satuan_dasar)
        : null

      const hargaSatuan =
        stokInfo?.hpp_rata_rata ||
        Number(prod.harga_pokok_standar) ||
        Number(prod.harga_beli_terakhir) ||
        0

      return {
        produk_id: prod.id,
        kode_produk: prod.kode,
        nama_produk: prod.nama,
        satuan_produk_id: baseSatuan ? baseSatuan.id : null,
        nama_satuan: baseSatuan ? baseSatuan.nama_satuan : 'Pcs',
        stok_buku: stokInfo?.kuantitas ?? 0,
        harga_satuan: hargaSatuan,
      }
    })
  } catch {
    // In-memory fallback
    const persediaanProduk = demoProdukStore.filter(
      (p) => p.tipe_produk === 'persediaan' && p.is_aktif !== false && !p.deleted_at
    )

    return persediaanProduk.map((prod) => {
      const stok = demoStokStore.find(
        (s) => s.cabang_id === cabangId && s.produk_id === prod.id && !s.deleted_at
      )
      const baseSatuan = demoSatuanStore.find(
        (s) => s.produk_id === prod.id && s.is_satuan_dasar && !s.deleted_at
      )

      const hargaSatuan =
        stok?.hpp_rata_rata ||
        prod.harga_pokok_standar ||
        prod.harga_beli_terakhir ||
        0

      return {
        produk_id: prod.id,
        kode_produk: prod.kode,
        nama_produk: prod.nama,
        satuan_produk_id: baseSatuan ? baseSatuan.id : null,
        nama_satuan: baseSatuan ? baseSatuan.nama_satuan : 'Pcs',
        stok_buku: stok ? stok.kuantitas : 0,
        harga_satuan: hargaSatuan,
      }
    })
  }
}
