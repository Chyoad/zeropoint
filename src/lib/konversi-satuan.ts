/**
 * Normalisasi error presisi floating point IEEE 754 (misal 0.30000000000000004 -> 0.3).
 */
function normalisasiPresisi(nilai: number): number {
  return parseFloat(nilai.toPrecision(12));
}

/**
 * Mengonversi kuantitas dari satuan transaksi ke satuan dasar produk.
 *
 * Rumus: kuantitas * rasioKeDasar
 * Contoh: 5 Karton x rasio 24 = 120 Pcs
 *
 * @param kuantitas Kuantitas dalam satuan transaksi
 * @param rasioKeDasar Rasio konversi ke satuan dasar (harus > 0)
 * @returns Kuantitas yang setara dalam satuan dasar
 */
export function konversiKeSatuanDasar(kuantitas: number, rasioKeDasar: number): number {
  if (!Number.isFinite(kuantitas)) {
    throw new Error("Kuantitas harus berupa angka valid");
  }
  if (!Number.isFinite(rasioKeDasar) || rasioKeDasar <= 0) {
    throw new Error("Rasio konversi harus lebih besar dari 0");
  }

  return normalisasiPresisi(kuantitas * rasioKeDasar);
}

/**
 * Mengonversi kuantitas dari satuan dasar ke satuan transaksi target.
 *
 * Rumus: kuantitasDasar / rasioKeDasar
 * Contoh: 120 Pcs / rasio 24 = 5 Karton
 *
 * @param kuantitasDasar Kuantitas dalam satuan dasar
 * @param rasioKeDasar Rasio konversi ke satuan dasar (harus > 0)
 * @returns Kuantitas yang setara dalam satuan target
 */
export function konversiDariSatuanDasar(kuantitasDasar: number, rasioKeDasar: number): number {
  if (!Number.isFinite(kuantitasDasar)) {
    throw new Error("Kuantitas dasar harus berupa angka valid");
  }
  if (!Number.isFinite(rasioKeDasar) || rasioKeDasar <= 0) {
    throw new Error("Rasio konversi harus lebih besar dari 0");
  }

  return normalisasiPresisi(kuantitasDasar / rasioKeDasar);
}
