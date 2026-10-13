'use client'

import * as React from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  PackageIcon,
  Coins01Icon,
  Invoice01Icon,
  Search01Icon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  formatKuantitas,
  formatRupiah,
  formatTanggalWaktuIndonesia,
} from '@/lib/utils'
import type {
  KartuStokItem,
  KartuStokSummary,
} from '@/lib/kartu-stok-csv'
import type { JenisMutasiStok } from '@/lib/validasi/produk'

export interface KartuStokTableProps {
  data: KartuStokItem[]
  ringkasan: KartuStokSummary
}

export function getBadgeVariantForMutasi(jenis: JenisMutasiStok): {
  label: string
  className: string
} {
  switch (jenis) {
    case 'saldo_awal':
      return {
        label: 'Saldo Awal',
        className:
          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      }
    case 'masuk_pembelian':
      return {
        label: 'Pembelian',
        className:
          'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      }
    case 'keluar_penjualan':
      return {
        label: 'Penjualan',
        className:
          'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      }
    case 'penyesuaian_masuk':
      return {
        label: 'Penyesuaian Masuk',
        className:
          'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      }
    case 'penyesuaian_keluar':
      return {
        label: 'Penyesuaian Keluar',
        className:
          'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      }
    case 'keluar_paket':
      return {
        label: 'Perakitan Paket',
        className:
          'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      }
    case 'retur_masuk':
      return {
        label: 'Retur Masuk',
        className:
          'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      }
    case 'retur_keluar':
      return {
        label: 'Retur Keluar',
        className:
          'bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
      }
    default:
      return {
        label: jenis,
        className: 'bg-muted text-foreground border-border',
      }
  }
}

function formatSatuanFisikTransaksi(item: KartuStokItem): string {
  const namaSatuan = item.satuan?.nama_satuan || 'Unit'
  const qty = formatKuantitas(item.kuantitas_transaksi)
  const faktor = Number(item.faktor_konversi) || 1
  const namaDasar = item.satuan_dasar?.nama_satuan || 'Pcs'

  if (faktor > 1) {
    return `${qty} ${namaSatuan} (@ ${faktor} ${namaDasar})`
  }
  return `${qty} ${namaSatuan}`
}

export function KartuStokTable({ data, ringkasan }: KartuStokTableProps) {
  return (
    <div className="space-y-4">
      {/* 1. KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Qty Masuk */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <HugeiconsIcon
              icon={ArrowDown02Icon}
              strokeWidth={1.5}
              className="size-5"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-medium">
              Total Qty Masuk
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {formatKuantitas(ringkasan.totalKuantitasMasuk)}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {formatRupiah(ringkasan.totalNilaiMasuk)}
            </div>
          </div>
        </div>

        {/* Total Qty Keluar */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <HugeiconsIcon
              icon={ArrowUp02Icon}
              strokeWidth={1.5}
              className="size-5"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-medium">
              Total Qty Keluar
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {formatKuantitas(ringkasan.totalKuantitasKeluar)}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {formatRupiah(ringkasan.totalNilaiKeluar)}
            </div>
          </div>
        </div>

        {/* Saldo Akhir Qty */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <HugeiconsIcon
              icon={PackageIcon}
              strokeWidth={1.5}
              className="size-5"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-medium">
              Saldo Akhir Qty
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {formatKuantitas(ringkasan.sisaKuantitasAkhir)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Satuan Dasar
            </div>
          </div>
        </div>

        {/* Total Nilai Persediaan Rp */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <HugeiconsIcon
              icon={Coins01Icon}
              strokeWidth={1.5}
              className="size-5"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-medium">
              Total Nilai Persediaan
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {formatRupiah(ringkasan.saldoNilaiAkhir)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Saldo Nilai Akhir
            </div>
          </div>
        </div>

        {/* HPP Rata-rata Terkini */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <HugeiconsIcon
              icon={Invoice01Icon}
              strokeWidth={1.5}
              className="size-5"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-medium">
              HPP Rata-rata Terkini
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {formatRupiah(ringkasan.hppRataRataAkhir)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Moving Average
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabel Buku Besar Kartu Stok */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-muted/50 border-b">
              <TableRow>
                <TableHead className="whitespace-nowrap font-semibold">
                  Tanggal
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold">
                  No. Referensi / Kode
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold">
                  Cabang
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold">
                  Produk
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold">
                  Jenis Mutasi
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold">
                  Satuan Fisik & Qty
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Masuk (Dasar)
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Keluar (Dasar)
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Sisa Qty
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Harga Satuan
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Masuk (Rp)
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Keluar (Rp)
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  Saldo Nilai (Rp)
                </TableHead>
                <TableHead className="whitespace-nowrap font-semibold text-right">
                  HPP Rata-rata
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className="h-44 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <HugeiconsIcon
                          icon={Search01Icon}
                          strokeWidth={1.5}
                          className="size-5"
                        />
                      </div>
                      <div className="font-semibold text-sm text-foreground">
                        Tidak Ada Catatan Mutasi Kartu Stok
                      </div>
                      <div className="text-xs max-w-sm">
                        Tidak ditemukan transaksi kartu stok yang sesuai dengan
                        filter cabang, produk, jenis mutasi, atau tanggal yang
                        dipilih.
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const badgeInfo = getBadgeVariantForMutasi(item.jenis_mutasi)
                  const namaDasar = item.satuan_dasar?.nama_satuan || 'Pcs'

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* 1. Tanggal */}
                      <TableCell className="whitespace-nowrap font-medium text-foreground">
                        {formatTanggalWaktuIndonesia(item.tanggal)}
                      </TableCell>

                      {/* 2. No. Referensi & Kode */}
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {item.nomor_referensi || '-'}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {item.kode}
                        </div>
                      </TableCell>

                      {/* 3. Cabang */}
                      <TableCell className="whitespace-nowrap">
                        <span className="font-medium">
                          {item.cabang?.nama || item.cabang_id}
                        </span>
                        {item.cabang?.kode && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({item.cabang.kode})
                          </span>
                        )}
                      </TableCell>

                      {/* 4. Produk */}
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {item.produk?.nama || item.produk_id}
                        </div>
                        {item.produk?.kode && (
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {item.produk.kode}
                          </div>
                        )}
                      </TableCell>

                      {/* 5. Jenis Mutasi */}
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 border ${badgeInfo.className}`}
                        >
                          {badgeInfo.label}
                        </Badge>
                      </TableCell>

                      {/* 6. Satuan Fisik & Qty Transaksi */}
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatSatuanFisikTransaksi(item)}
                      </TableCell>

                      {/* 7. Masuk (Qty Dasar) */}
                      <TableCell className="whitespace-nowrap text-right font-medium">
                        {item.kuantitas_masuk > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +{formatKuantitas(item.kuantitas_masuk)}{' '}
                            <span className="text-[10px] text-muted-foreground">
                              {namaDasar}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>

                      {/* 8. Keluar (Qty Dasar) */}
                      <TableCell className="whitespace-nowrap text-right font-medium">
                        {item.kuantitas_keluar > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            -{formatKuantitas(item.kuantitas_keluar)}{' '}
                            <span className="text-[10px] text-muted-foreground">
                              {namaDasar}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>

                      {/* 9. Sisa Qty (Qty Dasar) */}
                      <TableCell className="whitespace-nowrap text-right font-bold text-foreground">
                        {formatKuantitas(item.sisa_kuantitas)}{' '}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {namaDasar}
                        </span>
                      </TableCell>

                      {/* 10. Harga Satuan */}
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {formatRupiah(item.harga_satuan)}
                      </TableCell>

                      {/* 11. Masuk (Rp) */}
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {item.total_nilai_masuk > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.total_nilai_masuk)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>

                      {/* 12. Keluar (Rp) */}
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {item.total_nilai_keluar > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatRupiah(item.total_nilai_keluar)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>

                      {/* 13. Saldo Nilai (Rp) */}
                      <TableCell className="whitespace-nowrap text-right font-mono font-semibold text-foreground">
                        {formatRupiah(item.saldo_nilai)}
                      </TableCell>

                      {/* 14. HPP Rata-rata */}
                      <TableCell className="whitespace-nowrap text-right font-mono font-medium text-foreground">
                        {formatRupiah(item.hpp_rata_rata)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Ringkasan Bar */}
        {data.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/30 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                strokeWidth={1.5}
                className="size-4 text-primary"
              />
              <span>
                Menampilkan <strong>{data.length}</strong> transaksi mutasi
                kronologis. Kuantitas dinormalisasi otomatis ke satuan dasar.
              </span>
            </div>
            <div className="font-semibold text-foreground">
              Saldo Akhir Total: {formatKuantitas(ringkasan.sisaKuantitasAkhir)}{' '}
              | Nilai: {formatRupiah(ringkasan.saldoNilaiAkhir)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
