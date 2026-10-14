import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  profilOrganisasiSchema,
  type ProfilOrganisasiFormInput,
} from '@/lib/validasi/pengaturan'
import {
  ambilDaftarLogAudit,
  resetDemoLogAudit,
  tambahDemoLogAudit,
  formatBadgeAksi,
} from '@/server/queries/log-audit'
import {
  ambilProfilOrganisasi,
  resetDemoOrganisasi,
  demoOrganisasiStore,
} from '@/server/queries/pengaturan'
import { perbaruiProfilOrganisasiAction } from '@/server/actions/pengaturan'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase to force in-memory demo store fallback in unit test
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.reject(new Error('Supabase Offline'))),
}))

describe('Task 11: Log Audit & Pengaturan Organisasi Suite', () => {
  beforeEach(() => {
    resetDemoLogAudit()
    resetDemoOrganisasi()
  })

  describe('1. Log Audit Queries & Filter (ambilDaftarLogAudit)', () => {
    it('harus mengembalikan seluruh daftar log audit awal (minimal 10 entri)', async () => {
      const logs = await ambilDaftarLogAudit()
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThanOrEqual(10)
      expect(logs[0]).toHaveProperty('id')
      expect(logs[0]).toHaveProperty('kode')
      expect(logs[0]).toHaveProperty('aksi')
      expect(logs[0]).toHaveProperty('entitas')
      expect(logs[0]).toHaveProperty('created_at')
    })

    it('harus memfilter log audit berdasarkan cabang_id', async () => {
      const cabangSurabayaId = '10000000-0000-0000-0000-000000000002'
      const logs = await ambilDaftarLogAudit({ cabang_id: cabangSurabayaId })

      expect(logs.length).toBeGreaterThan(0)
      for (const log of logs) {
        expect(log.cabang_id).toBe(cabangSurabayaId)
      }
    })

    it('harus memfilter log audit berdasarkan aksi (CREATE, UPDATE, DELETE, ADJUST)', async () => {
      const createLogs = await ambilDaftarLogAudit({ aksi: 'CREATE' })
      expect(createLogs.length).toBeGreaterThan(0)
      for (const log of createLogs) {
        expect(log.aksi).toBe('CREATE')
      }

      const adjustLogs = await ambilDaftarLogAudit({ aksi: 'ADJUST' })
      expect(adjustLogs.length).toBeGreaterThan(0)
      for (const log of adjustLogs) {
        expect(log.aksi).toBe('ADJUST')
      }

      const updateLogs = await ambilDaftarLogAudit({ aksi: 'UPDATE' })
      expect(updateLogs.length).toBeGreaterThan(0)
      for (const log of updateLogs) {
        expect(log.aksi).toBe('UPDATE')
      }
    })

    it('harus memfilter log audit berdasarkan entitas / tabel', async () => {
      const produkLogs = await ambilDaftarLogAudit({ entitas: 'produk' })
      expect(produkLogs.length).toBeGreaterThan(0)
      for (const log of produkLogs) {
        expect(log.entitas).toBe('produk')
      }

      const opnameLogs = await ambilDaftarLogAudit({ entitas: 'penyesuaian_stok' })
      expect(opnameLogs.length).toBeGreaterThan(0)
      for (const log of opnameLogs) {
        expect(log.entitas).toBe('penyesuaian_stok')
      }
    })

    it('harus memfilter log audit berdasarkan rentang tanggal', async () => {
      const logs = await ambilDaftarLogAudit({
        tanggal_mulai: '2026-10-13T00:00:00.000Z',
        tanggal_selesai: '2026-10-13T23:59:59.999Z',
      })

      expect(logs.length).toBeGreaterThan(0)
      for (const log of logs) {
        expect(log.created_at >= '2026-10-13T00:00:00.000Z').toBe(true)
        expect(log.created_at <= '2026-10-13T23:59:59.999Z').toBe(true)
      }
    })

    it('harus memfilter log audit berdasarkan pencarian kata kunci (search / pencarian)', async () => {
      const logs = await ambilDaftarLogAudit({ search: 'Indomie' })
      expect(logs.length).toBeGreaterThan(0)
      for (const log of logs) {
        const matches =
          (log.deskripsi && log.deskripsi.toLowerCase().includes('indomie')) ||
          (log.kode && log.kode.toLowerCase().includes('indomie'))
        expect(matches).toBe(true)
      }
    })

    it('harus mendukung paginasi dengan limit dan offset', async () => {
      const allLogs = await ambilDaftarLogAudit()
      const limitLogs = await ambilDaftarLogAudit({ limit: 3, offset: 2 })

      expect(limitLogs.length).toBe(3)
      expect(limitLogs[0].id).toBe(allLogs[2].id)
      expect(limitLogs[1].id).toBe(allLogs[3].id)
      expect(limitLogs[2].id).toBe(allLogs[4].id)
    })

    it('harus menambahkan log baru melalui tambahDemoLogAudit dan mereset via resetDemoLogAudit', async () => {
      tambahDemoLogAudit({
        id: 'test-log-1',
        kode: 'LOG-TEST-0001',
        organisasi_id: '00000000-0000-0000-0000-000000000001',
        cabang_id: '10000000-0000-0000-0000-000000000001',
        cabang_nama: 'Kantor Pusat Jakarta (HQ)',
        user_id: '20000000-0000-0000-0000-000000000001',
        user_nama: 'Superadmin Direksi',
        aksi: 'CREATE',
        entitas: 'produk',
        entitas_id: 'test-prod-1',
        tabel_nama: 'produk',
        record_id: 'test-prod-1',
        data_lama: null,
        data_baru: { test: true },
        deskripsi: 'Test Audit Entry',
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      })

      const logsAfterAdd = await ambilDaftarLogAudit({ search: 'LOG-TEST-0001' })
      expect(logsAfterAdd.length).toBe(1)
      expect(logsAfterAdd[0].kode).toBe('LOG-TEST-0001')

      resetDemoLogAudit()
      const logsAfterReset = await ambilDaftarLogAudit({ search: 'LOG-TEST-0001' })
      expect(logsAfterReset.length).toBe(0)
    })

    it('harus mengembalikan array kosong jika query Supabase sukses dengan 0 baris (tidak fallback ke demo store)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSelect = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      })

      vi.mocked(createClient).mockResolvedValueOnce({
        from: mockFrom,
      } as any)

      const result = await ambilDaftarLogAudit()
      expect(result).toEqual([])
    })
  })

  describe('2. Helper Format Badge Aksi (formatBadgeAksi)', () => {
    it('harus memformat badge CREATE dengan warna emerald', () => {
      const badge = formatBadgeAksi('CREATE')
      expect(badge.label).toBe('CREATE')
      expect(badge.color).toContain('emerald')
      expect(badge.bg).toContain('emerald')
    })

    it('harus memformat badge UPDATE dengan warna blue', () => {
      const badge = formatBadgeAksi('UPDATE')
      expect(badge.label).toBe('UPDATE')
      expect(badge.color).toContain('blue')
      expect(badge.bg).toContain('blue')
    })

    it('harus memformat badge DELETE dengan warna rose', () => {
      const badge = formatBadgeAksi('DELETE')
      expect(badge.label).toBe('DELETE')
      expect(badge.color).toContain('rose')
      expect(badge.bg).toContain('rose')
    })

    it('harus memformat badge ADJUST dengan warna purple', () => {
      const badge = formatBadgeAksi('ADJUST')
      expect(badge.label).toBe('ADJUST')
      expect(badge.color).toContain('purple')
      expect(badge.bg).toContain('purple')
    })

    it('harus menangani aksi tidak dikenal dengan fallback netral', () => {
      const badge = formatBadgeAksi('CUSTOM_ACTION')
      expect(badge.label).toBe('CUSTOM_ACTION')
      expect(badge.color).toContain('zinc')
    })
  })

  describe('3. Validasi Skema & Pengaturan Organisasi', () => {
    it('harus memvalidasi profil organisasi yang valid', () => {
      const input: ProfilOrganisasiFormInput = {
        kode: 'ORG-0001',
        nama: 'PT Zeropoint Nusantara',
        npwp: '01.234.567.8-901.000',
        alamat: 'Jl. Jenderal Sudirman Kav 52-53',
        kota: 'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        telepon: '021-5551234',
        email: 'info@zeropoint.local',
        mata_uang_default: 'IDR',
        zona_waktu: 'Asia/Jakarta (WIB)',
        pemisah_angka: 'titik',
        format_tanggal: 'DD/MM/YYYY',
      }

      const res = profilOrganisasiSchema.safeParse(input)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.mata_uang_default).toBe('IDR')
        expect(res.data.zona_waktu).toBe('Asia/Jakarta (WIB)')
        expect(res.data.pemisah_angka).toBe('titik')
      }
    })

    it('harus menolak input dengan format email yang salah', () => {
      const input = {
        kode: 'ORG-0001',
        nama: 'PT Zeropoint Nusantara',
        npwp: '01.234.567.8-901.000',
        alamat: 'Jl. Sudirman',
        kota: 'Jakarta',
        provinsi: 'DKI Jakarta',
        telepon: '021-5551234',
        email: 'bukan-email-valid',
      }

      const res = profilOrganisasiSchema.safeParse(input)
      expect(res.success).toBe(false)
      if (!res.success) {
        const emailErr = res.error.issues.find((i) => i.path.includes('email'))
        expect(emailErr).toBeDefined()
      }
    })

    it('harus mengambil profil organisasi default melalui ambilProfilOrganisasi', async () => {
      const profil = await ambilProfilOrganisasi()
      expect(profil).toBeDefined()
      expect(profil.kode).toBe('ORG-0001')
      expect(profil.nama).toBe('PT Zeropoint Nusantara')
      expect(profil.mata_uang_default).toBe('IDR')
      expect(profil.supabase_status).toBe('demo')
    })

    it('harus berhasil memperbarui profil organisasi melalui perbaruiProfilOrganisasiAction', async () => {
      const input: ProfilOrganisasiFormInput = {
        id: demoOrganisasiStore.id,
        kode: 'ORG-0001',
        nama: 'PT Zeropoint Nusantara Sukses',
        npwp: '01.999.888.7-654.000',
        alamat: 'Menara Mandiri Lt. 30, Jl. Jend. Sudirman',
        kota: 'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        telepon: '021-8889999',
        email: 'official@zeropoint.local',
        mata_uang_default: 'IDR',
        zona_waktu: 'Asia/Jakarta (WIB)',
        pemisah_angka: 'titik',
        format_tanggal: 'DD/MM/YYYY',
      }

      const res = await perbaruiProfilOrganisasiAction(input)
      expect(res.success).toBe(true)
      expect(res.data?.nama).toBe('PT Zeropoint Nusantara Sukses')
      expect(res.data?.npwp).toBe('01.999.888.7-654.000')

      // Verifikasi query mengembalikan data yang diperbarui
      const profilUpdated = await ambilProfilOrganisasi()
      expect(profilUpdated.nama).toBe('PT Zeropoint Nusantara Sukses')
      expect(profilUpdated.telepon).toBe('021-8889999')

      // Verifikasi log audit tercatat otomatis
      const logs = await ambilDaftarLogAudit({ entitas: 'organisasi' })
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].aksi).toBe('UPDATE')
    })

    it('harus mengembalikan error jika perbaruiProfilOrganisasiAction menerima data tidak valid', async () => {
      const invalidInput = {
        kode: 'O', // kurang dari 2 karakter
        nama: '',
        email: 'invalid-email',
      } as any

      const res = await perbaruiProfilOrganisasiAction(invalidInput)
      expect(res.success).toBe(false)
      expect(res.error).toBeDefined()
      expect(res.error).toContain('Validasi profil organisasi gagal')
    })

    it('harus memanggil insert ke tabel log_audit di Supabase saat update profil organisasi berhasil', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockLogInsert = vi.fn().mockResolvedValue({ error: null })
      const mockOrgUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: '00000000-0000-0000-0000-000000000001',
                kode: 'ORG-0001',
                nama: 'PT Supabase Persisted Corp',
                logo_url: null,
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      })

      const mockFrom = vi.fn((table: string) => {
        if (table === 'organisasi') {
          return { update: mockOrgUpdate }
        }
        if (table === 'log_audit') {
          return { insert: mockLogInsert }
        }
        return {}
      })

      vi.mocked(createClient).mockResolvedValueOnce({
        from: mockFrom,
      } as any)

      const res = await perbaruiProfilOrganisasiAction({
        id: demoOrganisasiStore.id,
        kode: 'ORG-0001',
        nama: 'PT Supabase Persisted Corp',
        npwp: '01.234.567.8-999.000',
        alamat: 'Menara Mandiri Lt. 30, Jl. Jend. Sudirman',
        kota: 'Jakarta Selatan',
        provinsi: 'DKI Jakarta',
        telepon: '021-8889999',
        email: 'official@zeropoint.local',
        mata_uang_default: 'IDR',
        zona_waktu: 'Asia/Jakarta (WIB)',
        pemisah_angka: 'titik',
        format_tanggal: 'DD/MM/YYYY',
      })

      expect(res.success).toBe(true)
      expect(mockLogInsert).toHaveBeenCalledTimes(1)
      expect(mockLogInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          tabel_nama: 'organisasi',
          aksi: 'UPDATE',
        })
      )
    })
  })

  describe('4. Verifikasi Struktur File CI/CD Workflow (.github/workflows/ci.yml)', () => {
    it('harus memvalidasi keberadaan dan konfigurasi workflow CI', () => {
      const ciPath = path.resolve(process.cwd(), '.github/workflows/ci.yml')
      expect(fs.existsSync(ciPath)).toBe(true)

      const ciContent = fs.readFileSync(ciPath, 'utf-8')
      // Triggers
      expect(ciContent).toContain('push:')
      expect(ciContent).toContain('pull_request:')
      expect(ciContent).toContain('branches: [main]')

      // Steps
      expect(ciContent).toContain('actions/checkout@v4')
      expect(ciContent).toContain('pnpm/action-setup@v4')
      expect(ciContent).toContain('actions/setup-node@v4')
      expect(ciContent).toContain('node-version: 20')
      expect(ciContent).toContain("cache: 'pnpm'")
      expect(ciContent).toContain('pnpm install')
      expect(ciContent).toContain('pnpm lint')
      expect(ciContent).toContain('pnpm typecheck')
      expect(ciContent).toContain('pnpm test')
      expect(ciContent).toContain('pnpm build')
    })
  })

  describe('5. Verifikasi Dokumentasi README.md', () => {
    it('harus memvalidasi keberadaan dan kelengkapan dokumentasi enterprise README.md', () => {
      const readmePath = path.resolve(process.cwd(), 'README.md')
      expect(fs.existsSync(readmePath)).toBe(true)

      const readmeContent = fs.readFileSync(readmePath, 'utf-8')
      expect(readmeContent).toContain('Zeropoint')
      expect(readmeContent).toContain('Multi-Cabang')
      expect(readmeContent).toContain('Multi-Satuan')
      expect(readmeContent).toContain('Moving Average')
      expect(readmeContent).toContain('Stock Opname')
      expect(readmeContent).toContain('buat_kode')
      expect(readmeContent).toContain('Indonesian Singular Snake_Case')
      expect(readmeContent).toContain('Hugeicons')
      expect(readmeContent).toContain('Outfit')
    })
  })

  describe('6. Codebase Hygiene & Zero lucide-react Imports', () => {
    it('harus 100% bebas dari import lucide-react di semua modul baru Task 11', () => {
      const targetFiles = [
        'src/lib/validasi/log-audit.ts',
        'src/lib/validasi/pengaturan.ts',
        'src/server/queries/log-audit.ts',
        'src/server/queries/pengaturan.ts',
        'src/server/actions/pengaturan.ts',
        'src/components/log-audit/log-audit-table.tsx',
        'src/components/pengaturan/pengaturan-form.tsx',
        'src/app/(dashboard)/log-audit/page.tsx',
        'src/app/(dashboard)/pengaturan/page.tsx',
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
