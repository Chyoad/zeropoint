import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  cabangSchema,
  tipeCabangEnum,
  type CabangInput,
} from '@/lib/validasi/cabang'
import {
  ambilDaftarCabang,
  ambilCabangById,
  resetDemoCabang,
  urutkanCabang,
  type Cabang,
} from '@/server/queries/cabang'
import {
  simpanCabangAction,
  hapusCabangAction,
} from '@/server/actions/cabang'

// Mock next/headers and next/cache
const mockCookieStore = {
  get: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.reject(new Error('Supabase Offline'))),
}))

describe('Cabang Validation Schema (cabangSchema)', () => {
  it('should accept valid minimal payload and set default is_aktif to true', () => {
    const input = {
      nama: 'Cabang Baru Bandung',
      tipe: 'cabang',
    }

    const result = cabangSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nama).toBe('Cabang Baru Bandung')
      expect(result.data.tipe).toBe('cabang')
      expect(result.data.is_aktif).toBe(true)
    }
  })

  it('should accept valid complete payload with all optional fields', () => {
    const input = {
      nama: 'Kantor Pusat Sudirman',
      tipe: 'pusat',
      alamat: 'Jl. Jenderal Sudirman Kav. 52-53',
      kota: 'Jakarta Selatan',
      telepon: '021-5551234',
      is_aktif: true,
    }

    const result = cabangSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nama).toBe('Kantor Pusat Sudirman')
      expect(result.data.tipe).toBe('pusat')
      expect(result.data.alamat).toBe('Jl. Jenderal Sudirman Kav. 52-53')
      expect(result.data.kota).toBe('Jakarta Selatan')
      expect(result.data.telepon).toBe('021-5551234')
      expect(result.data.is_aktif).toBe(true)
    }
  })

  it('should allow is_aktif to be explicitly set to false', () => {
    const input = {
      nama: 'Gudang Nonaktif Cilegon',
      tipe: 'gudang',
      is_aktif: false,
    }

    const result = cabangSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_aktif).toBe(false)
    }
  })

  it('should accept valid tipe enum: pusat, cabang, and gudang', () => {
    const types = ['pusat', 'cabang', 'gudang'] as const
    types.forEach((tipe) => {
      const res = cabangSchema.safeParse({
        nama: `Fasilitas ${tipe}`,
        tipe,
      })
      expect(res.success).toBe(true)
    })
  })

  it('should reject invalid tipe enum values', () => {
    const invalidTypes = ['toko', 'outlet', 'kantor', 'konsolidasi', '', 123]
    invalidTypes.forEach((tipe) => {
      const res = cabangSchema.safeParse({
        nama: 'Fasilitas Uji',
        tipe,
      })
      expect(res.success).toBe(false)
    })
  })

  it('should reject missing or empty nama', () => {
    const resEmpty = cabangSchema.safeParse({
      nama: '',
      tipe: 'cabang',
    })
    expect(resEmpty.success).toBe(false)

    const resWhitespace = cabangSchema.safeParse({
      nama: '   ',
      tipe: 'cabang',
    })
    expect(resWhitespace.success).toBe(false)

    const resMissing = cabangSchema.safeParse({
      tipe: 'cabang',
    })
    expect(resMissing.success).toBe(false)
  })

  it('should reject nama with less than 2 characters', () => {
    const resSingleChar = cabangSchema.safeParse({
      nama: 'A',
      tipe: 'cabang',
    })
    expect(resSingleChar.success).toBe(false)
    if (!resSingleChar.success) {
      expect(resSingleChar.error.issues[0]?.message).toMatch(
        /minimal 2 karakter/i
      )
    }
  })

  it('should handle optional telepon, kota, and alamat properly', () => {
    const payloadWithNulls = {
      nama: 'Gudang Perak',
      tipe: 'gudang',
      telepon: null,
      kota: null,
      alamat: null,
    }
    const resNulls = cabangSchema.safeParse(payloadWithNulls)
    expect(resNulls.success).toBe(true)

    const payloadWithEmptyStrings = {
      nama: 'Gudang Emas',
      tipe: 'gudang',
      telepon: '',
      kota: '',
      alamat: '',
    }
    const resEmptyStrings = cabangSchema.safeParse(payloadWithEmptyStrings)
    expect(resEmptyStrings.success).toBe(true)
  })

  it('should export tipeCabangEnum schema matching the TipeCabang type', () => {
    expect(tipeCabangEnum.safeParse('pusat').success).toBe(true)
    expect(tipeCabangEnum.safeParse('cabang').success).toBe(true)
    expect(tipeCabangEnum.safeParse('gudang').success).toBe(true)
    expect(tipeCabangEnum.safeParse('lainnya').success).toBe(false)
  })
})

