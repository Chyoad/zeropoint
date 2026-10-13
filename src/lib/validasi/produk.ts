import { z } from 'zod'
import type {
  Database,
  TipeProduk,
  MetodeValuasi,
  JenisMutasiStok,
} from '@/types/database.types'

export type Produk = Database['public']['Tables']['produk']['Row']
export type SatuanProduk = Database['public']['Tables']['satuan_produk']['Row']
export type KomponenPaket = Database['public']['Tables']['komponen_paket']['Row']
export type StokProduk = Database['public']['Tables']['stok_produk']['Row']
export type KartuStok = Database['public']['Tables']['kartu_stok']['Row']
export type KategoriProduk = Database['public']['Tables']['kategori_produk']['Row']
export type Cabang = Database['public']['Tables']['cabang']['Row']

export const tipeProdukEnum = z.enum([
  'persediaan',
  'non_persediaan',
  'jasa',
  'paket',
] as const)

export const metodeValuasiEnum = z.enum(['rata_rata', 'fifo'] as const)

export const satuanItemSchema = z.object({
  id: z.string().optional(),
  kode: z.string().optional(),
  nama_satuan: z
    .string({
      error: () => 'Nama satuan wajib diisi',
    })
    .trim()
    .min(1, 'Nama satuan tidak boleh kosong'),
  rasio_ke_dasar: z.coerce
    .number({
      error: () => 'Rasio harus berupa angka',
    })
    .positive('Rasio ke dasar harus lebih besar dari 0'),
  is_satuan_dasar: z.boolean().default(false),
  barcode: z.string().trim().optional().nullable(),
  harga_jual_default: z.coerce
    .number()
    .min(0, 'Harga jual tidak boleh negatif')
    .default(0),
  harga_jual_grosir: z.coerce
    .number()
    .min(0, 'Harga grosir tidak boleh negatif')
    .default(0),
  harga_jual_member: z.coerce
    .number()
    .min(0, 'Harga member tidak boleh negatif')
    .default(0),
})

export const komponenPaketItemSchema = z.object({
  id: z.string().optional(),
  kode: z.string().optional(),
  produk_komponen_id: z.string().min(1, 'Komponen produk wajib dipilih'),
  satuan_produk_id: z.string().optional().nullable(),
  kuantitas: z.coerce
    .number({
      error: () => 'Kuantitas harus berupa angka',
    })
    .positive('Kuantitas komponen harus lebih besar dari 0'),
})

export const saldoAwalCabangItemSchema = z.object({
  cabang_id: z.string().min(1, 'Cabang wajib dipilih'),
  kuantitas: z.coerce
    .number()
    .min(0, 'Kuantitas saldo awal tidak boleh negatif')
    .default(0),
  harga_pokok: z.coerce
    .number()
    .min(0, 'Harga pokok saldo awal tidak boleh negatif')
    .default(0),
})

export const produkSchema = z
  .object({
    nama: z
      .string({
        error: (issue) =>
          issue.code === 'invalid_type'
            ? 'Nama produk harus berupa teks'
            : undefined,
      })
      .trim()
      .min(2, 'Nama produk minimal 2 karakter'),
    tipe_produk: tipeProdukEnum,
    metode_valuasi: metodeValuasiEnum.default('rata_rata'),
    kategori_produk_id: z.string().optional().nullable(),
    harga_pokok_standar: z.coerce.number().min(0).default(0),
    harga_beli_terakhir: z.coerce.number().min(0).default(0),
    peringatan_stok_minimum: z.coerce.number().min(0).default(0),
    dapat_dijual: z.boolean().default(true),
    dapat_dibeli: z.boolean().default(true),
    gambar_url: z.string().optional().nullable(),
    deskripsi: z.string().optional().nullable(),
    is_aktif: z.boolean().default(true),
    satuan: z
      .array(satuanItemSchema)
      .min(1, 'Minimal satu satuan produk wajib diisi'),
    komponen: z.array(komponenPaketItemSchema).default([]),
    saldo_awal: z.array(saldoAwalCabangItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // 1. Validasi Satuan: Array satuan wajib minimal 1
    if (!data.satuan || data.satuan.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal satu satuan produk wajib diisi',
        path: ['satuan'],
      })
      return
    }

    // 2. Hitung jumlah satuan dasar
    const satuanDasarList = data.satuan.filter((s) => s.is_satuan_dasar)
    if (satuanDasarList.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wajib memilih satu satuan dasar (is_satuan_dasar: true)',
        path: ['satuan'],
      })
    } else if (satuanDasarList.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hanya boleh ada satu satuan dasar untuk satu produk',
        path: ['satuan'],
      })
    }

    // 3. Validasi rasio satuan dasar dan bertingkat
    const namaSatuanSet = new Set<string>()
    data.satuan.forEach((s, idx) => {
      const namaLower = s.nama_satuan.trim().toLowerCase()
      if (namaSatuanSet.has(namaLower)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Nama satuan "${s.nama_satuan}" tidak boleh duplikat`,
          path: ['satuan', idx, 'nama_satuan'],
        })
      } else {
        namaSatuanSet.add(namaLower)
      }

      if (s.is_satuan_dasar) {
        if (s.rasio_ke_dasar !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Rasio satuan dasar harus bernilai 1',
            path: ['satuan', idx, 'rasio_ke_dasar'],
          })
        }
      } else {
        if (s.rasio_ke_dasar <= 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Rasio satuan bertingkat harus lebih besar dari 1 terhadap satuan dasar',
            path: ['satuan', idx, 'rasio_ke_dasar'],
          })
        }
      }
    })

    // 4. Validasi Komponen Paket jika tipe = 'paket'
    if (data.tipe_produk === 'paket') {
      if (!data.komponen || data.komponen.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Produk tipe paket wajib memiliki minimal 1 komponen penyusun',
          path: ['komponen'],
        })
      } else {
        data.komponen.forEach((k, idx) => {
          if (!k.produk_komponen_id) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Komponen produk wajib dipilih',
              path: ['komponen', idx, 'produk_komponen_id'],
            })
          }
          if (k.kuantitas <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Kuantitas komponen harus lebih besar dari 0',
              path: ['komponen', idx, 'kuantitas'],
            })
          }
        })
      }
    }
  })

export type ProdukInput = z.infer<typeof produkSchema>
export type ProdukFormInput = z.input<typeof produkSchema>
export type SatuanItemInput = z.infer<typeof satuanItemSchema>
export type KomponenPaketItemInput = z.infer<typeof komponenPaketItemSchema>
export type SaldoAwalCabangItemInput = z.infer<typeof saldoAwalCabangItemSchema>

export interface ProdukWithRelations extends Produk {
  kategori?: KategoriProduk | null
  satuan_dasar?: SatuanProduk | null
  satuan?: SatuanProduk[]
  komponen?: (KomponenPaket & {
    produk_komponen?: Produk | null
    satuan?: SatuanProduk | null
  })[]
  stok?: (StokProduk & {
    cabang?: Cabang | null
  })[]
  total_stok?: number
}

export type { TipeProduk, MetodeValuasi, JenisMutasiStok }
