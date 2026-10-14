import { z } from 'zod'
import type {
  Database,
  TipePenyesuaianStok,
  StatusPenyesuaianStok,
} from '@/types/database.types'

export type PenyesuaianStok = Database['public']['Tables']['penyesuaian_stok']['Row']
export type PenyesuaianStokItem =
  Database['public']['Tables']['penyesuaian_stok_item']['Row']

export const tipePenyesuaianStokEnum = z.enum([
  'opname',
  'koreksi',
  'saldo_awal',
] as const)

export const statusPenyesuaianStokEnum = z.enum([
  'draft',
  'selesai',
  'dibatalkan',
] as const)

/**
 * Skema validasi baris rincian item penyesuaian stok
 */
export const penyesuaianStokItemSchema = z.object({
  id: z.string().optional(),
  kode: z.string().optional(),
  produk_id: z.string().min(1, 'Produk wajib dipilih'),
  satuan_produk_id: z.string().optional().nullable(),
  stok_buku: z.coerce.number().min(0, 'Stok buku minimal 0'),
  stok_fisik: z.coerce.number().min(0, 'Stok fisik minimal 0'),
  harga_satuan: z.coerce.number().min(0, 'Harga satuan minimal 0').default(0),
  alasan: z.string().optional().nullable(),
})

/**
 * Skema validasi transaksi penyesuaian stok / stock opname
 */
export const penyesuaianStokSchema = z.object({
  cabang_id: z.string().min(1, 'Cabang wajib dipilih'),
  tanggal: z
    .union([z.string().min(1, 'Tanggal wajib diisi'), z.date()])
    .transform((val) => (typeof val === 'string' ? val : val.toISOString())),
  tipe_penyesuaian: tipePenyesuaianStokEnum.default('opname'),
  status: z.enum(['draft', 'selesai'] as const).default('draft'),
  catatan: z.string().optional().nullable(),
  items: z
    .array(penyesuaianStokItemSchema)
    .min(1, 'Minimal 1 item penyesuaian stok harus dimasukkan'),
})

export type PenyesuaianStokInput = z.infer<typeof penyesuaianStokSchema>
export type PenyesuaianStokFormInput = z.input<typeof penyesuaianStokSchema>
export type PenyesuaianStokItemInput = z.infer<typeof penyesuaianStokItemSchema>

export interface SelisihOpnameResult {
  selisih: number
  totalNilaiSelisih: number
  jenisMutasi: 'penyesuaian_masuk' | 'penyesuaian_keluar' | null
}

/**
 * Kalkulasi selisih stok opname, total nilai selisih, dan penentuan jenis mutasi inventaris.
 *
 * Rumus:
 * - selisih = stok_fisik - stok_buku
 * - totalNilaiSelisih = selisih * hargaSatuan
 * - jenisMutasi = 'penyesuaian_masuk' jika selisih > 0,
 *                 'penyesuaian_keluar' jika selisih < 0,
 *                 null jika selisih === 0
 */
export function hitungSelisihOpname(
  stokBuku: number,
  stokFisik: number,
  hargaSatuan: number = 0
): SelisihOpnameResult {
  const safeStokBuku = Number(stokBuku) || 0
  const safeStokFisik = Number(stokFisik) || 0
  const safeHarga = Number(hargaSatuan) || 0

  const selisih = parseFloat((safeStokFisik - safeStokBuku).toPrecision(12))
  const totalNilaiSelisih = parseFloat((selisih * safeHarga).toPrecision(12))

  let jenisMutasi: 'penyesuaian_masuk' | 'penyesuaian_keluar' | null = null
  if (selisih > 0) {
    jenisMutasi = 'penyesuaian_masuk'
  } else if (selisih < 0) {
    jenisMutasi = 'penyesuaian_keluar'
  }

  return {
    selisih,
    totalNilaiSelisih,
    jenisMutasi,
  }
}

/**
 * Label badge helper untuk status transaksi penyesuaian stok
 */
export function formatStatusPenyesuaian(status: StatusPenyesuaianStok | string): {
  label: string
  color: string
} {
  switch (status) {
    case 'selesai':
      return {
        label: 'Selesai',
        color:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      }
    case 'draft':
      return {
        label: 'Draft',
        color:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      }
    case 'dibatalkan':
      return {
        label: 'Dibatalkan',
        color:
          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      }
    default:
      return {
        label: status || 'Tidak Diketahui',
        color: 'bg-muted text-muted-foreground border-border',
      }
  }
}

/**
 * Helper label untuk tipe penyesuaian stok
 */
export function formatTipePenyesuaian(tipe: TipePenyesuaianStok | string): string {
  switch (tipe) {
    case 'opname':
      return 'Stock Opname'
    case 'koreksi':
      return 'Koreksi Stok'
    case 'saldo_awal':
      return 'Saldo Awal'
    default:
      return tipe || 'Opname'
  }
}

export type { TipePenyesuaianStok, StatusPenyesuaianStok }
