import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  penyesuaianStokSchema,
  penyesuaianStokItemSchema,
  hitungSelisihOpname,
  formatStatusPenyesuaian,
  formatTipePenyesuaian,
  type PenyesuaianStokFormInput,
} from '@/lib/validasi/penyesuaian-stok'
import {
  ambilDaftarPenyesuaianStok,
  ambilDetailPenyesuaianStok,
  ambilProdukDanStokBuku,
  resetDemoPenyesuaianStok,
  demoPenyesuaianStokStore,
  demoPenyesuaianStokItemStore,
} from '@/server/queries/penyesuaian-stok'
import {
  simpanPenyesuaianStokAction,
  selesaikanPenyesuaianStokAction,
  batalkanPenyesuaianStokAction,
} from '@/server/actions/penyesuaian-stok'
import {
  resetDemoProduk,
  demoStokStore,
  demoKartuStokStore,
} from '@/server/queries/produk'
import { resetDemoCabang } from '@/server/queries/cabang'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase to force in-memory demo store fallback in test
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.reject(new Error('Supabase Offline'))),
}))

describe('Modul Penyesuaian Stok / Stock Opname', () => {
  beforeEach(() => {
    resetDemoCabang()
    resetDemoProduk()
    resetDemoPenyesuaianStok()
  })

  describe('1. Kalkulasi Selisih Opname (hitungSelisihOpname)', () => {
    it('harus menghasilkan selisih positif, total nilai selisih positif, dan penyesuaian_masuk jika stok fisik > stok buku', () => {
      const stokBuku = 100
      const stokFisik = 108
      const hargaSatuan = 25000

      const hasil = hitungSelisihOpname(stokBuku, stokFisik, hargaSatuan)
      expect(hasil.selisih).toBe(8)
      expect(hasil.totalNilaiSelisih).toBe(200000)
      expect(hasil.jenisMutasi).toBe('penyesuaian_masuk')
    })

    it('harus menghasilkan selisih negatif, total nilai selisih negatif, dan penyesuaian_keluar jika stok fisik < stok buku', () => {
      const stokBuku = 50
      const stokFisik = 47
      const hargaSatuan = 10000

      const hasil = hitungSelisihOpname(stokBuku, stokFisik, hargaSatuan)
      expect(hasil.selisih).toBe(-3)
      expect(hasil.totalNilaiSelisih).toBe(-30000)
      expect(hasil.jenisMutasi).toBe('penyesuaian_keluar')
    })

    it('harus menghasilkan selisih 0, total nilai 0, dan jenisMutasi null jika stok fisik === stok buku', () => {
      const stokBuku = 200
      const stokFisik = 200
      const hargaSatuan = 3000

      const hasil = hitungSelisihOpname(stokBuku, stokFisik, hargaSatuan)
      expect(hasil.selisih).toBe(0)
      expect(hasil.totalNilaiSelisih).toBe(0)
      expect(hasil.jenisMutasi).toBeNull()
    })

    it('harus menormalisasi presisi floating point IEEE 754 tanpa precision error', () => {
      // 0.3 - 0.1 sering kali menghasilkan 0.19999999999999998 dalam JS default
      const stokBuku = 10.1
      const stokFisik = 10.3
      const hargaSatuan = 1000

      const hasil = hitungSelisihOpname(stokBuku, stokFisik, hargaSatuan)
      expect(hasil.selisih).toBe(0.2)
      expect(hasil.totalNilaiSelisih).toBe(200)
      expect(hasil.jenisMutasi).toBe('penyesuaian_masuk')
    })

    it('harus menangani hargaSatuan 0 atau undefined dengan aman', () => {
      const hasil = hitungSelisihOpname(10, 15)
      expect(hasil.selisih).toBe(5)
      expect(hasil.totalNilaiSelisih).toBe(0)
      expect(hasil.jenisMutasi).toBe('penyesuaian_masuk')
    })

    it('harus menormalisasi selisih ke satuan dasar jika diberikan rasio konversi > 1', () => {
      // Misal 1 Karton = 40 Pcs. Stok buku = 2 karton, stok fisik = 3 karton
      const stokBuku = 2
      const stokFisik = 3
      const hargaSatuan = 2500
      const rasioKeDasar = 40

      const hasil = hitungSelisihOpname(stokBuku, stokFisik, hargaSatuan, rasioKeDasar)
      // Selisih dalam satuan dasar: (3 * 40) - (2 * 40) = 40 Pcs
      expect(hasil.selisih).toBe(40)
      expect(hasil.totalNilaiSelisih).toBe(100000)
      expect(hasil.jenisMutasi).toBe('penyesuaian_masuk')
    })
  })

  describe('2. Validasi Zod Schema (penyesuaianStokSchema & item)', () => {
    it('harus valid dengan payload opname yang benar', () => {
      const input: PenyesuaianStokFormInput = {
        cabang_id: '10000000-0000-0000-0000-000000000001',
        tanggal: '2026-10-13T10:00:00.000Z',
        tipe_penyesuaian: 'opname',
        status: 'draft',
        catatan: 'Opname rutin rak A',
        items: [
          {
            produk_id: '40000000-0000-0000-0000-000000000001',
            satuan_produk_id: '50000000-0000-0000-0000-000000000001',
            stok_buku: 200,
            stok_fisik: 205,
            harga_satuan: 2800,
            alasan: 'Barang lebih 5 pcs saat bongkar dus',
          },
        ],
      }

      const parsed = penyesuaianStokSchema.safeParse(input)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.tipe_penyesuaian).toBe('opname')
        expect(parsed.data.status).toBe('draft')
        expect(parsed.data.items).toHaveLength(1)
        expect(parsed.data.items[0].stok_buku).toBe(200)
      }
    })

    it('harus menolak jika cabang_id kosong', () => {
      const input: any = {
        cabang_id: '',
        tanggal: '2026-10-13T10:00:00.000Z',
        items: [
          {
            produk_id: '40000000-0000-0000-0000-000000000001',
            stok_buku: 10,
            stok_fisik: 10,
            harga_satuan: 1000,
          },
        ],
      }

      const parsed = penyesuaianStokSchema.safeParse(input)
      expect(parsed.success).toBe(false)
    })

    it('harus menolak jika items kosong', () => {
      const input: any = {
        cabang_id: '10000000-0000-0000-0000-000000000001',
        tanggal: '2026-10-13T10:00:00.000Z',
        items: [],
      }

      const parsed = penyesuaianStokSchema.safeParse(input)
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('Minimal 1 item')
      }
    })

    it('harus menolak jika stok_buku atau stok_fisik negatif', () => {
      const itemNegatif = {
        produk_id: '40000000-0000-0000-0000-000000000001',
        stok_buku: -5,
        stok_fisik: 10,
        harga_satuan: 1000,
      }
      const parsedItem = penyesuaianStokItemSchema.safeParse(itemNegatif)
      expect(parsedItem.success).toBe(false)

      const itemFisikNegatif = {
        produk_id: '40000000-0000-0000-0000-000000000001',
        stok_buku: 10,
        stok_fisik: -2,
        harga_satuan: 1000,
      }
      const parsedFisik = penyesuaianStokItemSchema.safeParse(itemFisikNegatif)
      expect(parsedFisik.success).toBe(false)
    })

    it('harus mentransformasi objek Date menjadi string ISO', () => {
      const dateObj = new Date('2026-10-13T12:00:00.000Z')
      const input = {
        cabang_id: '10000000-0000-0000-0000-000000000001',
        tanggal: dateObj,
        items: [
          {
            produk_id: '40000000-0000-0000-0000-000000000001',
            stok_buku: 10,
            stok_fisik: 10,
            harga_satuan: 1000,
          },
        ],
      }

      const parsed = penyesuaianStokSchema.safeParse(input)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.tanggal).toBe('2026-10-13T12:00:00.000Z')
      }
    })
  })

  describe('3. Queries Demo Store & Fallback', () => {
    it('harus mengambil daftar penyesuaian stok lengkap dengan join cabang dan agregat', async () => {
      const daftar = await ambilDaftarPenyesuaianStok()
      expect(daftar.length).toBeGreaterThanOrEqual(3)

      const docSelesai = daftar.find((d) => d.status === 'selesai')
      expect(docSelesai).toBeDefined()
      expect(docSelesai?.cabang).toBeDefined()
      expect(docSelesai?.items_count).toBe(2)
      // Indomie +5 (nilai +14.000), Mouse -1 (nilai -45.000) -> total selisih fisik 4, nilai -31.000
      expect(docSelesai?.total_selisih_fisik).toBe(4)
      expect(docSelesai?.total_nilai_selisih).toBe(-31000)
    })

    it('harus memfilter daftar berdasarkan cabang_id', async () => {
      const hqId = '10000000-0000-0000-0000-000000000001'
      const daftar = await ambilDaftarPenyesuaianStok({ cabang_id: hqId })
      expect(daftar.every((d) => d.cabang_id === hqId)).toBe(true)
    })

    it('harus memfilter daftar berdasarkan status', async () => {
      const daftarDraft = await ambilDaftarPenyesuaianStok({ status: 'draft' })
      expect(daftarDraft.every((d) => d.status === 'draft')).toBe(true)

      const daftarSelesai = await ambilDaftarPenyesuaianStok({ status: 'selesai' })
      expect(daftarSelesai.every((d) => d.status === 'selesai')).toBe(true)
    })

    it('harus mengambil detail penyesuaian stok beserta join items dan produk', async () => {
      const idSelesai = '90000000-0000-0000-0000-000000000001'
      const detail = await ambilDetailPenyesuaianStok(idSelesai)

      expect(detail).not.toBeNull()
      expect(detail?.id).toBe(idSelesai)
      expect(detail?.cabang).toBeDefined()
      expect(detail?.items).toHaveLength(2)
      expect(detail?.items[0].produk).toBeDefined()
      expect(detail?.items[0].produk?.nama).toBe('Indomie Soto Mie 70g Spesial')
    })

    it('harus mengembalikan null untuk detail dengan id tidak ditemukan', async () => {
      const detail = await ambilDetailPenyesuaianStok('non-existent-id')
      expect(detail).toBeNull()
    })

    it('harus mengambil produk persediaan aktif dan stok buku di cabang terpilih (ambilProdukDanStokBuku)', async () => {
      const hqId = '10000000-0000-0000-0000-000000000001'
      const produkStok = await ambilProdukDanStokBuku(hqId)

      expect(produkStok.length).toBeGreaterThan(0)
      const indomie = produkStok.find((p) => p.kode_produk === 'PRD-0001')
      expect(indomie).toBeDefined()
      expect(indomie?.stok_buku).toBe(200)
      expect(indomie?.harga_satuan).toBe(2800)
      expect(indomie?.nama_satuan).toBe('Pcs')
    })
  })

  describe('4. Server Actions & Atomic Stock ledger Mutation', () => {
    it('harus menyimpan penyesuaian stok baru sebagai draft tanpa mengubah saldo stok atau kartu stok', async () => {
      const hqId = '10000000-0000-0000-0000-000000000001'
      const indomieId = '40000000-0000-0000-0000-000000000001'

      // Saldo awal di HQ: 200
      const stokAwal = demoStokStore.find(
        (s) => s.cabang_id === hqId && s.produk_id === indomieId
      )
      const awalQty = stokAwal?.kuantitas ?? 0
      const awalKartuStokCount = demoKartuStokStore.length

      const payload: PenyesuaianStokFormInput = {
        cabang_id: hqId,
        tanggal: '2026-10-14T09:00:00.000Z',
        tipe_penyesuaian: 'opname',
        status: 'draft',
        catatan: 'Draft opname mingguan',
        items: [
          {
            produk_id: indomieId,
            stok_buku: awalQty,
            stok_fisik: awalQty + 10, // Ada selisih +10
            harga_satuan: 2800,
            alasan: 'Audit sementara',
          },
        ],
      }

      const res = await simpanPenyesuaianStokAction(payload)
      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      expect(res.data?.status).toBe('draft')
      expect(res.data?.kode).toMatch(/^ADJ-\d{8}-\d{4}$/)

      // Verifikasi stok dan kartu stok TIDAK berubah saat status masih draft
      const stokSetelahDraft = demoStokStore.find(
        (s) => s.cabang_id === hqId && s.produk_id === indomieId
      )
      expect(stokSetelahDraft?.kuantitas).toBe(awalQty)
      expect(demoKartuStokStore.length).toBe(awalKartuStokCount)
    })

    it('harus menyimpan penyesuaian stok berstatus selesai dan langsung memutasi stok_produk serta kartu_stok', async () => {
      const cikarangId = '10000000-0000-0000-0000-000000000003'
      const indomieId = '40000000-0000-0000-0000-000000000001'

      // Di Cikarang stok awal Indomie = 400
      const stokAwal = demoStokStore.find(
        (s) => s.cabang_id === cikarangId && s.produk_id === indomieId
      )
      expect(stokAwal?.kuantitas).toBe(400)

      const payload: PenyesuaianStokFormInput = {
        cabang_id: cikarangId,
        tanggal: '2026-10-14T10:00:00.000Z',
        tipe_penyesuaian: 'koreksi',
        status: 'selesai',
        catatan: 'Koreksi stok rusak gudang transit',
        items: [
          {
            produk_id: indomieId,
            stok_buku: 400,
            stok_fisik: 385, // Selisih -15
            harga_satuan: 2750,
            alasan: '15 pcs rusak basah',
          },
        ],
      }

      const res = await simpanPenyesuaianStokAction(payload)
      expect(res.success).toBe(true)
      expect(res.data?.status).toBe('selesai')

      // Verifikasi saldo stok_produk terupdate ke stok fisik (385)
      const stokUpdate = demoStokStore.find(
        (s) => s.cabang_id === cikarangId && s.produk_id === indomieId
      )
      expect(stokUpdate?.kuantitas).toBe(385)
      expect(stokUpdate?.kuantitas_tersedia).toBe(385)

      // Verifikasi kartu stok mencatat mutasi penyesuaian_keluar
      const mutasi = demoKartuStokStore.find(
        (k) =>
          k.referensi_id === res.data?.id &&
          k.jenis_mutasi === 'penyesuaian_keluar'
      )
      expect(mutasi).toBeDefined()
      expect(mutasi?.kuantitas_keluar).toBe(15)
      expect(mutasi?.kuantitas_masuk).toBe(0)
      expect(mutasi?.sisa_kuantitas).toBe(385)
      expect(mutasi?.nomor_referensi).toBe(res.data?.kode)
      expect(mutasi?.catatan).toContain('15 pcs rusak basah')
    })

    it('harus dapat memfinalisasi draft penyesuaian stok (selesaikanPenyesuaianStokAction)', async () => {
      // Ambil dokumen draft demo: ADJ-20261013-0002 di Cikarang
      const draftId = '90000000-0000-0000-0000-000000000002'

      const res = await selesaikanPenyesuaianStokAction(draftId)
      expect(res.success).toBe(true)
      expect(res.data?.status).toBe('selesai')

      // Item draft memiliki stok_fisik 395 (selisih -5)
      const cikarangId = '10000000-0000-0000-0000-000000000003'
      const indomieId = '40000000-0000-0000-0000-000000000001'
      const stok = demoStokStore.find(
        (s) => s.cabang_id === cikarangId && s.produk_id === indomieId
      )
      expect(stok?.kuantitas).toBe(395)

      // Tidak bisa diselesaikan ulang
      const resKedua = await selesaikanPenyesuaianStokAction(draftId)
      expect(resKedua.success).toBe(false)
      expect(resKedua.error).toContain('sudah berstatus selesai')
    })

    it('harus dapat membatalkan draft penyesuaian stok (batalkanPenyesuaianStokAction)', async () => {
      const draftId = '90000000-0000-0000-0000-000000000002'

      const res = await batalkanPenyesuaianStokAction(draftId)
      expect(res.success).toBe(true)
      expect(res.data?.status).toBe('dibatalkan')

      // Transaksi yang selesai tidak dapat dibatalkan
      const selesaiId = '90000000-0000-0000-0000-000000000001'
      const resBatalSelesai = await batalkanPenyesuaianStokAction(selesaiId)
      expect(resBatalSelesai.success).toBe(false)
      expect(resBatalSelesai.error).toContain('sudah selesai tidak dapat dibatalkan')
    })

    it('harus menolak input yang tidak lolos validasi Zod', async () => {
      const invalidInput: any = {
        cabang_id: '',
        items: [],
      }

      const res = await simpanPenyesuaianStokAction(invalidInput)
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
    })

    it('harus menormalisasi kuantitas ke satuan dasar dan mempertahankan kuantitas_tertahan pada kuantitas_tersedia', async () => {
      const hqId = '10000000-0000-0000-0000-000000000001'
      const indomieId = '40000000-0000-0000-0000-000000000001'
      const kartonId = '50000000-0000-0000-0000-000000000002' // Rasio 40

      // Set simulasi stok awal di HQ dengan tertahan 10
      const stokAwal = demoStokStore.find(
        (s) => s.cabang_id === hqId && s.produk_id === indomieId
      )
      if (stokAwal) {
        stokAwal.kuantitas_tertahan = 10
      }

      // Input opname dalam satuan Karton (rasio 40): fisik 6 Karton = 240 Pcs
      const payload: PenyesuaianStokFormInput = {
        cabang_id: hqId,
        tanggal: '2026-10-14T11:00:00.000Z',
        tipe_penyesuaian: 'opname',
        status: 'selesai',
        items: [
          {
            produk_id: indomieId,
            satuan_produk_id: kartonId,
            stok_buku: 5, // 5 Karton = 200 Pcs
            stok_fisik: 6, // 6 Karton = 240 Pcs
            harga_satuan: 2800,
            alasan: 'Audit fisik 6 karton',
          },
        ],
      }

      const res = await simpanPenyesuaianStokAction(payload)
      expect(res.success).toBe(true)

      const stokAkhir = demoStokStore.find(
        (s) => s.cabang_id === hqId && s.produk_id === indomieId
      )
      // Kuantitas dasar = 240 Pcs
      expect(stokAkhir?.kuantitas).toBe(240)
      // Kuantitas tersedia = 240 - 10 (tertahan) = 230
      expect(stokAkhir?.kuantitas_tersedia).toBe(230)

      // Kartu stok mencatat faktor konversi 40, kuantitas masuk 40 (dalam satuan dasar), dan sisa dasar 240
      const mutasi = demoKartuStokStore.find((k) => k.referensi_id === res.data?.id)
      expect(mutasi).toBeDefined()
      expect(mutasi?.faktor_konversi).toBe(40)
      expect(mutasi?.kuantitas_masuk).toBe(40)
      expect(mutasi?.sisa_kuantitas).toBe(240)
    })
  })

  describe('5. UI Helpers & Formatting', () => {
    it('harus memformat status penyesuaian dengan kelas warna yang tepat', () => {
      const selesai = formatStatusPenyesuaian('selesai')
      expect(selesai.label).toBe('Selesai')
      expect(selesai.color).toContain('emerald')

      const draft = formatStatusPenyesuaian('draft')
      expect(draft.label).toBe('Draft')
      expect(draft.color).toContain('amber')

      const dibatalkan = formatStatusPenyesuaian('dibatalkan')
      expect(dibatalkan.label).toBe('Dibatalkan')
      expect(dibatalkan.color).toContain('rose')
    })

    it('harus memformat tipe penyesuaian dengan teks label deskriptif', () => {
      expect(formatTipePenyesuaian('opname')).toBe('Stock Opname')
      expect(formatTipePenyesuaian('koreksi')).toBe('Koreksi Stok')
      expect(formatTipePenyesuaian('saldo_awal')).toBe('Saldo Awal')
    })
  })

  describe('6. Codebase Hygiene & Zero lucide-react Imports', () => {
    it('harus 100% bebas dari import lucide-react di semua modul penyesuaian stok', () => {
      const targetFiles = [
        'src/lib/validasi/penyesuaian-stok.ts',
        'src/server/queries/penyesuaian-stok.ts',
        'src/server/actions/penyesuaian-stok.ts',
        'src/components/penyesuaian-stok/penyesuaian-table.tsx',
        'src/components/penyesuaian-stok/penyesuaian-form.tsx',
        'src/app/(dashboard)/penyesuaian-stok/page.tsx',
        'src/app/(dashboard)/penyesuaian-stok/baru/page.tsx',
        'src/app/(dashboard)/penyesuaian-stok/[id]/page.tsx',
      ]

      for (const relativePath of targetFiles) {
        const fullPath = path.resolve(process.cwd(), relativePath)
        expect(fs.existsSync(fullPath)).toBe(true)
        const content = fs.readFileSync(fullPath, 'utf-8')
        expect(content).not.toContain('lucide-react')
      }
    })
  })
})
