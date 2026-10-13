import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  produkSchema,
  tipeProdukEnum,
  metodeValuasiEnum,
  type ProdukInput,
  type ProdukFormInput,
  type TipeProduk,
  type MetodeValuasi,
} from '@/lib/validasi/produk'
import {
  konversiKeSatuanDasar,
  konversiDariSatuanDasar,
} from '@/lib/konversi-satuan'
import {
  ambilDaftarProduk,
  ambilDetailProduk,
  ambilDaftarKategori,
  resetDemoProduk,
  demoProdukStore,
  demoSatuanStore,
  demoStokStore,
  demoKartuStokStore,
} from '@/server/queries/produk'
import {
  simpanProdukAction,
  hapusProdukAction,
} from '@/server/actions/produk'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase to force in-memory demo store fallback in test
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.reject(new Error('Supabase Offline'))),
}))

describe('Master Produk Validation Schema (produkSchema)', () => {
  it('should accept valid minimal persediaan product with single base unit', () => {
    const input: ProdukFormInput = {
      nama: 'Kabel UTP Cat 6',
      tipe_produk: 'persediaan',
      metode_valuasi: 'rata_rata',
      satuan: [
        {
          nama_satuan: 'Meter',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
          harga_jual_default: 5000,
        },
      ],
      dapat_dijual: true,
      dapat_dibeli: true,
      is_aktif: true,
      komponen: [],
      saldo_awal: [],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nama).toBe('Kabel UTP Cat 6')
      expect(result.data.tipe_produk).toBe('persediaan')
      expect(result.data.satuan).toHaveLength(1)
      expect(result.data.satuan[0].is_satuan_dasar).toBe(true)
      expect(result.data.satuan[0].rasio_ke_dasar).toBe(1)
    }
  })

  it('should accept valid multi-unit persediaan product (Pcs and Karton)', () => {
    const input: ProdukFormInput = {
      nama: 'Indomie Soto Mie 70g',
      tipe_produk: 'persediaan',
      metode_valuasi: 'rata_rata',
      kategori_produk_id: '30000000-0000-0000-0000-000000000001',
      harga_pokok_standar: 2800,
      peringatan_stok_minimum: 40,
      satuan: [
        {
          nama_satuan: 'Pcs',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
          barcode: '8998866200222',
          harga_jual_default: 3500,
          harga_jual_grosir: 3300,
          harga_jual_member: 3200,
        },
        {
          nama_satuan: 'Karton',
          rasio_ke_dasar: 40,
          is_satuan_dasar: false,
          barcode: '8998866200239',
          harga_jual_default: 135000,
          harga_jual_grosir: 130000,
          harga_jual_member: 128000,
        },
      ],
      dapat_dijual: true,
      dapat_dibeli: true,
      is_aktif: true,
      komponen: [],
      saldo_awal: [],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.satuan).toHaveLength(2)
      expect(result.data.satuan[0].rasio_ke_dasar).toBe(1)
      expect(result.data.satuan[1].rasio_ke_dasar).toBe(40)
    }
  })

  it('should reject product with empty satuan array', () => {
    const input = {
      nama: 'Produk Tanpa Satuan',
      tipe_produk: 'persediaan',
      satuan: [],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('satuan')
        )
      ).toBe(true)
    }
  })

  it('should reject product if no base unit is marked (is_satuan_dasar: true)', () => {
    const input = {
      nama: 'Produk Tanpa Satuan Dasar',
      tipe_produk: 'persediaan',
      satuan: [
        {
          nama_satuan: 'Karton',
          rasio_ke_dasar: 40,
          is_satuan_dasar: false,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('satuan dasar')
        )
      ).toBe(true)
    }
  })

  it('should reject product if multiple base units are marked', () => {
    const input = {
      nama: 'Produk Ganda Satuan Dasar',
      tipe_produk: 'persediaan',
      satuan: [
        {
          nama_satuan: 'Pcs',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
        {
          nama_satuan: 'Unit',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('satu satuan dasar')
        )
      ).toBe(true)
    }
  })

  it('should reject product if base unit rasio is not 1', () => {
    const input = {
      nama: 'Produk Rasio Dasar Salah',
      tipe_produk: 'persediaan',
      satuan: [
        {
          nama_satuan: 'Pcs',
          rasio_ke_dasar: 12,
          is_satuan_dasar: true,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('rasio')
        )
      ).toBe(true)
    }
  })

  it('should reject product if secondary unit rasio is less than or equal to 1', () => {
    const input = {
      nama: 'Produk Rasio Bertingkat Salah',
      tipe_produk: 'persediaan',
      satuan: [
        {
          nama_satuan: 'Pcs',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
        {
          nama_satuan: 'Lusin',
          rasio_ke_dasar: 1,
          is_satuan_dasar: false,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('lebih besar dari 1')
        )
      ).toBe(true)
    }
  })

  it('should reject duplicate unit names (case insensitive)', () => {
    const input = {
      nama: 'Produk Nama Satuan Duplikat',
      tipe_produk: 'persediaan',
      satuan: [
        {
          nama_satuan: 'Pcs',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
        {
          nama_satuan: 'pcs',
          rasio_ke_dasar: 12,
          is_satuan_dasar: false,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('duplikat')
        )
      ).toBe(true)
    }
  })

  it('should accept valid paket product with components', () => {
    const input: ProdukFormInput = {
      nama: 'Paket Workstation Hemat',
      tipe_produk: 'paket',
      satuan: [
        {
          nama_satuan: 'Paket',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
          harga_jual_default: 200000,
        },
      ],
      komponen: [
        {
          produk_komponen_id: '40000000-0000-0000-0000-000000000002',
          kuantitas: 1,
        },
        {
          produk_komponen_id: '40000000-0000-0000-0000-000000000003',
          kuantitas: 1,
        },
      ],
      saldo_awal: [],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tipe_produk).toBe('paket')
      expect(result.data.komponen).toHaveLength(2)
    }
  })

  it('should reject paket product if components array is empty', () => {
    const input = {
      nama: 'Paket Kosong',
      tipe_produk: 'paket',
      satuan: [
        {
          nama_satuan: 'Paket',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
      ],
      komponen: [],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('komponen')
        )
      ).toBe(true)
    }
  })

  it('should reject paket component with kuantitas <= 0', () => {
    const input = {
      nama: 'Paket Kuantitas Nol',
      tipe_produk: 'paket',
      satuan: [
        {
          nama_satuan: 'Paket',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
      ],
      komponen: [
        {
          produk_komponen_id: '40000000-0000-0000-0000-000000000002',
          kuantitas: 0,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should reject product if nama is less than 2 characters', () => {
    const input = {
      nama: 'A',
      tipe_produk: 'persediaan',
      satuan: [
        {
          nama_satuan: 'Pcs',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes('minimal 2 karakter')
        )
      ).toBe(true)
    }
  })

  it('should accept valid saldo awal for persediaan product', () => {
    const input = {
      nama: 'Mouse Wireless',
      tipe_produk: 'persediaan',
      metode_valuasi: 'fifo',
      satuan: [
        {
          nama_satuan: 'Unit',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
          harga_jual_default: 85000,
        },
      ],
      saldo_awal: [
        {
          cabang_id: '10000000-0000-0000-0000-000000000001',
          kuantitas: 20,
          harga_pokok: 50000,
        },
      ],
    }

    const result = produkSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.saldo_awal).toHaveLength(1)
      expect(result.data.saldo_awal[0].kuantitas).toBe(20)
      expect(result.data.saldo_awal[0].harga_pokok).toBe(50000)
    }
  })
})

describe('Unit Conversion Logic (@/lib/konversi-satuan)', () => {
  it('should accurately convert from transaction unit to base unit', () => {
    // 5 Karton x 40 = 200 Pcs
    expect(konversiKeSatuanDasar(5, 40)).toBe(200)
    // 3 Lusin x 12 = 36 Pcs
    expect(konversiKeSatuanDasar(3, 12)).toBe(36)
  })

  it('should accurately convert from base unit to target unit', () => {
    // 200 Pcs / 40 = 5 Karton
    expect(konversiDariSatuanDasar(200, 40)).toBe(5)
    // 36 Pcs / 12 = 3 Lusin
    expect(konversiDariSatuanDasar(36, 12)).toBe(3)
  })
})

describe('Server Queries (ambilDaftarProduk, ambilDetailProduk, ambilDaftarKategori)', () => {
  beforeEach(() => {
    resetDemoProduk()
  })

  it('should return initial demo products including Indomie Soto, Mouse Logitech, Jasa, and Paket', async () => {
    const products = await ambilDaftarProduk()
    expect(products.length).toBeGreaterThanOrEqual(4)

    const codes = products.map((p) => p.kode)
    expect(codes).toContain('PRD-0001')
    expect(codes).toContain('PRD-0002')
    expect(codes).toContain('PRD-0003')
    expect(codes).toContain('PRD-0004')

    const indomie = products.find((p) => p.kode === 'PRD-0001')
    expect(indomie).toBeDefined()
    expect(indomie?.nama.toLowerCase()).toContain('indomie')
    expect(indomie?.satuan_dasar?.nama_satuan).toBe('Pcs')
  })

  it('should filter products by tipe_produk', async () => {
    const persediaanOnly = await ambilDaftarProduk({ tipe_produk: 'persediaan' })
    expect(persediaanOnly.length).toBeGreaterThanOrEqual(2)
    expect(persediaanOnly.every((p) => p.tipe_produk === 'persediaan')).toBe(true)

    const paketOnly = await ambilDaftarProduk({ tipe_produk: 'paket' })
    expect(paketOnly.length).toBeGreaterThanOrEqual(1)
    expect(paketOnly.every((p) => p.tipe_produk === 'paket')).toBe(true)
  })

  it('should filter products by search query (name or barcode)', async () => {
    const searchByName = await ambilDaftarProduk({ pencarian: 'Logitech' })
    expect(searchByName.length).toBeGreaterThanOrEqual(1)
    expect(searchByName[0].kode).toBe('PRD-0002')

    const searchByBarcode = await ambilDaftarProduk({ pencarian: '8998866200111' })
    expect(searchByBarcode.length).toBeGreaterThanOrEqual(1)
    expect(searchByBarcode[0].kode).toBe('PRD-0001')
  })

  it('should return product details with satuan, komponen, and stok relations', async () => {
    const detailIndomie = await ambilDetailProduk('40000000-0000-0000-0000-000000000001')
    expect(detailIndomie).not.toBeNull()
    expect(detailIndomie?.kode).toBe('PRD-0001')
    expect(detailIndomie?.satuan).toHaveLength(2)
    expect(detailIndomie?.satuan?.map((s) => s.nama_satuan)).toContain('Pcs')
    expect(detailIndomie?.satuan?.map((s) => s.nama_satuan)).toContain('Karton')
    expect(detailIndomie?.stok?.length).toBeGreaterThanOrEqual(1)

    const detailPaket = await ambilDetailProduk('40000000-0000-0000-0000-000000000004')
    expect(detailPaket).not.toBeNull()
    expect(detailPaket?.kode).toBe('PRD-0004')
    expect(detailPaket?.komponen).toHaveLength(2)
  })

  it('should return null for non-existent product ID', async () => {
    const nonExistent = await ambilDetailProduk('00000000-0000-0000-0000-999999999999')
    expect(nonExistent).toBeNull()
  })

  it('should return product categories', async () => {
    const categories = await ambilDaftarKategori()
    expect(categories.length).toBeGreaterThanOrEqual(4)
    expect(categories.map((c) => c.kode)).toContain('KAT-0001')
  })
})

describe('Server Actions (simpanProdukAction, hapusProdukAction)', () => {
  beforeEach(() => {
    resetDemoProduk()
  })

  it('should create new persediaan product with multi-satuan and initial stock ledger', async () => {
    const response = await simpanProdukAction({
      nama: 'Kopi Kapal Api Special Mix',
      tipe_produk: 'persediaan',
      metode_valuasi: 'rata_rata',
      harga_pokok_standar: 1500,
      satuan: [
        {
          nama_satuan: 'Sachet',
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
          harga_jual_default: 2000,
        },
        {
          nama_satuan: 'Renceng',
          rasio_ke_dasar: 10,
          is_satuan_dasar: false,
          harga_jual_default: 19000,
        },
      ],
      saldo_awal: [
        {
          cabang_id: '10000000-0000-0000-0000-000000000001',
          kuantitas: 50, // 50 sachet
          harga_pokok: 1500,
        },
      ],
    })

    expect(response.success).toBe(true)
    expect(response.data).toBeDefined()
    if (response.data) {
      expect(response.data.kode).toMatch(/^PRD-\d{4}$/)
      expect(response.data.nama).toBe('Kopi Kapal Api Special Mix')

      // Check detail product
      const detail = await ambilDetailProduk(response.data.id)
      expect(detail).not.toBeNull()
      expect(detail?.satuan).toHaveLength(2)

      // Verify stok_produk is initialized
      const stokHQ = demoStokStore.find(
        (s) =>
          s.produk_id === response.data?.id &&
          s.cabang_id === '10000000-0000-0000-0000-000000000001'
      )
      expect(stokHQ).toBeDefined()
      expect(stokHQ?.kuantitas).toBe(50)
      expect(stokHQ?.total_nilai).toBe(75000)

      // Verify kartu_stok has 'saldo_awal'
      const kartu = demoKartuStokStore.find(
        (k) =>
          k.produk_id === response.data?.id &&
          k.cabang_id === '10000000-0000-0000-0000-000000000001'
      )
      expect(kartu).toBeDefined()
      expect(kartu?.jenis_mutasi).toBe('saldo_awal')
      expect(kartu?.kuantitas_masuk).toBe(50)
      expect(kartu?.total_nilai_masuk).toBe(75000)
    }
  })

  it('should update existing product details and units', async () => {
    const existingId = '40000000-0000-0000-0000-000000000001' // Indomie
    const response = await simpanProdukAction(
      {
        nama: 'Indomie Soto Banjar Limau Kuit',
        tipe_produk: 'persediaan',
        metode_valuasi: 'rata_rata',
        satuan: [
          {
            nama_satuan: 'Bungkus',
            rasio_ke_dasar: 1,
            is_satuan_dasar: true,
            harga_jual_default: 4000,
          },
        ],
      },
      existingId
    )

    expect(response.success).toBe(true)
    const detail = await ambilDetailProduk(existingId)
    expect(detail?.nama).toBe('Indomie Soto Banjar Limau Kuit')
    expect(detail?.satuan?.[0]?.nama_satuan).toBe('Bungkus')
  })

  it('should soft-delete product', async () => {
    const deleteId = '40000000-0000-0000-0000-000000000002' // Mouse
    const deleteResponse = await hapusProdukAction(deleteId)
    expect(deleteResponse.success).toBe(true)

    // Should no longer appear in active product list
    const activeProducts = await ambilDaftarProduk()
    expect(activeProducts.find((p) => p.id === deleteId)).toBeUndefined()
  })

  it('should return error if validation fails in simpanProdukAction', async () => {
    const response = await simpanProdukAction({
      nama: '',
      tipe_produk: 'persediaan',
      satuan: [],
    })
    expect(response.success).toBe(false)
    expect(response.error).toBeDefined()
  })
})

describe('Codebase Hygiene & Global Constraints', () => {
  it('should have zero lucide-react imports across product components and pages', () => {
    const produkFiles = [
      'src/lib/validasi/produk.ts',
      'src/server/queries/produk.ts',
      'src/server/actions/produk.ts',
      'src/components/produk/satuan-repeater.tsx',
      'src/components/produk/komponen-paket-form.tsx',
      'src/components/produk/saldo-awal-cabang-form.tsx',
      'src/components/produk/produk-form-tabs.tsx',
      'src/components/produk/produk-table.tsx',
      'src/app/(dashboard)/produk/page.tsx',
      'src/app/(dashboard)/produk/baru/page.tsx',
      'src/app/(dashboard)/produk/[id]/page.tsx',
    ]

    for (const relativePath of produkFiles) {
      const fullPath = path.resolve(process.cwd(), relativePath)
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        expect(content).not.toContain('lucide-react')
      }
    }
  })
})
