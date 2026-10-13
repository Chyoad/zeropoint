export { cn } from "cn"

/**
 * Memformat angka ke format mata uang Rupiah Indonesia (contoh: Rp 560.000)
 */
export function formatRupiah(amount: number | null | undefined): string {
  const val = Number(amount) || 0
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val)
}

/**
 * Memformat angka kuantitas dengan pemisah ribuan Indonesia (contoh: 1.250 atau 2,5)
 */
export function formatKuantitas(qty: number | null | undefined): string {
  const val = Number(qty) || 0
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(val)
}

/**
 * Memformat tanggal dan waktu ke format standar Indonesia DD/MM/YYYY HH:mm
 */
export function formatTanggalWaktuIndonesia(
  dateStr: string | Date | null | undefined
): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(",", "")
    .replace(/\./g, ":")
    .trim()
}

