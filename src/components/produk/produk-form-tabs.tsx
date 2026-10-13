"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller, useWatch, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  PackageIcon,
  Layers01Icon,
  Building04Icon,
  Tag01Icon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  produkSchema,
  type ProdukInput,
  type ProdukFormInput,
  type ProdukWithRelations,
  type KategoriProduk,
  type Cabang,
  type TipeProduk,
  type MetodeValuasi,
} from "@/lib/validasi/produk"
import { simpanProdukAction } from "@/server/actions/produk"
import { SatuanRepeater } from "@/components/produk/satuan-repeater"
import { KomponenPaketForm } from "@/components/produk/komponen-paket-form"
import { SaldoAwalCabangForm } from "@/components/produk/saldo-awal-cabang-form"

export interface ProdukFormTabsProps {
  initialData?: ProdukWithRelations | null
  daftarKategori: KategoriProduk[]
  daftarCabang: Cabang[]
  daftarProduk: ProdukWithRelations[]
}

export function ProdukFormTabs({
  initialData,
  daftarKategori,
  daftarCabang,
  daftarProduk,
}: ProdukFormTabsProps) {
  const router = useRouter()
  const isEditMode = Boolean(initialData)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("dasar")

  // Generate initial default values
  const defaultValues: ProdukFormInput = React.useMemo(() => {
    if (initialData) {
      return {
        nama: initialData.nama,
        tipe_produk: initialData.tipe_produk,
        metode_valuasi: initialData.metode_valuasi,
        kategori_produk_id: initialData.kategori_produk_id || "",
        harga_pokok_standar: Number(initialData.harga_pokok_standar) || 0,
        harga_beli_terakhir: Number(initialData.harga_beli_terakhir) || 0,
        peringatan_stok_minimum: Number(initialData.peringatan_stok_minimum) || 0,
        dapat_dijual: initialData.dapat_dijual,
        dapat_dibeli: initialData.dapat_dibeli,
        gambar_url: initialData.gambar_url || "",
        deskripsi: initialData.deskripsi || "",
        is_aktif: initialData.is_aktif,
        satuan: (initialData.satuan && initialData.satuan.length > 0)
          ? initialData.satuan.map((s) => ({
              id: s.id,
              nama_satuan: s.nama_satuan,
              rasio_ke_dasar: Number(s.rasio_ke_dasar) || 1,
              is_satuan_dasar: s.is_satuan_dasar,
              barcode: s.barcode || "",
              harga_jual_default: Number(s.harga_jual_default) || 0,
              harga_jual_grosir: Number(s.harga_jual_grosir) || 0,
              harga_jual_member: Number(s.harga_jual_member) || 0,
            }))
          : [
              {
                nama_satuan: "Pcs",
                rasio_ke_dasar: 1,
                is_satuan_dasar: true,
                barcode: "",
                harga_jual_default: 0,
                harga_jual_grosir: 0,
                harga_jual_member: 0,
              },
            ],
        komponen: (initialData.komponen || []).map((k) => ({
          id: k.id,
          produk_komponen_id: k.produk_komponen_id,
          satuan_produk_id: k.satuan_produk_id,
          kuantitas: Number(k.kuantitas) || 1,
        })),
        saldo_awal: [],
      }
    }

    return {
      nama: "",
      tipe_produk: "persediaan",
      metode_valuasi: "rata_rata",
      kategori_produk_id: daftarKategori[0]?.id || "",
      harga_pokok_standar: 0,
      harga_beli_terakhir: 0,
      peringatan_stok_minimum: 10,
      dapat_dijual: true,
      dapat_dibeli: true,
      gambar_url: "",
      deskripsi: "",
      is_aktif: true,
      satuan: [
        {
          nama_satuan: "Pcs",
          rasio_ke_dasar: 1,
          is_satuan_dasar: true,
          barcode: "",
          harga_jual_default: 0,
          harga_jual_grosir: 0,
          harga_jual_member: 0,
        },
      ],
      komponen: [],
      saldo_awal: daftarCabang.map((c) => ({
        cabang_id: c.id,
        kuantitas: 0,
        harga_pokok: 0,
      })),
    }
  }, [initialData, daftarKategori, daftarCabang])

  const formMethods = useForm<ProdukFormInput, any, ProdukInput>({
    resolver: zodResolver(produkSchema),
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = formMethods

  const watchedTipe = useWatch({
    control,
    name: "tipe_produk",
  })

  const watchedSatuan = useWatch({
    control,
    name: "satuan",
  })

  const watchedKomponen = useWatch({
    control,
    name: "komponen",
  })

  const onSubmit = async (values: ProdukInput) => {
    try {
      setIsSubmitting(true)
      const res = await simpanProdukAction(values, initialData?.id)

      if (res.success && res.data) {
        toast.success(
          isEditMode
            ? `Produk "${values.nama}" berhasil diperbarui.`
            : `Produk "${values.nama}" berhasil ditambahkan.`
        )
        router.push("/produk")
        router.refresh()
      } else {
        toast.error(res.error || "Gagal menyimpan master produk.")
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan sistem saat menyimpan produk."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const jumlahSatuan = watchedSatuan?.length || 1
  const jumlahKomponen = watchedKomponen?.length || 0

  return (
    <div className="space-y-6">
      {/* Header Halaman & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/produk">
            <Button variant="ghost" size="icon" className="size-9 rounded-full">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" strokeWidth={1.5} />
              <span className="sr-only">Kembali ke katalog produk</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {isEditMode ? `Edit Produk: ${initialData?.nama}` : "Tambah Master Produk Baru"}
              </h1>
              {initialData && (
                <Badge variant="outline" className="font-mono text-xs">
                  {initialData.kode}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditMode
                ? "Perbarui konfigurasi multi-satuan, harga, atau komponen paket produk."
                : "Daftarkan produk persediaan, jasa, atau paket bundling ala Accurate."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link href="/produk">
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            form="produk-form"
            disabled={isSubmitting}
            className="gap-2 font-medium"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="size-4 animate-spin"
                  strokeWidth={1.5}
                />
                Menyimpan...
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4"
                  strokeWidth={1.5}
                />
                Simpan Produk
              </>
            )}
          </Button>
        </div>
      </div>

    <FormProvider {...formMethods}>
      <form id="produk-form" onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="dasar" className="gap-2">
              <HugeiconsIcon icon={Tag01Icon} className="size-4" strokeWidth={1.5} />
              <span>Data Dasar</span>
            </TabsTrigger>

            <TabsTrigger value="satuan" className="gap-2">
              <HugeiconsIcon icon={Layers01Icon} className="size-4" strokeWidth={1.5} />
              <span>Multi-Satuan</span>
              <Badge variant="secondary" className="size-5 p-0 justify-center text-[10px] rounded-full">
                {jumlahSatuan}
              </Badge>
            </TabsTrigger>

            <TabsTrigger value="paket" className="gap-2">
              <HugeiconsIcon icon={PackageIcon} className="size-4" strokeWidth={1.5} />
              <span>Komponen Paket</span>
              {watchedTipe === "paket" && (
                <Badge variant="secondary" className="size-5 p-0 justify-center text-[10px] rounded-full">
                  {jumlahKomponen}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="saldo_awal" className="gap-2">
              <HugeiconsIcon icon={Building04Icon} className="size-4" strokeWidth={1.5} />
              <span>Saldo Awal Cabang</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DATA DASAR */}
          <TabsContent value="dasar" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama Produk */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Nama Produk <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Contoh: Indomie Soto Mie 70g / Mouse Logitech B100"
                      {...register("nama")}
                      className={errors.nama ? "border-destructive" : ""}
                    />
                    {errors.nama?.message && (
                      <p className="text-xs text-destructive">{errors.nama.message}</p>
                    )}
                  </div>

                  {/* Tipe Produk */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Tipe Produk <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name="tipe_produk"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(val) => {
                            if (val) field.onChange(val as TipeProduk)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih tipe produk" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="persediaan">
                              <span className="font-semibold text-emerald-600">Persediaan</span> (Barang Fisik & Stok)
                            </SelectItem>
                            <SelectItem value="non_persediaan">
                              <span className="font-semibold text-blue-600">Non-Persediaan</span> (Barang Habis Pakai)
                            </SelectItem>
                            <SelectItem value="jasa">
                              <span className="font-semibold text-purple-600">Jasa</span> (Layanan / Ongkos Kerja)
                            </SelectItem>
                            <SelectItem value="paket">
                              <span className="font-semibold text-amber-600">Paket</span> (Bundling Barang & Jasa)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Kategori Produk */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Kategori Produk
                    </label>
                    <Controller
                      control={control}
                      name="kategori_produk_id"
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(val) => field.onChange(val || null)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kategori..." />
                          </SelectTrigger>
                          <SelectContent>
                            {daftarKategori.map((kat) => (
                              <SelectItem key={kat.id} value={kat.id}>
                                {kat.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Metode Valuasi */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Metode Valuasi Persediaan
                    </label>
                    <Controller
                      control={control}
                      name="metode_valuasi"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(val) => {
                            if (val) field.onChange(val as MetodeValuasi)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih metode valuasi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rata_rata">
                              Rata-Rata Bergerak (Moving Average)
                            </SelectItem>
                            <SelectItem value="fifo">
                              FIFO (First-In First-Out)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Standar metode valuasi harga pokok persediaan saat terjadi mutasi keluar.
                    </p>
                  </div>

                  {/* Peringatan Stok Minimum */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Peringatan Stok Minimum
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="10"
                      {...register("peringatan_stok_minimum", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Batas kuantitas satuan dasar untuk memicu peringatan stok menipis di dashboard.
                    </p>
                  </div>

                  {/* Harga Pokok Standar */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Harga Pokok Standar (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("harga_pokok_standar", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Harga Beli Terakhir */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Harga Beli Terakhir (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("harga_beli_terakhir", { valueAsNumber: true })}
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Deskripsi Produk
                    </label>
                    <Input
                      placeholder="Keterangan spesifikasi teknis atau catatan internal produk..."
                      {...register("deskripsi")}
                    />
                  </div>

                  {/* Checkbox Opsi: Dapat Dijual, Dapat Dibeli, Status Aktif */}
                  <div className="md:col-span-2 pt-2 border-t flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        {...register("dapat_dijual")}
                        className="rounded border-input size-4 text-primary focus:ring-primary"
                      />
                      <span>Dapat Dijual (Katalog Penjualan & Kasir)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        {...register("dapat_dibeli")}
                        className="rounded border-input size-4 text-primary focus:ring-primary"
                      />
                      <span>Dapat Dibeli (Modul Pengadaan / PO)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        {...register("is_aktif")}
                        className="rounded border-input size-4 text-primary focus:ring-primary"
                      />
                      <span>Status Aktif</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MULTI-SATUAN */}
          <TabsContent value="satuan">
            <SatuanRepeater
              control={control}
              register={register}
              errors={errors}
            />
          </TabsContent>

          {/* TAB 3: KOMPONEN PAKET */}
          <TabsContent value="paket">
            <KomponenPaketForm
              control={control}
              register={register}
              errors={errors}
              tipeProduk={watchedTipe}
              availableProducts={daftarProduk.filter((p) => p.id !== initialData?.id)}
            />
          </TabsContent>

          {/* TAB 4: SALDO AWAL CABANG */}
          <TabsContent value="saldo_awal">
            <SaldoAwalCabangForm
              control={control}
              register={register}
              errors={errors}
              tipeProduk={watchedTipe}
              isEditMode={isEditMode}
              daftarCabang={daftarCabang}
            />
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  </div>
  )
}