describe('Cabang Server Queries & Sorting', () => {
  beforeEach(() => {
    resetDemoCabang()
    vi.clearAllMocks()
  })

  it('should return demo cabang list with pusat first and alphabetically ordered by name', async () => {
    const daftar = await ambilDaftarCabang()
    expect(daftar.length).toBeGreaterThanOrEqual(3)

    // Pusat must be first
    expect(daftar[0].tipe).toBe('pusat')
    expect(daftar[0].kode).toBe('HQ-0001')

    // Subsequent items sorted alphabetically by nama
    for (let i = 1; i < daftar.length - 1; i++) {
      if (daftar[i].tipe !== 'pusat' && daftar[i + 1].tipe !== 'pusat') {
        expect(
          daftar[i].nama.localeCompare(daftar[i + 1].nama, 'id-ID')
        ).toBeLessThanOrEqual(0)
      }
    }
  })

  it('should retrieve a branch by its ID correctly', async () => {
    const hq = await ambilCabangById('10000000-0000-0000-0000-000000000001')
    expect(hq).not.toBeNull()
    expect(hq?.nama).toBe('Kantor Pusat Jakarta (HQ)')
    expect(hq?.tipe).toBe('pusat')
  })

  it('should return null for non-existent branch ID', async () => {
    const nonExistent = await ambilCabangById('99999999-9999-9999-9999-999999999999')
    expect(nonExistent).toBeNull()
  })

  it('should sort an arbitrary array with pusat always first', () => {
    const rawList: Cabang[] = [
      {
        id: '3',
        kode: 'CBG-0002',
        organisasi_id: '1',
        nama: 'Cabang Semarang',
        tipe: 'cabang',
        alamat: null,
        kota: null,
        telepon: null,
        is_aktif: true,
        created_at: '',
        updated_at: '',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      },
      {
        id: '1',
        kode: 'HQ-0001',
        organisasi_id: '1',
        nama: 'Kantor Pusat Jakarta (HQ)',
        tipe: 'pusat',
        alamat: null,
        kota: null,
        telepon: null,
        is_aktif: true,
        created_at: '',
        updated_at: '',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      },
      {
        id: '2',
        kode: 'CBG-0001',
        organisasi_id: '1',
        nama: 'Cabang Bandung',
        tipe: 'cabang',
        alamat: null,
        kota: null,
        telepon: null,
        is_aktif: true,
        created_at: '',
        updated_at: '',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      },
    ]

    const sorted = urutkanCabang(rawList)
    expect(sorted[0].tipe).toBe('pusat')
    expect(sorted[1].nama).toBe('Cabang Bandung')
    expect(sorted[2].nama).toBe('Cabang Semarang')
  })
})

