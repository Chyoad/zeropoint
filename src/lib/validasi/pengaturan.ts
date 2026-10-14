import { z } from 'zod'

export const profilOrganisasiSchema = z.object({
  id: z.string().optional(),
  kode: z.string().min(2, 'Kode organisasi minimal 2 karakter').default('ORG-0001'),
  nama: z.string().min(2, 'Nama organisasi minimal 2 karakter'),
  npwp: z.string().min(5, 'NPWP minimal 5 karakter').default('01.234.567.8-901.000'),
  alamat: z.string().min(3, 'Alamat minimal 3 karakter'),
  kota: z.string().min(2, 'Kota minimal 2 karakter'),
  provinsi: z.string().min(2, 'Provinsi minimal 2 karakter'),
  telepon: z.string().min(5, 'Nomor telepon minimal 5 digit'),
  email: z.string().email('Format email tidak valid'),
  mata_uang_default: z.string().min(2, 'Mata uang default wajib diisi').default('IDR'),
  zona_waktu: z
    .enum(['Asia/Jakarta (WIB)', 'Asia/Makassar (WITA)', 'Asia/Jayapura (WIT)'])
    .default('Asia/Jakarta (WIB)'),
  pemisah_angka: z.enum(['titik', 'koma']).default('titik'),
  format_tanggal: z.string().default('DD/MM/YYYY'),
})

export type ProfilOrganisasiInput = z.infer<typeof profilOrganisasiSchema>
export type ProfilOrganisasiFormInput = z.input<typeof profilOrganisasiSchema>

export interface ProfilOrganisasi extends Omit<ProfilOrganisasiInput, 'id'> {
  id: string
  logo_url?: string | null
  supabase_status?: 'connected' | 'demo'
  versi_aplikasi?: string
  created_at?: string
  updated_at?: string
}

export const INITIAL_DEMO_ORGANISASI: ProfilOrganisasi = {
  id: '00000000-0000-0000-0000-000000000001',
  kode: 'ORG-0001',
  nama: 'PT Zeropoint Nusantara',
  logo_url: '/logo.png',
  npwp: '01.234.567.8-901.000',
  alamat: 'Gedung Cyber 2 Tower Lt. 18, Jl. HR Rasuna Said Blok X-5',
  kota: 'Jakarta Selatan',
  provinsi: 'DKI Jakarta',
  telepon: '021-5551234',
  email: 'corporate@zeropoint.local',
  mata_uang_default: 'IDR',
  zona_waktu: 'Asia/Jakarta (WIB)',
  pemisah_angka: 'titik',
  format_tanggal: 'DD/MM/YYYY',
  supabase_status: 'demo',
  versi_aplikasi: '1.0.0-enterprise',
  created_at: '2026-10-13T00:00:00.000Z',
  updated_at: '2026-10-13T00:00:00.000Z',
}
