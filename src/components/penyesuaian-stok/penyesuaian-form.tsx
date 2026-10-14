'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  FloppyDiskIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  ArrowReloadHorizontalIcon,
  Add01Icon,
  Delete02Icon,
  Building04Icon,
  Calendar03Icon,
  InformationCircleIcon,
  Task01Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatKuantitas,
  formatRupiah,
  formatTanggalWaktuIndonesia,
} from '@/lib/utils'
import {
  hitungSelisihOpname,
  type PenyesuaianStokFormInput,
  type TipePenyesuaianStok,
} from '@/lib/validasi/penyesuaian-stok'
import type { Cabang } from '@/lib/validasi/cabang'
import type {
  PenyesuaianStokDetail,
  ProdukStokBuku,
} from '@/server/queries/penyesuaian-stok'
import {
  simpanPenyesuaianStokAction,
  selesaikanPenyesuaianStokAction,
  batalkanPenyesuaianStokAction,
  muatStokBukuAction,
} from '@/server/actions/penyesuaian-stok'
import { useActiveBranch } from '@/hooks/use-active-branch'

export interface PenyesuaianFormItem {
  id?: string
  produk_id: string
  kode_produk: string
  nama_produk: string
  satuan_produk_id: string | null
  nama_satuan: string
  stok_buku: number
  stok_fisik: number
  harga_satuan: number
  alasan: string
}

export interface PenyesuaianFormProps {
  cabangList: Cabang[]
  initialData?: PenyesuaianStokDetail | null
  isReadOnly?: boolean
  availableProducts?: ProdukStokBuku[]
}

