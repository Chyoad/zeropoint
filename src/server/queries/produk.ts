import { createClient } from '@/lib/supabase/server'
import type {
  Produk,
  SatuanProduk,
  KomponenPaket,
  StokProduk,
  KartuStok,
  KategoriProduk,
  Cabang,
  ProdukWithRelations,
  TipeProduk,
  MetodeValuasi,
} from '@/lib/validasi/produk'
import { demoCabangStore } from '@/server/queries/cabang'

export interface ProdukFilter {
  pencarian?: string
  tipe_produk?: TipeProduk
  kategori_produk_id?: string
  is_aktif?: boolean
  cabang_id?: string
}

// 1. Initial Demo Categories
export const INITIAL_DEMO_KATEGORI: KategoriProduk[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    kode: 'KAT-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Makanan & Minuman',
    keterangan: 'Kebutuhan pokok dan makanan cepat saji persediaan',
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    kode: 'KAT-0002',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Elektronik & Perangkat Komputer',
    keterangan: 'Periferal IT dan aksesoris kantor',
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    kode: 'KAT-0003',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Layanan & Servis IT',
    keterangan: 'Jasa instalasi, perbaikan, dan pemeliharaan teknis',
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    kode: 'KAT-0004',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    nama: 'Paket Bundling Solusi',
    keterangan: 'Paket gabungan hardware dan layanan setup',
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// 2. Initial Demo Products
export const INITIAL_DEMO_PRODUK: Produk[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    kode: 'PRD-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    kategori_produk_id: '30000000-0000-0000-0000-000000000001',
    nama: 'Indomie Soto Mie 70g Spesial',
    tipe_produk: 'persediaan',
    metode_valuasi: 'rata_rata',
    harga_pokok_standar: 2800,
    harga_beli_terakhir: 2800,
    peringatan_stok_minimum: 50,
    dapat_dijual: true,
    dapat_dibeli: true,
    gambar_url: null,
    deskripsi:
      'Mie instan kuah rasa soto dengan multi-satuan Pcs dan Karton (isi 40 Pcs)',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    kode: 'PRD-0002',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    kategori_produk_id: '30000000-0000-0000-0000-000000000002',
    nama: 'Mouse Logitech B100 Optical USB',
    tipe_produk: 'persediaan',
    metode_valuasi: 'fifo',
    harga_pokok_standar: 45000,
    harga_beli_terakhir: 45000,
    peringatan_stok_minimum: 10,
    dapat_dijual: true,
    dapat_dibeli: true,
    gambar_url: null,
    deskripsi:
      'Mouse kabel USB optical standar kantor dengan metode valuasi FIFO',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    kode: 'PRD-0003',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    kategori_produk_id: '30000000-0000-0000-0000-000000000003',
    nama: 'Jasa Instalasi & Setup Workstation',
    tipe_produk: 'jasa',
    metode_valuasi: 'rata_rata',
    harga_pokok_standar: 0,
    harga_beli_terakhir: 0,
    peringatan_stok_minimum: 0,
    dapat_dijual: true,
    dapat_dibeli: false,
    gambar_url: null,
    deskripsi:
      'Layanan perakitan, konfigurasi OS, instalasi software dan jaringan per workstation',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    kode: 'PRD-0004',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    kategori_produk_id: '30000000-0000-0000-0000-000000000004',
    nama: 'Paket Workstation Hemat',
    tipe_produk: 'paket',
    metode_valuasi: 'rata_rata',
    harga_pokok_standar: 0,
    harga_beli_terakhir: 0,
    peringatan_stok_minimum: 0,
    dapat_dijual: true,
    dapat_dibeli: false,
    gambar_url: null,
    deskripsi:
      'Paket bundling hemat berisi 1x Mouse Logitech + 1x Jasa Instalasi Workstation',
    is_aktif: true,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// 3. Initial Demo Units
export const INITIAL_DEMO_SATUAN: SatuanProduk[] = [
  // Indomie (PRD-0001): Pcs (Dasar rasio 1) & Karton (rasio 40)
  {
    id: '50000000-0000-0000-0000-000000000001',
    kode: 'SAT-0001',
    produk_id: '40000000-0000-0000-0000-000000000001',
    nama_satuan: 'Pcs',
    rasio_ke_dasar: 1,
    is_satuan_dasar: true,
    barcode: '8998866200111',
    harga_jual_default: 3500,
    harga_jual_grosir: 3300,
    harga_jual_member: 3200,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    kode: 'SAT-0002',
    produk_id: '40000000-0000-0000-0000-000000000001',
    nama_satuan: 'Karton',
    rasio_ke_dasar: 40,
    is_satuan_dasar: false,
    barcode: '8998866200128',
    harga_jual_default: 135000,
    harga_jual_grosir: 130000,
    harga_jual_member: 128000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // Mouse (PRD-0002): Unit (Dasar rasio 1)
  {
    id: '50000000-0000-0000-0000-000000000003',
    kode: 'SAT-0003',
    produk_id: '40000000-0000-0000-0000-000000000002',
    nama_satuan: 'Unit',
    rasio_ke_dasar: 1,
    is_satuan_dasar: true,
    barcode: '097855065431',
    harga_jual_default: 65000,
    harga_jual_grosir: 60000,
    harga_jual_member: 58000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // Jasa (PRD-0003): Layanan (Dasar rasio 1)
  {
    id: '50000000-0000-0000-0000-000000000004',
    kode: 'SAT-0004',
    produk_id: '40000000-0000-0000-0000-000000000003',
    nama_satuan: 'Layanan',
    rasio_ke_dasar: 1,
    is_satuan_dasar: true,
    barcode: 'SRV-0001',
    harga_jual_default: 150000,
    harga_jual_grosir: 150000,
    harga_jual_member: 135000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  // Paket (PRD-0004): Paket (Dasar rasio 1)
  {
    id: '50000000-0000-0000-0000-000000000005',
    kode: 'SAT-0005',
    produk_id: '40000000-0000-0000-0000-000000000004',
    nama_satuan: 'Paket',
    rasio_ke_dasar: 1,
    is_satuan_dasar: true,
    barcode: 'BDL-0001',
    harga_jual_default: 200000,
    harga_jual_grosir: 190000,
    harga_jual_member: 185000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// 4. Initial Demo Bundle Components
export const INITIAL_DEMO_KOMPONEN: KomponenPaket[] = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    kode: 'KPK-0001',
    paket_id: '40000000-0000-0000-0000-000000000004',
    produk_komponen_id: '40000000-0000-0000-0000-000000000002', // Mouse
    satuan_produk_id: '50000000-0000-0000-0000-000000000003',
    kuantitas: 1,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '60000000-0000-0000-0000-000000000002',
    kode: 'KPK-0002',
    paket_id: '40000000-0000-0000-0000-000000000004',
    produk_komponen_id: '40000000-0000-0000-0000-000000000003', // Jasa
    satuan_produk_id: '50000000-0000-0000-0000-000000000004',
    kuantitas: 1,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// 5. Initial Demo Stocks (in base unit)
export const INITIAL_DEMO_STOK: StokProduk[] = [
  {
    id: '70000000-0000-0000-0000-000000000001',
    kode: 'STK-0001',
    produk_id: '40000000-0000-0000-0000-000000000001', // Indomie
    cabang_id: '10000000-0000-0000-0000-000000000001', // HQ
    kuantitas: 200,
    kuantitas_tersedia: 200,
    kuantitas_tertahan: 0,
    hpp_rata_rata: 2800,
    total_nilai: 560000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000002',
    kode: 'STK-0002',
    produk_id: '40000000-0000-0000-0000-000000000001', // Indomie
    cabang_id: '10000000-0000-0000-0000-000000000003', // Cikarang
    kuantitas: 400,
    kuantitas_tersedia: 400,
    kuantitas_tertahan: 0,
    hpp_rata_rata: 2750,
    total_nilai: 1100000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000003',
    kode: 'STK-0003',
    produk_id: '40000000-0000-0000-0000-000000000002', // Mouse
    cabang_id: '10000000-0000-0000-0000-000000000001', // HQ
    kuantitas: 25,
    kuantitas_tersedia: 25,
    kuantitas_tertahan: 0,
    hpp_rata_rata: 45000,
    total_nilai: 1125000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '70000000-0000-0000-0000-000000000004',
    kode: 'STK-0004',
    produk_id: '40000000-0000-0000-0000-000000000002', // Mouse
    cabang_id: '10000000-0000-0000-0000-000000000002', // Surabaya
    kuantitas: 10,
    kuantitas_tersedia: 10,
    kuantitas_tertahan: 0,
    hpp_rata_rata: 46000,
    total_nilai: 460000,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// 6. Initial Demo Kartu Stok
export const INITIAL_DEMO_KARTU_STOK: KartuStok[] = [
  {
    id: '80000000-0000-0000-0000-000000000001',
    kode: 'KST-20261013-0001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000001',
    tanggal: '2026-10-13T00:00:00.000Z',
    jenis_mutasi: 'saldo_awal',
    nomor_referensi: 'SA-20261013-001',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000002', // Karton
    kuantitas_transaksi: 5,
    faktor_konversi: 40,
    kuantitas_masuk: 200,
    kuantitas_keluar: 0,
    sisa_kuantitas: 200,
    harga_satuan: 2800,
    total_nilai_masuk: 560000,
    total_nilai_keluar: 0,
    saldo_nilai: 560000,
    hpp_rata_rata: 2800,
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    catatan: 'Saldo awal setup modul master produk Indomie Soto di HQ',
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '80000000-0000-0000-0000-000000000002',
    kode: 'KST-20261013-0002',
    cabang_id: '10000000-0000-0000-0000-000000000003',
    produk_id: '40000000-0000-0000-0000-000000000001',
    tanggal: '2026-10-13T00:00:00.000Z',
    jenis_mutasi: 'saldo_awal',
    nomor_referensi: 'SA-20261013-002',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000002',
    kuantitas_transaksi: 10,
    faktor_konversi: 40,
    kuantitas_masuk: 400,
    kuantitas_keluar: 0,
    sisa_kuantitas: 400,
    harga_satuan: 2750,
    total_nilai_masuk: 1100000,
    total_nilai_keluar: 0,
    saldo_nilai: 1100000,
    hpp_rata_rata: 2750,
    catatan: 'Saldo awal Indomie Soto di Gudang Cikarang',
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '80000000-0000-0000-0000-000000000003',
    kode: 'KST-20261013-0003',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    produk_id: '40000000-0000-0000-0000-000000000002',
    tanggal: '2026-10-13T00:00:00.000Z',
    jenis_mutasi: 'saldo_awal',
    nomor_referensi: 'SA-20261013-003',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000003',
    kuantitas_transaksi: 25,
    faktor_konversi: 1,
    kuantitas_masuk: 25,
    kuantitas_keluar: 0,
    sisa_kuantitas: 25,
    harga_satuan: 45000,
    total_nilai_masuk: 1125000,
    total_nilai_keluar: 0,
    saldo_nilai: 1125000,
    hpp_rata_rata: 45000,
    catatan: 'Saldo awal Mouse Logitech di HQ',
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
  {
    id: '80000000-0000-0000-0000-000000000004',
    kode: 'KST-20261013-0004',
    cabang_id: '10000000-0000-0000-0000-000000000002',
    produk_id: '40000000-0000-0000-0000-000000000002',
    tanggal: '2026-10-13T00:00:00.000Z',
    jenis_mutasi: 'saldo_awal',
    nomor_referensi: 'SA-20261013-004',
    referensi_id: null,
    satuan_produk_id: '50000000-0000-0000-0000-000000000003',
    kuantitas_transaksi: 10,
    faktor_konversi: 1,
    kuantitas_masuk: 10,
    kuantitas_keluar: 0,
    sisa_kuantitas: 10,
    harga_satuan: 46000,
    total_nilai_masuk: 460000,
    total_nilai_keluar: 0,
    saldo_nilai: 460000,
    hpp_rata_rata: 46000,
    catatan: 'Saldo awal Mouse Logitech di Surabaya',
    batch_nomor: null,
    tanggal_kadaluarsa: null,
    kartu_stok_masuk_id: null,
    created_at: '2026-10-13T00:00:00.000Z',
    updated_at: '2026-10-13T00:00:00.000Z',
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
  },
]

// Mutable In-Memory Stores
export let demoKategoriStore: KategoriProduk[] = [...INITIAL_DEMO_KATEGORI]
export let demoProdukStore: Produk[] = [...INITIAL_DEMO_PRODUK]
export let demoSatuanStore: SatuanProduk[] = [...INITIAL_DEMO_SATUAN]
export let demoKomponenStore: KomponenPaket[] = [...INITIAL_DEMO_KOMPONEN]
export let demoStokStore: StokProduk[] = [...INITIAL_DEMO_STOK]
export let demoKartuStokStore: KartuStok[] = [...INITIAL_DEMO_KARTU_STOK]

export function resetDemoProduk() {
  demoKategoriStore = [...INITIAL_DEMO_KATEGORI]
  demoProdukStore = [...INITIAL_DEMO_PRODUK]
  demoSatuanStore = [...INITIAL_DEMO_SATUAN]
  demoKomponenStore = [...INITIAL_DEMO_KOMPONEN]
  demoStokStore = [...INITIAL_DEMO_STOK]
  demoKartuStokStore = [...INITIAL_DEMO_KARTU_STOK]
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
 * Mengambil daftar kategori produk aktif
 */
export async function ambilDaftarKategori(): Promise<KategoriProduk[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await withTimeout(
      supabase.from('kategori_produk').select('*').is('deleted_at', null)
    )

    if (error || !data || data.length === 0) {
      return demoKategoriStore.filter((k) => !k.deleted_at)
    }

    return data
  } catch {
    return demoKategoriStore.filter((k) => !k.deleted_at)
  }
}

/**
 * Mengambil daftar produk lengkap dengan join kategori dan satuan dasar
 */
export async function ambilDaftarProduk(
  filter?: ProdukFilter
): Promise<ProdukWithRelations[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('produk')
      .select(
        `
        *,
        kategori:kategori_produk(*),
        satuan:satuan_produk(*),
        stok:stok_produk(*)
      `
      )
      .is('deleted_at', null)

    if (filter?.tipe_produk) {
      query = query.eq('tipe_produk', filter.tipe_produk)
    }

    if (filter?.kategori_produk_id) {
      query = query.eq('kategori_produk_id', filter.kategori_produk_id)
    }

    if (filter?.is_aktif !== undefined) {
      query = query.eq('is_aktif', filter.is_aktif)
    }

    const { data, error } = await withTimeout(query)

    if (error || !data || data.length === 0) {
      return getFilteredDemoProduk(filter)
    }

    const formatted: ProdukWithRelations[] = data.map((item: any) => {
      const activeSatuan: SatuanProduk[] = (item.satuan || []).filter(
        (s: any) => !s.deleted_at
      )
      const satuanDasar =
        activeSatuan.find((s) => s.is_satuan_dasar) || activeSatuan[0] || null

      const activeStok: StokProduk[] = (item.stok || []).filter(
        (st: any) =>
          !st.deleted_at &&
          (!filter?.cabang_id || st.cabang_id === filter.cabang_id)
      )

      const totalStok = activeStok.reduce(
        (acc: number, curr: StokProduk) => acc + (Number(curr.kuantitas) || 0),
        0
      )

      return {
        ...item,
        satuan_dasar: satuanDasar,
        satuan: activeSatuan,
        stok: activeStok,
        total_stok: totalStok,
      }
    })

    if (filter?.pencarian) {
      const search = filter.pencarian.toLowerCase()
      return formatted.filter(
        (p) =>
          p.nama.toLowerCase().includes(search) ||
          p.kode.toLowerCase().includes(search) ||
          p.satuan?.some((s) => s.barcode?.toLowerCase().includes(search))
      )
    }

    return formatted
  } catch {
    return getFilteredDemoProduk(filter)
  }
}

/**
 * Filter and format demo products fallback
 */
function getFilteredDemoProduk(filter?: ProdukFilter): ProdukWithRelations[] {
  let list = demoProdukStore.filter((p) => !p.deleted_at)

  if (filter?.tipe_produk) {
    list = list.filter((p) => p.tipe_produk === filter.tipe_produk)
  }

  if (filter?.kategori_produk_id) {
    list = list.filter((p) => p.kategori_produk_id === filter.kategori_produk_id)
  }

  if (filter?.is_aktif !== undefined) {
    list = list.filter((p) => p.is_aktif === filter.is_aktif)
  }

  const enriched: ProdukWithRelations[] = list.map((p) => {
    const kategori =
      demoKategoriStore.find((k) => k.id === p.kategori_produk_id) || null

    const allSatuan = demoSatuanStore.filter(
      (s) => s.produk_id === p.id && !s.deleted_at
    )
    const satuanDasar =
      allSatuan.find((s) => s.is_satuan_dasar) || allSatuan[0] || null

    const allStok = demoStokStore
      .filter(
        (st) =>
          st.produk_id === p.id &&
          !st.deleted_at &&
          (!filter?.cabang_id || st.cabang_id === filter.cabang_id)
      )
      .map((st) => ({
        ...st,
        cabang: demoCabangStore.find((c) => c.id === st.cabang_id) || null,
      }))

    const totalStok = allStok.reduce(
      (acc, curr) => acc + (Number(curr.kuantitas) || 0),
      0
    )

    return {
      ...p,
      kategori,
      satuan_dasar: satuanDasar,
      satuan: allSatuan,
      stok: allStok,
      total_stok: totalStok,
    }
  })

  if (filter?.pencarian) {
    const s = filter.pencarian.toLowerCase()
    return enriched.filter(
      (p) =>
        p.nama.toLowerCase().includes(s) ||
        p.kode.toLowerCase().includes(s) ||
        p.satuan?.some((u) => u.barcode?.toLowerCase().includes(s))
    )
  }

  return enriched
}

/**
 * Mengambil detail lengkap satu produk beserta satuan, komponen paket, dan stok per cabang
 */
export async function ambilDetailProduk(
  id: string
): Promise<ProdukWithRelations | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await withTimeout(
      supabase
        .from('produk')
        .select(
          `
          *,
          kategori:kategori_produk(*),
          satuan:satuan_produk(*),
          komponen:komponen_paket(
            *,
            produk_komponen:produk(*),
            satuan:satuan_produk(*)
          ),
          stok:stok_produk(
            *,
            cabang:cabang(*)
          )
        `
        )
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()
    )

    if (error || !data) {
      return getDetailDemoProduk(id)
    }

    const rawData = data as any
    const activeSatuan: SatuanProduk[] = (rawData.satuan || []).filter(
      (s: any) => !s.deleted_at
    )
    const satuanDasar =
      activeSatuan.find((s) => s.is_satuan_dasar) || activeSatuan[0] || null

    const totalStok = (rawData.stok || []).reduce(
      (acc: number, curr: any) => acc + (Number(curr.kuantitas) || 0),
      0
    )

    return {
      ...rawData,
      satuan_dasar: satuanDasar,
      satuan: activeSatuan,
      total_stok: totalStok,
    } as ProdukWithRelations
  } catch {
    return getDetailDemoProduk(id)
  }
}

function getDetailDemoProduk(id: string): ProdukWithRelations | null {
  const p = demoProdukStore.find((item) => item.id === id && !item.deleted_at)
  if (!p) return null

  const kategori =
    demoKategoriStore.find((k) => k.id === p.kategori_produk_id) || null

  const satuan = demoSatuanStore
    .filter((s) => s.produk_id === p.id && !s.deleted_at)
    .sort((a, b) => {
      if (a.is_satuan_dasar && !b.is_satuan_dasar) return -1
      if (!a.is_satuan_dasar && b.is_satuan_dasar) return 1
      return a.rasio_ke_dasar - b.rasio_ke_dasar
    })

  const satuanDasar = satuan.find((s) => s.is_satuan_dasar) || null

  const komponen = demoKomponenStore
    .filter((k) => k.paket_id === p.id && !k.deleted_at)
    .map((k) => {
      const produkKomponen =
        demoProdukStore.find((pk) => pk.id === k.produk_komponen_id) || null
      const satuanKomponen =
        demoSatuanStore.find((sk) => sk.id === k.satuan_produk_id) || null
      return {
        ...k,
        produk_komponen: produkKomponen,
        satuan: satuanKomponen,
      }
    })

  const stok = demoStokStore
    .filter((st) => st.produk_id === p.id && !st.deleted_at)
    .map((st) => ({
      ...st,
      cabang: demoCabangStore.find((c) => c.id === st.cabang_id) || null,
    }))

  const totalStok = stok.reduce((acc, curr) => acc + (Number(curr.kuantitas) || 0), 0)

  return {
    ...p,
    kategori,
    satuan,
    satuan_dasar: satuanDasar,
    komponen,
    stok,
    total_stok: totalStok,
  }
}
