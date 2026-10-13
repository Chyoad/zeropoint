import { describe, it, expect, beforeEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  hitungMovingAverageRunningBalance,
  hitungRingkasanKartuStok,
  ambilBukuBesarKartuStok,
  ambilOpsiFilterKartuStok,
  formatBarisCSV,
  buatKontenCSVKartuStok,
  normalisasiPresisi,
  type KartuStokItem,
} from '@/server/queries/kartu-stok'
import { resetDemoProduk } from '@/server/queries/produk'
import { konversiKeSatuanDasar } from '@/lib/konversi-satuan'

describe('Modul Buku Besar Kartu Stok & Kalkulasi Moving Average', () => {
  beforeEach(() => {
    resetDemoProduk()
  })

  describe('1. Kalkulasi Moving Average Running Balance & Satuan Multi-Tingkat', () => {
    it('harus menghitung saldo awal secara tepat (kuantitas, total nilai, dan HPP rata-rata)', () => {
      const mutasiAwal: KartuStokItem = {
        id: 'mock-kst-1',
        kode: 'KST-0001',
        cabang_id: 'cabang-hq',
        produk_id: 'produk-a',
        tanggal: '2026-10-13T08:00:00.000Z',
        jenis_mutasi: 'saldo_awal',
        nomor_referensi: 'SA-001',
        referensi_id: null,
        satuan_produk_id: 'satuan-pcs',
        kuantitas_transaksi: 100,
        faktor_konversi: 1,
        kuantitas_masuk: 100,
        kuantitas_keluar: 0,
        sisa_kuantitas: 0,
        harga_satuan: 10000,
        total_nilai_masuk: 1000000,
        total_nilai_keluar: 0,
        saldo_nilai: 0,
        hpp_rata_rata: 0,
        batch_nomor: null,
        tanggal_kadaluarsa: null,
        kartu_stok_masuk_id: null,
        catatan: 'Saldo awal 100 pcs @ 10.000',
        created_at: '2026-10-13T08:00:00.000Z',
        updated_at: '2026-10-13T08:00:00.000Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
      }

      const hasil = hitungMovingAverageRunningBalance([mutasiAwal])
      expect(hasil).toHaveLength(1)
      expect(hasil[0].sisa_kuantitas).toBe(100)
      expect(hasil[0].saldo_nilai).toBe(1000000)
      expect(hasil[0].hpp_rata_rata).toBe(10000)
    })

    it('harus menghitung penyesuaian HPP Moving Average saat terjadi pembelian masuk (weighted average)', () => {
      // Saldo awal: 100 pcs @ Rp 10.000 = Rp 1.000.000
      // Pembelian: 50 pcs @ Rp 13.000 = Rp 650.000
      // Total Qty: 150 pcs, Total Nilai: Rp 1.650.000, HPP baru: Rp 1.650.000 / 150 = Rp 11.000
      const list: KartuStokItem[] = [
        {
          id: 'mock-1',
          kode: 'KST-0001',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T08:00:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 100,
          faktor_konversi: 1,
          kuantitas_masuk: 100,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 10000,
          total_nilai_masuk: 1000000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:00:00.000Z',
          updated_at: '2026-10-13T08:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'mock-2',
          kode: 'KST-0002',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T09:00:00.000Z',
          jenis_mutasi: 'masuk_pembelian',
          nomor_referensi: 'PO-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 50,
          faktor_konversi: 1,
          kuantitas_masuk: 50,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 13000,
          total_nilai_masuk: 650000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T09:00:00.000Z',
          updated_at: '2026-10-13T09:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const hasil = hitungMovingAverageRunningBalance(list)
      expect(hasil[1].sisa_kuantitas).toBe(150)
      expect(hasil[1].saldo_nilai).toBe(1650000)
      expect(hasil[1].hpp_rata_rata).toBe(11000)
    })

    it('harus mempertahankan HPP konstan dan memotong saldo nilai saat penjualan keluar', () => {
      // Kelanjutan dari 150 pcs @ Rp 11.000
      // Penjualan keluar: 80 pcs
      // HPP tetap Rp 11.000, Nilai Keluar: 80 * 11.000 = Rp 880.000
      // Sisa Qty: 70 pcs, Saldo Nilai: 1.650.000 - 880.000 = Rp 770.000
      const list: KartuStokItem[] = [
        {
          id: 'mock-1',
          kode: 'KST-0001',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T08:00:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 150,
          faktor_konversi: 1,
          kuantitas_masuk: 150,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 11000,
          total_nilai_masuk: 1650000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:00:00.000Z',
          updated_at: '2026-10-13T08:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'mock-2',
          kode: 'KST-0002',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T10:00:00.000Z',
          jenis_mutasi: 'keluar_penjualan',
          nomor_referensi: 'SO-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 80,
          faktor_konversi: 1,
          kuantitas_masuk: 0,
          kuantitas_keluar: 80,
          sisa_kuantitas: 0,
          harga_satuan: 0,
          total_nilai_masuk: 0,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T10:00:00.000Z',
          updated_at: '2026-10-13T10:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const hasil = hitungMovingAverageRunningBalance(list)
      expect(hasil[1].sisa_kuantitas).toBe(70)
      expect(hasil[1].total_nilai_keluar).toBe(880000)
      expect(hasil[1].saldo_nilai).toBe(770000)
      expect(hasil[1].hpp_rata_rata).toBe(11000)
    })

    it('harus menghitung penyesuaian stok masuk (surplus) dan penyesuaian stok keluar (defisit)', () => {
      // Start: 70 pcs @ Rp 11.000 (Saldo Rp 770.000)
      // Penyesuaian masuk: +10 pcs @ Rp 11.000 -> Sisa 80 pcs, Saldo Rp 880.000, HPP Rp 11.000
      // Penyesuaian keluar: -5 pcs -> Sisa 75 pcs, Saldo Rp 825.000, HPP Rp 11.000
      const list: KartuStokItem[] = [
        {
          id: 'mock-1',
          kode: 'KST-0001',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T08:00:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 70,
          faktor_konversi: 1,
          kuantitas_masuk: 70,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 11000,
          total_nilai_masuk: 770000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:00:00.000Z',
          updated_at: '2026-10-13T08:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'mock-2',
          kode: 'KST-0002',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T12:00:00.000Z',
          jenis_mutasi: 'penyesuaian_masuk',
          nomor_referensi: 'ADJ-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 10,
          faktor_konversi: 1,
          kuantitas_masuk: 10,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 11000,
          total_nilai_masuk: 110000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: 'Opname lebih',
          created_at: '2026-10-13T12:00:00.000Z',
          updated_at: '2026-10-13T12:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'mock-3',
          kode: 'KST-0003',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-a',
          tanggal: '2026-10-13T15:00:00.000Z',
          jenis_mutasi: 'penyesuaian_keluar',
          nomor_referensi: 'ADJ-002',
          referensi_id: null,
          satuan_produk_id: 'satuan-pcs',
          kuantitas_transaksi: 5,
          faktor_konversi: 1,
          kuantitas_masuk: 0,
          kuantitas_keluar: 5,
          sisa_kuantitas: 0,
          harga_satuan: 0,
          total_nilai_masuk: 0,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: 'Barang rusak',
          created_at: '2026-10-13T15:00:00.000Z',
          updated_at: '2026-10-13T15:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const hasil = hitungMovingAverageRunningBalance(list)
      // Step 2 (Penyesuaian Masuk)
      expect(hasil[1].sisa_kuantitas).toBe(80)
      expect(hasil[1].saldo_nilai).toBe(880000)
      expect(hasil[1].hpp_rata_rata).toBe(11000)

      // Step 3 (Penyesuaian Keluar)
      expect(hasil[2].sisa_kuantitas).toBe(75)
      expect(hasil[2].total_nilai_keluar).toBe(55000)
      expect(hasil[2].saldo_nilai).toBe(825000)
      expect(hasil[2].hpp_rata_rata).toBe(11000)
    })

    it('harus mengonversi kuantitas multi-satuan ke satuan dasar secara presisi tanpa error floating point', () => {
      // 5 Karton x rasio 40 = 200 Pcs
      const qtyDasar = konversiKeSatuanDasar(5, 40)
      expect(qtyDasar).toBe(200)

      // Fractional test
      const fractional = normalisasiPresisi(0.1 + 0.2)
      expect(fractional).toBe(0.3)
    })

    it('harus menangani kasus saldo stok habis (0) tanpa error NaN atau pembagian dengan nol', () => {
      const list: KartuStokItem[] = [
        {
          id: 'mock-habis-1',
          kode: 'KST-0001',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-b',
          tanggal: '2026-10-13T08:00:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-001',
          referensi_id: null,
          satuan_produk_id: 'satuan-unit',
          kuantitas_transaksi: 10,
          faktor_konversi: 1,
          kuantitas_masuk: 10,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 50000,
          total_nilai_masuk: 500000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:00:00.000Z',
          updated_at: '2026-10-13T08:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'mock-habis-2',
          kode: 'KST-0002',
          cabang_id: 'cabang-hq',
          produk_id: 'produk-b',
          tanggal: '2026-10-13T11:00:00.000Z',
          jenis_mutasi: 'keluar_penjualan',
          nomor_referensi: 'SO-002',
          referensi_id: null,
          satuan_produk_id: 'satuan-unit',
          kuantitas_transaksi: 10,
          faktor_konversi: 1,
          kuantitas_masuk: 0,
          kuantitas_keluar: 10,
          sisa_kuantitas: 0,
          harga_satuan: 0,
          total_nilai_masuk: 0,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T11:00:00.000Z',
          updated_at: '2026-10-13T11:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const hasil = hitungMovingAverageRunningBalance(list)
      expect(hasil[1].sisa_kuantitas).toBe(0)
      expect(hasil[1].saldo_nilai).toBe(0)
      expect(Number.isNaN(hasil[1].hpp_rata_rata)).toBe(false)
      expect(hasil[1].hpp_rata_rata).toBe(50000)
    })

    it('harus memisahkan akumulasi running balance untuk produk dan cabang yang berbeda', () => {
      const list: KartuStokItem[] = [
        {
          id: 'p1-c1',
          kode: 'KST-0001',
          cabang_id: 'cabang-1',
          produk_id: 'produk-1',
          tanggal: '2026-10-13T08:00:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-1',
          referensi_id: null,
          satuan_produk_id: null,
          kuantitas_transaksi: 100,
          faktor_konversi: 1,
          kuantitas_masuk: 100,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 1000,
          total_nilai_masuk: 100000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:00:00.000Z',
          updated_at: '2026-10-13T08:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'p1-c2',
          kode: 'KST-0002',
          cabang_id: 'cabang-2',
          produk_id: 'produk-1',
          tanggal: '2026-10-13T08:05:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-2',
          referensi_id: null,
          satuan_produk_id: null,
          kuantitas_transaksi: 200,
          faktor_konversi: 1,
          kuantitas_masuk: 200,
          kuantitas_keluar: 0,
          sisa_kuantitas: 0,
          harga_satuan: 1200,
          total_nilai_masuk: 240000,
          total_nilai_keluar: 0,
          saldo_nilai: 0,
          hpp_rata_rata: 0,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:05:00.000Z',
          updated_at: '2026-10-13T08:05:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const hasil = hitungMovingAverageRunningBalance(list)
      expect(hasil[0].sisa_kuantitas).toBe(100)
      expect(hasil[0].hpp_rata_rata).toBe(1000)

      expect(hasil[1].sisa_kuantitas).toBe(200)
      expect(hasil[1].hpp_rata_rata).toBe(1200)
    })
  })

  describe('2. Kalkulasi Ringkasan KPI Ledger (hitungRingkasanKartuStok)', () => {
    it('harus menghitung total masuk, keluar, sisa akhir, dan HPP tertimbang secara akurat', () => {
      const list: KartuStokItem[] = [
        {
          id: 'r-1',
          kode: 'KST-001',
          cabang_id: 'c1',
          produk_id: 'p1',
          tanggal: '2026-10-13T08:00:00.000Z',
          jenis_mutasi: 'saldo_awal',
          nomor_referensi: 'SA-1',
          referensi_id: null,
          satuan_produk_id: null,
          kuantitas_transaksi: 100,
          faktor_konversi: 1,
          kuantitas_masuk: 100,
          kuantitas_keluar: 0,
          sisa_kuantitas: 100,
          harga_satuan: 10000,
          total_nilai_masuk: 1000000,
          total_nilai_keluar: 0,
          saldo_nilai: 1000000,
          hpp_rata_rata: 10000,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T08:00:00.000Z',
          updated_at: '2026-10-13T08:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'r-2',
          kode: 'KST-002',
          cabang_id: 'c1',
          produk_id: 'p1',
          tanggal: '2026-10-13T10:00:00.000Z',
          jenis_mutasi: 'keluar_penjualan',
          nomor_referensi: 'SO-1',
          referensi_id: null,
          satuan_produk_id: null,
          kuantitas_transaksi: 30,
          faktor_konversi: 1,
          kuantitas_masuk: 0,
          kuantitas_keluar: 30,
          sisa_kuantitas: 70,
          harga_satuan: 10000,
          total_nilai_masuk: 0,
          total_nilai_keluar: 300000,
          saldo_nilai: 700000,
          hpp_rata_rata: 10000,
          batch_nomor: null,
          tanggal_kadaluarsa: null,
          kartu_stok_masuk_id: null,
          catatan: null,
          created_at: '2026-10-13T10:00:00.000Z',
          updated_at: '2026-10-13T10:00:00.000Z',
          created_by: null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const summary = hitungRingkasanKartuStok(list)
      expect(summary.totalKuantitasMasuk).toBe(100)
      expect(summary.totalKuantitasKeluar).toBe(30)
      expect(summary.sisaKuantitasAkhir).toBe(70)
      expect(summary.totalNilaiMasuk).toBe(1000000)
      expect(summary.totalNilaiKeluar).toBe(300000)
      expect(summary.saldoNilaiAkhir).toBe(700000)
      expect(summary.hppRataRataAkhir).toBe(10000)
    })
  })

  describe('3. Query Filter Buku Besar Kartu Stok (ambilBukuBesarKartuStok & ambilOpsiFilterKartuStok)', () => {
    it('harus mengembalikan seluruh mutasi kronologis saat filter cabang=all dan produk=all', async () => {
      const res = await ambilBukuBesarKartuStok({
        cabang_id: 'all',
        produk_id: 'all',
      })

      expect(res.data).toBeDefined()
      expect(res.data.length).toBeGreaterThanOrEqual(4)
      expect(res.ringkasan).toBeDefined()
      expect(res.ringkasan.totalKuantitasMasuk).toBeGreaterThan(0)
    })

    it('harus memfilter mutasi berdasarkan cabang_id tertentu', async () => {
      const targetCabangHQ = '10000000-0000-0000-0000-000000000001'
      const res = await ambilBukuBesarKartuStok({ cabang_id: targetCabangHQ })

      expect(res.data.length).toBeGreaterThan(0)
      for (const item of res.data) {
        expect(item.cabang_id).toBe(targetCabangHQ)
      }
    })

    it('harus memfilter mutasi berdasarkan produk_id tertentu', async () => {
      const targetProdukIndomie = '40000000-0000-0000-0000-000000000001'
      const res = await ambilBukuBesarKartuStok({ produk_id: targetProdukIndomie })

      expect(res.data.length).toBeGreaterThan(0)
      for (const item of res.data) {
        expect(item.produk_id).toBe(targetProdukIndomie)
      }
    })

    it('harus memfilter mutasi berdasarkan jenis_mutasi tertentu', async () => {
      const res = await ambilBukuBesarKartuStok({ jenis_mutasi: 'saldo_awal' })

      expect(res.data.length).toBeGreaterThan(0)
      for (const item of res.data) {
        expect(item.jenis_mutasi).toBe('saldo_awal')
      }
    })

    it('harus memfilter mutasi berdasarkan rentang tanggal', async () => {
      const res = await ambilBukuBesarKartuStok({
        tanggal_mulai: '2026-10-13',
        tanggal_selesai: '2026-10-13',
      })

      expect(res.data.length).toBeGreaterThan(0)
      for (const item of res.data) {
        expect(item.tanggal.startsWith('2026-10-13')).toBe(true)
      }
    })

    it('harus mengembalikan opsi filter cabang aktif dan produk aktif melalui ambilOpsiFilterKartuStok', async () => {
      const opsi = await ambilOpsiFilterKartuStok()
      expect(opsi.daftarCabang).toBeDefined()
      expect(opsi.daftarCabang.length).toBeGreaterThan(0)
      expect(opsi.daftarCabang[0]).toHaveProperty('id')
      expect(opsi.daftarCabang[0]).toHaveProperty('nama')

      expect(opsi.daftarProduk).toBeDefined()
      expect(opsi.daftarProduk.length).toBeGreaterThan(0)
      expect(opsi.daftarProduk[0]).toHaveProperty('id')
      expect(opsi.daftarProduk[0]).toHaveProperty('nama')
    })
    it('harus mengembalikan mutasi semua cabang saat cabang_id adalah "all" atau undefined', async () => {
      const resAll = await ambilBukuBesarKartuStok({ cabang_id: 'all' })
      const resUndefined = await ambilBukuBesarKartuStok({ cabang_id: undefined })

      expect(resAll.data.length).toBe(resUndefined.data.length)

      const cabangIds = new Set(resAll.data.map((d) => d.cabang_id))
      expect(cabangIds.size).toBeGreaterThan(1)
    })

    it('harus menjaga konsistensi sisa kuantitas dan HPP saat filter jenis_mutasi aktif (tidak menghitung dari 0)', async () => {
      const resPenjualan = await ambilBukuBesarKartuStok({
        jenis_mutasi: 'keluar_penjualan',
      })

      expect(resPenjualan.data.length).toBeGreaterThan(0)
      for (const item of resPenjualan.data) {
        expect(item.jenis_mutasi).toBe('keluar_penjualan')
        // Sisa kuantitas tidak boleh negatif dan HPP harus positif (tidak dihitung ulang dari 0)
        expect(item.sisa_kuantitas).toBeGreaterThan(0)
        expect(item.hpp_rata_rata).toBeGreaterThan(0)
      }
    })
  })

  describe('4. Ekspor File CSV (buatKontenCSVKartuStok & formatBarisCSV)', () => {
    it('harus memformat baris CSV dengan kutipan ganda dan escaping koma yang valid', () => {
      const baris = formatBarisCSV(['Item A', '100', 'Catatan, ada koma', 'Kutipan "ganda"'])
      expect(baris).toBe('"Item A","100","Catatan, ada koma","Kutipan ""ganda"""')
    })

    it('harus menyertakan seluruh 19 kolom header standar pada file CSV kartu stok', async () => {
      const res = await ambilBukuBesarKartuStok({ cabang_id: 'all' })
      const csv = buatKontenCSVKartuStok(res.data)

      expect(csv).toContain('"Tanggal"')
      expect(csv).toContain('"No. Referensi"')
      expect(csv).toContain('"Kode Mutasi"')
      expect(csv).toContain('"Cabang"')
      expect(csv).toContain('"Kode Produk"')
      expect(csv).toContain('"Nama Produk"')
      expect(csv).toContain('"Jenis Mutasi"')
      expect(csv).toContain('"Satuan Transaksi"')
      expect(csv).toContain('"Qty Transaksi"')
      expect(csv).toContain('"Faktor Konversi"')
      expect(csv).toContain('"Masuk (Qty Dasar)"')
      expect(csv).toContain('"Keluar (Qty Dasar)"')
      expect(csv).toContain('"Sisa Qty (Qty Dasar)"')
      expect(csv).toContain('"Harga Satuan (Rp)"')
      expect(csv).toContain('"Total Masuk (Rp)"')
      expect(csv).toContain('"Total Keluar (Rp)"')
      expect(csv).toContain('"Saldo Nilai (Rp)"')
      expect(csv).toContain('"HPP Rata-rata (Rp)"')
      expect(csv).toContain('"Catatan"')
    })
  })

  describe('5. Audit Zero Lucide-React & Konsistensi UI', () => {
    it('harus memformat tanggal waktu Indonesia secara konsisten dalam zona waktu WIB (Asia/Jakarta)', async () => {
      const { formatTanggalWaktuIndonesia } = await import('@/lib/utils')
      const formatted = formatTanggalWaktuIndonesia('2026-10-13T08:30:00.000Z')
      expect(formatted).toBe('13/10/2026 15:30')
    })

    it('harus memastikan tidak ada dependensi atau impor lucide-react pada modul kartu stok dan seluruh komponen terkait', () => {
      const filesToCheck = [
        path.join(process.cwd(), 'src/server/queries/kartu-stok.ts'),
        path.join(process.cwd(), 'src/lib/kartu-stok-csv.ts'),
        path.join(process.cwd(), 'src/components/kartu-stok/kartu-stok-filter.tsx'),
        path.join(process.cwd(), 'src/components/kartu-stok/kartu-stok-table.tsx'),
        path.join(process.cwd(), 'src/app/(dashboard)/kartu-stok/page.tsx'),
      ]

      for (const filePath of filesToCheck) {
        expect(fs.existsSync(filePath), `File ${filePath} harus ada`).toBe(true)
        const content = fs.readFileSync(filePath, 'utf-8')
        expect(
          content.includes('lucide-react'),
          `File ${filePath} tidak boleh mengimpor lucide-react`
        ).toBe(false)
        expect(
          content.includes('@hugeicons/react') ||
            content.includes('@hugeicons/core-free-icons') ||
            !content.includes('Icon'),
          `File ${filePath} harus menggunakan Hugeicons jika memuat ikon`
        ).toBe(true)
      }
    })
  })
})
