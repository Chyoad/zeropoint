import type {
  KartuStok,
  JenisMutasiStok,
} from '@/lib/validasi/produk'
import { formatTanggalWaktuIndonesia } from '@/lib/utils'

export interface AmbilKartuStokParams {
  cabang_id?: string | null
  produk_id?: string | null
  tanggal_mulai?: string | null
  tanggal_selesai?: string | null
  jenis_mutasi?: string | null
}

export interface KartuStokItem extends KartuStok {
  produk?: {
    id: string
    kode: string
    nama: string
    tipe_produk: string
    metode_valuasi: string
  } | null
  cabang?: {
    id: string
    kode: string
    nama: string
  } | null
  satuan?: {
    id: string
    kode: string
    nama_satuan: string
    rasio_ke_dasar: number
    is_satuan_dasar: boolean
  } | null
  satuan_dasar?: {
    id: string
    kode: string
    nama_satuan: string
  } | null
}

export interface KartuStokSummary {
  totalKuantitasMasuk: number
  totalKuantitasKeluar: number
  sisaKuantitasAkhir: number
  totalNilaiMasuk: number
  totalNilaiKeluar: number
  saldoNilaiAkhir: number
  hppRataRataAkhir: number
}

export interface BukuBesarKartuStokResult {
  data: KartuStokItem[]
  ringkasan: KartuStokSummary
}

export interface OpsiFilterKartuStok {
  daftarCabang: Array<{ id: string; kode: string; nama: string }>
  daftarProduk: Array<{
    id: string
    kode: string
    nama: string
    tipe_produk: string
  }>
}

export const LABEL_JENIS_MUTASI: Record<JenisMutasiStok, string> = {
  saldo_awal: 'Saldo Awal',
  masuk_pembelian: 'Pembelian',
  keluar_penjualan: 'Penjualan',
  penyesuaian_masuk: 'Penyesuaian Masuk',
  penyesuaian_keluar: 'Penyesuaian Keluar',
  keluar_paket: 'Perakitan Paket',
  retur_masuk: 'Retur Masuk',
  retur_keluar: 'Retur Keluar',
}

/**
 * Normalisasi floating point presisi tinggi IEEE 754
 */
export function normalisasiPresisi(nilai: number): number {
  if (!Number.isFinite(nilai)) return 0
  return parseFloat(nilai.toPrecision(12))
}

/**
 * Menghasilkan baris CSV dengan escaping koma dan tanda kutip ganda RFC-4180
 */
export function formatBarisCSV(
  cells: (string | number | null | undefined)[]
): string {
  return cells
    .map((cell) => {
      if (cell === null || cell === undefined) return '""'
      const str = String(cell).replace(/"/g, '""')
      return `"${str}"`
    })
    .join(',')
}

/**
 * Menghasilkan seluruh isi file CSV buku besar kartu stok
 */
export function buatKontenCSVKartuStok(items: KartuStokItem[]): string {
  const headers = [
    'Tanggal',
    'No. Referensi',
    'Kode Mutasi',
    'Cabang',
    'Kode Produk',
    'Nama Produk',
    'Jenis Mutasi',
    'Satuan Transaksi',
    'Qty Transaksi',
    'Faktor Konversi',
    'Masuk (Qty Dasar)',
    'Keluar (Qty Dasar)',
    'Sisa Qty (Qty Dasar)',
    'Harga Satuan (Rp)',
    'Total Masuk (Rp)',
    'Total Keluar (Rp)',
    'Saldo Nilai (Rp)',
    'HPP Rata-rata (Rp)',
    'Catatan',
  ]

  const rows = items.map((item) => {
    return formatBarisCSV([
      formatTanggalWaktuIndonesia(item.tanggal),
      item.nomor_referensi || '-',
      item.kode,
      item.cabang?.nama || item.cabang_id,
      item.produk?.kode || '-',
      item.produk?.nama || item.produk_id,
      LABEL_JENIS_MUTASI[item.jenis_mutasi] || item.jenis_mutasi,
      item.satuan?.nama_satuan || '-',
      item.kuantitas_transaksi,
      item.faktor_konversi,
      item.kuantitas_masuk,
      item.kuantitas_keluar,
      item.sisa_kuantitas,
      item.harga_satuan,
      item.total_nilai_masuk,
      item.total_nilai_keluar,
      item.saldo_nilai,
      item.hpp_rata_rata,
      item.catatan || '',
    ])
  })

  return [formatBarisCSV(headers), ...rows].join('\r\n')
}

/**
 * Memicu pengunduhan file CSV di sisi browser
 */
export function unduhCSVKartuStok(
  data: KartuStokItem[],
  namaFile = 'buku-besar-kartu-stok.csv'
) {
  if (!data || data.length === 0) {
    if (typeof window !== 'undefined') {
      alert('Tidak ada data mutasi kartu stok untuk diekspor.')
    }
    return
  }
  const csvContent = buatKontenCSVKartuStok(data)
  const blob = new Blob(['\uFEFF', csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', namaFile)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
