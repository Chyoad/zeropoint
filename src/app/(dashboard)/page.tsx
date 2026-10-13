"use client"

import * as React from "react"
import Link from "next/link"
import { useActiveBranch } from "@/hooks/use-active-branch"
import {
  DEMO_BRANCHES,
  BranchTypeBadge,
  getBranchIcon,
} from "@/components/layout/branch-switcher"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  Coins01Icon,
  Alert02Icon,
  ArrowRight01Icon,
  Store01Icon,
  Invoice01Icon,
  Task01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

interface BranchMetric {
  totalProduk: number
  totalNilaiPersediaan: number
  stokMinimumCount: number
  statusOperasional: string
  ringkasanLokasi: string
}

const BRANCH_METRICS: Record<string, BranchMetric> = {
  all: {
    totalProduk: 12,
    totalNilaiPersediaan: 48750000,
    stokMinimumCount: 2,
    statusOperasional: "3 Fasilitas Aktif & Terkonsolidasi",
    ringkasanLokasi: "Nasional (Pusat HQ, Cabang Surabaya, Gudang Cikarang)",
  },
  "10000000-0000-0000-0000-000000000001": {
    totalProduk: 12,
    totalNilaiPersediaan: 24500000,
    stokMinimumCount: 1,
    statusOperasional: "Operasional Normal - Kantor Pusat",
    ringkasanLokasi: "Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan",
  },
  "10000000-0000-0000-0000-000000000002": {
    totalProduk: 10,
    totalNilaiPersediaan: 14250000,
    stokMinimumCount: 1,
    statusOperasional: "Operasional Normal - Retail Cabang",
    ringkasanLokasi: "Jl. Basuki Rahmat No. 45, Surabaya",
  },
  "10000000-0000-0000-0000-000000000003": {
    totalProduk: 8,
    totalNilaiPersediaan: 10000000,
    stokMinimumCount: 0,
    statusOperasional: "Operasional Normal - Hub Distribusi",
    ringkasanLokasi: "GIIC Blok C No. 12, Cikarang, Bekasi",
  },
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

const SPOTLIGHT_PRODUCTS = [
  {
    kode: "PRD-0001",
    nama: "Indomie Goreng Spesial",
    kategori: "Makanan Instan",
    tipe: "persediaan",
    satuanDasar: "Pcs",
    satuanTinggi: "Dus (40 Pcs)",
    stokTersedia: 240,
    minStok: 50,
    hppRataRata: 2800,
    status: "normal",
  },
  {
    kode: "PRD-0002",
    nama: "Kopi Kapal Api Spesial 65g",
    kategori: "Minuman",
    tipe: "persediaan",
    satuanDasar: "Bungkus",
    satuanTinggi: "Renceng (10 Bks)",
    stokTersedia: 15,
    minStok: 30,
    hppRataRata: 1500,
    status: "minimum",
  },
  {
    kode: "PRD-0003",
    nama: "Teh Botol Sosro Kotak 250ml",
    kategori: "Minuman",
    tipe: "persediaan",
    satuanDasar: "Kotak",
    satuanTinggi: "Karton (24 Ktk)",
    stokTersedia: 48,
    minStok: 24,
    hppRataRata: 3200,
    status: "normal",
  },
  {
    kode: "PRD-0004",
    nama: "Jasa Instalasi & Konsultasi",
    kategori: "Layanan Teknis",
    tipe: "jasa",
    satuanDasar: "Jam",
    satuanTinggi: "-",
    stokTersedia: null,
    minStok: null,
    hppRataRata: 75000,
    status: "jasa",
  },
  {
    kode: "PRD-0005",
    nama: "Paket Sembako Berkah",
    kategori: "Paket Bundling",
    tipe: "paket",
    satuanDasar: "Paket",
    satuanTinggi: "-",
    stokTersedia: null,
    minStok: null,
    hppRataRata: 65000,
    status: "paket",
  },
]

export default function DashboardPage() {
  const { activeBranchId } = useActiveBranch()

  const currentBranch = React.useMemo(() => {
    if (!activeBranchId) return DEMO_BRANCHES[1]
    return (
      DEMO_BRANCHES.find((b) => b.id === activeBranchId) ?? DEMO_BRANCHES[1]
    )
  }, [activeBranchId])

  const metrics = React.useMemo(() => {
    const key = currentBranch.id === "all" ? "all" : currentBranch.id
    return (
      BRANCH_METRICS[key] ?? {
        totalProduk: 12,
        totalNilaiPersediaan: 24500000,
        stokMinimumCount: 1,
        statusOperasional: "Operasional Normal",
        ringkasanLokasi: currentBranch.kota ?? "Indonesia",
      }
    )
  }, [currentBranch])

  const BranchIcon = getBranchIcon(currentBranch.tipe)

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={BranchIcon} strokeWidth={1.5} className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Ringkasan {currentBranch.nama}
              </h1>
              <BranchTypeBadge tipe={currentBranch.tipe} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {metrics.ringkasanLokasi}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/produk" />}>
            <HugeiconsIcon icon={PackageIcon} strokeWidth={1.5} className="size-4 me-1.5" />
            <span>Katalog Produk</span>
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/kartu-stok" />}>
            <HugeiconsIcon icon={Invoice01Icon} strokeWidth={1.5} className="size-4 me-1.5" />
            <span>Kartu Stok</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Produk */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Produk Aktif
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HugeiconsIcon icon={PackageIcon} strokeWidth={1.5} className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {metrics.totalProduk}{" "}
              <span className="text-sm font-normal text-muted-foreground">SKU</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Aktif</span>
              <span>• Multi-satuan siap transaksi</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Nilai Persediaan */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nilai Persediaan
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon icon={Coins01Icon} strokeWidth={1.5} className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatRupiah(metrics.totalNilaiPersediaan)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valuasi Moving Average HPP
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Peringatan Stok Minimum */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Peringatan Stok Minimum
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.5} className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {metrics.stokMinimumCount}{" "}
              <span className="text-sm font-normal text-muted-foreground">Produk</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              {metrics.stokMinimumCount > 0
                ? "Perlu pengadaan / restock segera"
                : "Semua stok di atas ambang aman"}
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Status Cabang */}
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status Cabang
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HugeiconsIcon icon={Store01Icon} strokeWidth={1.5} className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold truncate">
              {currentBranch.nama}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              <span>{metrics.statusOperasional}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Module Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/produk"
          className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <HugeiconsIcon icon={PackageIcon} strokeWidth={1.5} className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Master Produk & Multi-Satuan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Kelola katalog, multi-satuan & barcode
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={1.5}
              className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all"
            />
          </div>
        </Link>

        <Link
          href="/kartu-stok"
          className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <HugeiconsIcon icon={Invoice01Icon} strokeWidth={1.5} className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Buku Besar Kartu Stok
                </h3>
                <p className="text-xs text-muted-foreground">
                  Audit mutasi masuk, keluar & saldo HPP
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={1.5}
              className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all"
            />
          </div>
        </Link>

        <Link
          href="/penyesuaian-stok"
          className="group block rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <HugeiconsIcon icon={Task01Icon} strokeWidth={1.5} className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Penyesuaian Stok (Opname)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Koreksi selisih fisik vs saldo sistem
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={1.5}
              className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all"
            />
          </div>
        </Link>
      </div>

      {/* Spotlight Inventory Table */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Sorotan Persediaan Cabang
            </CardTitle>
            <CardDescription className="text-xs">
              Status saldo kuantitas dasar dan tiering satuan produk saat ini di{" "}
              <span className="font-medium text-foreground">{currentBranch.nama}</span>
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/produk" />}>
            <span>Lihat Semua Produk</span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="size-3.5 ms-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kode SKU</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Satuan Dasar / Multi</TableHead>
                <TableHead className="text-end">Saldo Stok</TableHead>
                <TableHead className="text-end">HPP Rata-rata</TableHead>
                <TableHead className="text-center w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SPOTLIGHT_PRODUCTS.map((prod) => (
                <TableRow key={prod.kode}>
                  <TableCell className="font-mono text-xs font-medium">
                    {prod.kode}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{prod.nama}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      Tipe: {prod.tipe}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {prod.kategori}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium">{prod.satuanDasar}</span>
                    {prod.satuanTinggi !== "-" ? (
                      <span className="text-muted-foreground"> • {prod.satuanTinggi}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-end font-mono text-sm">
                    {prod.stokTersedia !== null ? (
                      <span
                        className={
                          prod.status === "minimum"
                            ? "font-bold text-amber-600 dark:text-amber-400"
                            : "font-semibold"
                        }
                      >
                        {prod.stokTersedia} {prod.satuanDasar}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        {prod.tipe === "jasa" ? "Non-Stok" : "Dinamis"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs">
                    {formatRupiah(prod.hppRataRata)}
                  </TableCell>
                  <TableCell className="text-center">
                    {prod.status === "normal" ? (
                      <Badge
                        variant="secondary"
                        className="h-5 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                      >
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={1.5} className="size-3 me-0.5" />
                        Normal
                      </Badge>
                    ) : prod.status === "minimum" ? (
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                      >
                        <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.5} className="size-3 me-0.5" />
                        Min. Stok
                      </Badge>
                    ) : prod.status === "jasa" ? (
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                      >
                        Layanan
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                      >
                        Paket
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