describe('Cabang Server Actions (simpanCabangAction & hapusCabangAction)', () => {
  beforeEach(() => {
    resetDemoCabang()
    vi.clearAllMocks()
  })

  it('should reject invalid input payload with validation error message', async () => {
    const invalidInput = {
      nama: 'A',
      tipe: 'cabang' as const,
    }

    const res = await simpanCabangAction(invalidInput)
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/minimal 2 karakter/i)
  })

  it('should create a new branch and generate CBG prefix code', async () => {
    const newInput: CabangInput = {
      nama: 'Cabang Medan',
      tipe: 'cabang',
      kota: 'Medan',
      telepon: '061-1234567',
      is_aktif: true,
    }

    const res = await simpanCabangAction(newInput)
    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data?.nama).toBe('Cabang Medan')
    expect(res.data?.tipe).toBe('cabang')
    expect(res.data?.kode).toMatch(/^CBG-\d{4}$/)

    // Confirm it can be retrieved from daftar
    const daftar = await ambilDaftarCabang()
    const found = daftar.find((c) => c.nama === 'Cabang Medan')
    expect(found).toBeDefined()
  })

  it('should update an existing branch', async () => {
    const existingId = '10000000-0000-0000-0000-000000000002' // Cabang Surabaya
    const updateInput: CabangInput = {
      nama: 'Cabang Surabaya Baru',
      tipe: 'cabang',
      alamat: 'Jl. Pemuda No. 10',
      kota: 'Surabaya Pusat',
      telepon: '031-9998888',
      is_aktif: false,
    }

    const res = await simpanCabangAction(updateInput, existingId)
    expect(res.success).toBe(true)
    expect(res.data?.nama).toBe('Cabang Surabaya Baru')
    expect(res.data?.is_aktif).toBe(false)
    expect(res.data?.kota).toBe('Surabaya Pusat')

    // Confirm query reflects update
    const updated = await ambilCabangById(existingId)
    expect(updated?.nama).toBe('Cabang Surabaya Baru')
    expect(updated?.is_aktif).toBe(false)
  })

  it('should soft-delete a branch and remove it from active listing', async () => {
    const targetId = '10000000-0000-0000-0000-000000000003' // Gudang Cikarang

    const deleteRes = await hapusCabangAction(targetId)
    expect(deleteRes.success).toBe(true)

    // Confirm not in active list
    const daftar = await ambilDaftarCabang()
    const foundInList = daftar.find((c) => c.id === targetId)
    expect(foundInList).toBeUndefined()

    // Confirm ambilCabangById returns null for soft-deleted branch
    const foundById = await ambilCabangById(targetId)
    expect(foundById).toBeNull()
  })

  it('should block deletion of branches with type pusat (HQ protection)', async () => {
    const hqId = '10000000-0000-0000-0000-000000000001' // Kantor Pusat Jakarta (HQ)

    const deleteRes = await hapusCabangAction(hqId)
    expect(deleteRes.success).toBe(false)
    expect(deleteRes.error).toBe('Cabang kantor pusat tidak dapat dihapus')

    // Confirm HQ is still in active listing
    const daftar = await ambilDaftarCabang()
    const foundInList = daftar.find((c) => c.id === hqId)
    expect(foundInList).toBeDefined()
    expect(foundInList?.tipe).toBe('pusat')
  })
})

describe('Zero Lucide Icons Verification in Cabang Module', () => {
  const filesToCheck = [
    'src/lib/validasi/cabang.ts',
    'src/server/queries/cabang.ts',
    'src/server/actions/cabang.ts',
    'src/components/cabang/cabang-table.tsx',
    'src/components/cabang/cabang-dialog.tsx',
    'src/app/(dashboard)/cabang/page.tsx',
  ]

  filesToCheck.forEach((filePath) => {
    it(`should have zero lucide-react imports in ${filePath}`, () => {
      const fullPath = path.resolve(process.cwd(), filePath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      expect(content).not.toContain('lucide-react')
    })
  })

  it('should import Hugeicons in UI components', () => {
    const tablePath = path.resolve(process.cwd(), 'src/components/cabang/cabang-table.tsx')
    const dialogPath = path.resolve(process.cwd(), 'src/components/cabang/cabang-dialog.tsx')

    const tableContent = fs.readFileSync(tablePath, 'utf-8')
    const dialogContent = fs.readFileSync(dialogPath, 'utf-8')

    expect(tableContent).toContain('@hugeicons/react')
    expect(tableContent).toContain('@hugeicons/core-free-icons')
    expect(dialogContent).toContain('@hugeicons/react')
    expect(dialogContent).toContain('@hugeicons/core-free-icons')
  })
})