export function PenyesuaianForm({
  cabangList,
  initialData,
  isReadOnly = false,
  availableProducts = [],
}: PenyesuaianFormProps) {
  const router = useRouter()
  const { activeBranchId } = useActiveBranch()

  // Inisialisasi cabang: gunakan initialData jika ada, atau activeBranch, atau cabang pertama
  const defaultCabangId = React.useMemo(() => {
    if (initialData?.cabang_id) return initialData.cabang_id
    if (activeBranchId && activeBranchId !== 'all') {
      const match = cabangList.find((c) => c.id === activeBranchId)
      if (match) return match.id
    }
    return cabangList[0]?.id || ''
  }, [initialData, activeBranchId, cabangList])

  const [cabangId, setCabangId] = React.useState<string>(defaultCabangId)
  const [tanggal, setTanggal] = React.useState<string>(() => {
    if (initialData?.tanggal) {
      const d = new Date(initialData.tanggal)
      return d.toISOString().slice(0, 16)
    }
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [tipePenyesuaian, setTipePenyesuaian] =
    React.useState<TipePenyesuaianStok>(
      (initialData?.tipe_penyesuaian as TipePenyesuaianStok) || 'opname'
    )
  const [catatan, setCatatan] = React.useState<string>(
    initialData?.catatan || ''
  )

  // Items form state
  const [items, setItems] = React.useState<PenyesuaianFormItem[]>(() => {
    if (initialData?.items && initialData.items.length > 0) {
      return initialData.items.map((it) => ({
        id: it.id,
        produk_id: it.produk_id,
        kode_produk: it.produk?.kode || 'PRD',
        nama_produk: it.produk?.nama || 'Produk',
        satuan_produk_id: it.satuan_produk_id || null,
        nama_satuan: it.satuan_produk?.nama_satuan || 'Pcs',
        stok_buku: it.stok_buku,
        stok_fisik: it.stok_fisik,
        harga_satuan: it.harga_satuan,
        alasan: it.alasan || '',
      }))
    }
    return []
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoadingStokBuku, setIsLoadingStokBuku] = React.useState(false)
  const [productsInBranch, setProductsInBranch] =
    React.useState<ProdukStokBuku[]>(availableProducts)

  // Handler saat ganti cabang: sinkronkan daftar produk & stok buku
  const handleGantiCabang = async (newCabangId: string) => {
    setCabangId(newCabangId)
    setItems([]) // Reset items saat cabang berganti
    if (newCabangId) {
      try {
        const res = await muatStokBukuAction(newCabangId)
        if (res.success && res.data) {
          setProductsInBranch(res.data)
        }
      } catch {
        // Abaikan error background sync
      }
    }
  }

  // Muat Stok Buku Otomatis untuk cabang terpilih
  const handleMuatStokBuku = async () => {
    if (!cabangId) {
      toast.error('Pilih cabang terlebih dahulu')
      return
    }

    setIsLoadingStokBuku(true)
    try {
      const res = await muatStokBukuAction(cabangId)
      if (res.success && res.data) {
        setProductsInBranch(res.data)
        if (res.data.length === 0) {
          toast.info('Tidak ada produk persediaan aktif di cabang ini')
          return
        }

        const newItems: PenyesuaianFormItem[] = res.data.map((p) => ({
          produk_id: p.produk_id,
          kode_produk: p.kode_produk,
          nama_produk: p.nama_produk,
          satuan_produk_id: p.satuan_produk_id,
          nama_satuan: p.nama_satuan,
          stok_buku: p.stok_buku,
          stok_fisik: p.stok_buku, // Default sama dengan stok buku
          harga_satuan: p.harga_satuan,
          alasan: '',
        }))

        setItems(newItems)
        toast.success(
          `Berhasil memuat ${newItems.length} produk persediaan dari fasilitas terpilih.`
        )
      } else {
        toast.error(res.error || 'Gagal memuat stok buku')
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat stok buku')
    } finally {
      setIsLoadingStokBuku(false)
    }
  }

  // Update stok fisik per baris
  const handleUpdateStokFisik = (index: number, val: string) => {
    const num = parseFloat(val)
    const safeVal = isNaN(num) || num < 0 ? 0 : num
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], stok_fisik: safeVal }
      return copy
    })
  }

  // Update alasan per baris
  const handleUpdateAlasan = (index: number, val: string) => {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], alasan: val }
      return copy
    })
  }

  // Hapus baris item
  const handleHapusBaris = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Tambah item manual dari dropdown productsInBranch
  const handleTambahItemManual = (produkId: string) => {
    const prod = productsInBranch.find((p) => p.produk_id === produkId)
    if (!prod) return

    // Cek apakah produk sudah ada di tabel
    const exists = items.some((it) => it.produk_id === produkId)
    if (exists) {
      toast.error('Produk sudah ada di dalam tabel')
      return
    }

    setItems((prev) => [
      ...prev,
      {
        produk_id: prod.produk_id,
        kode_produk: prod.kode_produk,
        nama_produk: prod.nama_produk,
        satuan_produk_id: prod.satuan_produk_id,
        nama_satuan: prod.nama_satuan,
        stok_buku: prod.stok_buku,
        stok_fisik: prod.stok_buku,
        harga_satuan: prod.harga_satuan,
        alasan: '',
      },
    ])
  }

  // Kalkulasi agregat selisih & total nilai
  const kalkulasiRingkasan = React.useMemo(() => {
    let totalSelisihFisik = 0
    let totalNilaiSelisih = 0
    let itemPlus = 0
    let itemMinus = 0
    let itemCocok = 0

    items.forEach((it) => {
      const { selisih, totalNilaiSelisih: nilai } = hitungSelisihOpname(
        it.stok_buku,
        it.stok_fisik,
        it.harga_satuan
      )
      totalSelisihFisik += selisih
      totalNilaiSelisih += nilai

      if (selisih > 0) itemPlus++
      else if (selisih < 0) itemMinus++
      else itemCocok++
    })

    return {
      totalSelisihFisik: parseFloat(totalSelisihFisik.toPrecision(12)),
      totalNilaiSelisih: parseFloat(totalNilaiSelisih.toPrecision(12)),
      itemPlus,
      itemMinus,
      itemCocok,
      totalItem: items.length,
    }
  }, [items])

  // Simpan form (draft atau selesai)
  const handleSubmit = async (status: 'draft' | 'selesai') => {
    if (!cabangId) {
      toast.error('Cabang wajib dipilih.')
      return
    }
    if (items.length === 0) {
      toast.error('Minimal 1 item penyesuaian stok harus dimasukkan ke tabel.')
      return
    }

    setIsSubmitting(true)

    const payload: PenyesuaianStokFormInput = {
      cabang_id: cabangId,
      tanggal: new Date(tanggal).toISOString(),
      tipe_penyesuaian: tipePenyesuaian,
      status: status,
      catatan: catatan.trim() || null,
      items: items.map((it) => ({
        id: it.id,
        produk_id: it.produk_id,
        satuan_produk_id: it.satuan_produk_id,
        stok_buku: it.stok_buku,
        stok_fisik: it.stok_fisik,
        harga_satuan: it.harga_satuan,
        alasan: it.alasan.trim() || null,
      })),
    }

    try {
      const res = await simpanPenyesuaianStokAction(payload, initialData?.id)
      if (res.success && res.data) {
        toast.success(
          status === 'selesai'
            ? `Penyesuaian stok (${res.data.kode}) berhasil diselesaikan & mutasi stok telah dibukukan!`
            : `Draft penyesuaian stok (${res.data.kode}) berhasil disimpan.`
        )
        router.push(`/penyesuaian-stok/${res.data.id}`)
      } else {
        toast.error(res.error || 'Gagal menyimpan penyesuaian stok.')
      }
    } catch {
      toast.error('Terjadi kesalahan tak terduga saat menyimpan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Finalisasi langsung dari detail draft
  const handleFinalisasiDraft = async () => {
    if (!initialData?.id) return
    setIsSubmitting(true)
    try {
      const res = await selesaikanPenyesuaianStokAction(initialData.id)
      if (res.success) {
        toast.success('Penyesuaian stok berhasil diselesaikan!')
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menyelesaikan penyesuaian stok.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyelesaikan draft.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Batalkan draft
  const handleBatalkanDraft = async () => {
    if (!initialData?.id) return
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi opname ini?')) {
      return
    }
    setIsSubmitting(true)
    try {
      const res = await batalkanPenyesuaianStokAction(initialData.id)
      if (res.success) {
        toast.success('Penyesuaian stok berhasil dibatalkan.')
        router.push('/penyesuaian-stok')
      } else {
        toast.error(res.error || 'Gagal membatalkan penyesuaian stok.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat membatalkan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-card border rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon
                icon={Task01Icon}
                size={20}
                strokeWidth={1.5}
                className="text-primary"
              />
              {initialData ? `Dokumen: ${initialData.kode}` : 'Buat Stock Opname Baru'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sesuaikan kuantitas fisik gudang dengan stok buku akuntansi secara presisi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/penyesuaian-stok">
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} />
                Kembali ke Daftar
              </Button>
            </Link>
          </div>
        </div>

        {/* Form Header Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Cabang */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={Building04Icon} size={14} strokeWidth={1.5} />
              Fasilitas / Cabang <span className="text-destructive">*</span>
            </label>
            <select
              value={cabangId}
              disabled={isReadOnly || !!initialData}
              onChange={(e) => handleGantiCabang(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {cabangList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.tipe})
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={Calendar03Icon} size={14} strokeWidth={1.5} />
              Tanggal & Waktu Opname <span className="text-destructive">*</span>
            </label>
            <Input
              type="datetime-local"
              value={tanggal}
              disabled={isReadOnly}
              onChange={(e) => setTanggal(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Tipe Penyesuaian */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Tipe Penyesuaian
            </label>
            <select
              value={tipePenyesuaian}
              disabled={isReadOnly}
              onChange={(e) =>
                setTipePenyesuaian(e.target.value as TipePenyesuaianStok)
              }
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-70"
            >
              <option value="opname">Stock Opname Fisik</option>
              <option value="koreksi">Koreksi Stok / Kerusakan</option>
              <option value="saldo_awal">Penetapan Saldo Awal</option>
            </select>
          </div>
        </div>

        {/* Catatan */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Catatan / Alasan Pemeriksaan (Opsional)
          </label>
          <Input
            placeholder="Contoh: Audit fisik stok triwulanan rak display A dan B..."
            value={catatan}
            disabled={isReadOnly}
            onChange={(e) => setCatatan(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Items Section Toolbar */}
      <div className="bg-card border rounded-lg p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Daftar Barang & Hasil Audit Fisik
            </h3>
            <p className="text-xs text-muted-foreground">
              Masukkan jumlah fisik hasil perhitungan riil. Sistem akan menghitung
              selisih kuantitas dan nilai secara otomatis.
            </p>
          </div>

          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Muat Stok Buku Otomatis */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMuatStokBuku}
                disabled={isLoadingStokBuku || isSubmitting}
                className="h-8 gap-1.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/5"
              >
                <HugeiconsIcon
                  icon={ArrowReloadHorizontalIcon}
                  size={14}
                  strokeWidth={1.5}
                  className={isLoadingStokBuku ? 'animate-spin' : ''}
                />
                {isLoadingStokBuku
                  ? 'Memuat Stok Buku...'
                  : 'Muat Stok Buku Otomatis'}
              </Button>

              {/* Tambah Baris Manual (opsional jika ada daftar produk) */}
              {productsInBranch.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleTambahItemManual(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      + Tambah Produk Manual...
                    </option>
                    {productsInBranch.map((p) => (
                      <option key={p.produk_id} value={p.produk_id}>
                        {p.nama_produk} ({p.kode_produk})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabel Input Item Opname */}
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-[40px] text-center">No</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead className="w-[100px]">Satuan</TableHead>
                <TableHead className="w-[120px] text-right">Stok Buku</TableHead>
                <TableHead className="w-[150px] text-right">Stok Fisik</TableHead>
                <TableHead className="w-[130px] text-center">Selisih</TableHead>
                <TableHead className="w-[130px] text-right">Harga Pokok</TableHead>
                <TableHead className="w-[140px] text-right">Total Nilai Selisih</TableHead>
                <TableHead className="w-[200px]">Alasan Selisih</TableHead>
                {!isReadOnly && <TableHead className="w-[50px] text-center"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isReadOnly ? 9 : 10}
                    className="h-36 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <HugeiconsIcon
                        icon={Task01Icon}
                        size={28}
                        strokeWidth={1.5}
                        className="opacity-40"
                      />
                      <p className="text-xs font-medium">Belum ada item opname</p>
                      {!isReadOnly && (
                        <p className="text-[11px] text-muted-foreground">
                          Klik tombol{' '}
                          <span className="font-semibold text-primary">
                            &ldquo;Muat Stok Buku Otomatis&rdquo;
                          </span>{' '}
                          di atas untuk mengisi daftar barang dari cabang terpilih.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it, idx) => {
                  const { selisih, totalNilaiSelisih } = hitungSelisihOpname(
                    it.stok_buku,
                    it.stok_fisik,
                    it.harga_satuan
                  )

                  return (
                    <TableRow key={it.produk_id || idx} className="hover:bg-muted/30">
                      {/* No */}
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>

                      {/* Produk */}
                      <TableCell>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {it.nama_produk}
                          </p>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {it.kode_produk}
                          </span>
                        </div>
                      </TableCell>

                      {/* Satuan */}
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[11px]">
                          {it.nama_satuan}
                        </Badge>
                      </TableCell>

                      {/* Stok Buku */}
                      <TableCell className="text-right font-mono text-xs font-medium">
                        {formatKuantitas(it.stok_buku)}
                      </TableCell>

                      {/* Stok Fisik Input */}
                      <TableCell className="text-right">
                        {isReadOnly ? (
                          <span className="font-mono text-xs font-bold text-foreground">
                            {formatKuantitas(it.stok_fisik)}
                          </span>
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={it.stok_fisik}
                            onChange={(e) =>
                              handleUpdateStokFisik(idx, e.target.value)
                            }
                            className="h-8 text-right font-mono text-xs w-[120px] ml-auto"
                          />
                        )}
                      </TableCell>

                      {/* Selisih Real-time Indicator dengan Warna */}
                      <TableCell className="text-center">
                        {selisih > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            +{formatKuantitas(selisih)}
                          </span>
                        ) : selisih < 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                            {formatKuantitas(selisih)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border">
                            0
                          </span>
                        )}
                      </TableCell>

                      {/* Harga Satuan */}
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {formatRupiah(it.harga_satuan)}
                      </TableCell>

                      {/* Total Nilai Selisih */}
                      <TableCell className="text-right font-mono text-xs">
                        {totalNilaiSelisih > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{formatRupiah(totalNilaiSelisih)}
                          </span>
                        ) : totalNilaiSelisih < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            {formatRupiah(totalNilaiSelisih)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatRupiah(0)}
                          </span>
                        )}
                      </TableCell>

                      {/* Alasan */}
                      <TableCell>
                        {isReadOnly ? (
                          <span className="text-xs text-muted-foreground">
                            {it.alasan || '-'}
                          </span>
                        ) : (
                          <Input
                            placeholder="Alasan selisih..."
                            value={it.alasan}
                            onChange={(e) => handleUpdateAlasan(idx, e.target.value)}
                            className="h-8 text-xs"
                          />
                        )}
                      </TableCell>

                      {/* Tombol Hapus Baris */}
                      {!isReadOnly && (
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleHapusBaris(idx)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Hapus baris ini"
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={14}
                              strokeWidth={1.5}
                            />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Ringkasan Bawah */}
        <div className="bg-muted/40 rounded-lg p-4 border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Total Item: </span>
              <strong className="text-foreground">{kalkulasiRingkasan.totalItem}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Sesuai: </span>
              <span className="font-semibold text-muted-foreground">
                {kalkulasiRingkasan.itemCocok}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Lebih (+): </span>
              <span className="font-semibold text-emerald-600">
                {kalkulasiRingkasan.itemPlus}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Kurang (-): </span>
              <span className="font-semibold text-rose-600">
                {kalkulasiRingkasan.itemMinus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Total Selisih Bersih</p>
              <p
                className={`font-mono font-bold ${
                  kalkulasiRingkasan.totalSelisihFisik > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : kalkulasiRingkasan.totalSelisihFisik < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-foreground'
                }`}
              >
                {kalkulasiRingkasan.totalSelisihFisik > 0
                  ? `+${formatKuantitas(kalkulasiRingkasan.totalSelisihFisik)}`
                  : formatKuantitas(kalkulasiRingkasan.totalSelisihFisik)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Total Dampak Nilai (Rp)</p>
              <p
                className={`font-mono text-base font-bold ${
                  kalkulasiRingkasan.totalNilaiSelisih > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : kalkulasiRingkasan.totalNilaiSelisih < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-foreground'
                }`}
              >
                {kalkulasiRingkasan.totalNilaiSelisih > 0
                  ? `+${formatRupiah(kalkulasiRingkasan.totalNilaiSelisih)}`
                  : formatRupiah(kalkulasiRingkasan.totalNilaiSelisih)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <Link href="/penyesuaian-stok">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto h-9 text-xs"
            >
              Tutup & Kembali
            </Button>
          </Link>

          {!isReadOnly && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Tombol Batalkan Opname jika sedang mengedit dokumen draft yang tersimpan */}
              {initialData?.status === 'draft' && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleBatalkanDraft}
                  disabled={isSubmitting}
                  className="h-9 gap-1.5 text-xs"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.5} />
                  Batalkan Opname
                </Button>
              )}

              {/* Tombol Simpan Draft */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting || items.length === 0}
                className="h-9 gap-1.5 text-xs font-medium border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <HugeiconsIcon icon={FloppyDiskIcon} size={15} strokeWidth={1.5} />
                {isSubmitting ? 'Menyimpan...' : 'Simpan sebagai Draft'}
              </Button>

              {/* Tombol Selesaikan & Mutasi Stok */}
              <Button
                type="button"
                size="sm"
                onClick={() => handleSubmit('selesai')}
                disabled={isSubmitting || items.length === 0}
                className="h-9 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={15}
                  strokeWidth={1.5}
                />
                {isSubmitting
                  ? 'Memproses Mutasi...'
                  : 'Selesaikan & Sesuaikan Stok'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
