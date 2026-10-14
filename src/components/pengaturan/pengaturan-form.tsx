"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building04Icon,
  Coins01Icon,
  InformationCircleIcon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Database01Icon,
  Globe02Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  profilOrganisasiSchema,
  type ProfilOrganisasi,
  type ProfilOrganisasiFormInput,
} from "@/lib/validasi/pengaturan"
import { perbaruiProfilOrganisasiAction } from "@/server/actions/pengaturan"
import { formatRupiah } from "@/lib/utils"

export interface PengaturanFormProps {
  initialData: ProfilOrganisasi
}

export function PengaturanForm({ initialData }: PengaturanFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("profil")

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfilOrganisasiFormInput>({
    resolver: zodResolver(profilOrganisasiSchema),
    defaultValues: {
      id: initialData.id,
      kode: initialData.kode || "ORG-0001",
      nama: initialData.nama || "",
      npwp: initialData.npwp || "01.234.567.8-901.000",
      alamat: initialData.alamat || "",
      kota: initialData.kota || "",
      provinsi: initialData.provinsi || "",
      telepon: initialData.telepon || "",
      email: initialData.email || "",
      mata_uang_default: initialData.mata_uang_default || "IDR",
      zona_waktu: initialData.zona_waktu || "Asia/Jakarta (WIB)",
      pemisah_angka: initialData.pemisah_angka || "titik",
      format_tanggal: initialData.format_tanggal || "DD/MM/YYYY",
    },
  })

  const watchedMataUang = watch("mata_uang_default")
  const watchedPemisahAngka = watch("pemisah_angka")
  const watchedZonaWaktu = watch("zona_waktu")

  const onSubmit = async (values: ProfilOrganisasiFormInput) => {
    setIsSubmitting(true)
    try {
      const res = await perbaruiProfilOrganisasiAction(values)
      if (res.success) {
        toast.success("Pengaturan organisasi dan preferensi sistem berhasil disimpan!")
      } else {
        toast.error(res.error || "Gagal memperbarui profil organisasi")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan atau server saat menyimpan data")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val || "profil")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="profil" className="text-xs sm:text-sm gap-2">
              <HugeiconsIcon icon={Building04Icon} size={15} strokeWidth={1.5} />
              Profil Perusahaan
            </TabsTrigger>
            <TabsTrigger value="regional" className="text-xs sm:text-sm gap-2">
              <HugeiconsIcon icon={Coins01Icon} size={15} strokeWidth={1.5} />
              Preferensi Regional
            </TabsTrigger>
            <TabsTrigger value="sistem" className="text-xs sm:text-sm gap-2">
              <HugeiconsIcon icon={InformationCircleIcon} size={15} strokeWidth={1.5} />
              Versi Sistem
            </TabsTrigger>
          </TabsList>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto h-9 px-4 text-xs font-semibold gap-1.5"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={15}
                  strokeWidth={1.5}
                  className="animate-spin"
                />
                Menyimpan...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={1.5} />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>

        {/* TAB 1: PROFIL PERUSAHAAN */}
        <TabsContent value="profil" className="space-y-4 pt-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Building04Icon} size={18} strokeWidth={1.5} className="text-primary" />
                Identitas Legal & Profil Perusahaan
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Informasi entitas korporat pusat pemilik organisasi multi-cabang ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kode Organisasi */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Kode Organisasi
                  </label>
                  <Input
                    {...register("kode")}
                    disabled
                    className="font-mono text-xs bg-muted/40 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Kode unik institusi terdaftar pada database sistem.
                  </p>
                </div>

                {/* Nama Perusahaan */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Nama Perusahaan / PT <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("nama")}
                    placeholder="Contoh: PT Zeropoint Nusantara"
                    className="text-xs"
                  />
                  {errors.nama && (
                    <p className="text-[11px] text-rose-500">{errors.nama.message}</p>
                  )}
                </div>

                {/* NPWP */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    NPWP Badan Usaha <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("npwp")}
                    placeholder="01.234.567.8-901.000"
                    className="font-mono text-xs"
                  />
                  {errors.npwp && (
                    <p className="text-[11px] text-rose-500">{errors.npwp.message}</p>
                  )}
                </div>

                {/* Email Perusahaan */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Email Resmi Kantor <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="corporate@zeropoint.local"
                    className="text-xs"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Telepon */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Nomor Telepon Kantor <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("telepon")}
                    placeholder="021-5551234"
                    className="text-xs"
                  />
                  {errors.telepon && (
                    <p className="text-[11px] text-rose-500">{errors.telepon.message}</p>
                  )}
                </div>

                {/* Kota */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Kota Kedudukan <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("kota")}
                    placeholder="Jakarta Selatan"
                    className="text-xs"
                  />
                  {errors.kota && (
                    <p className="text-[11px] text-rose-500">{errors.kota.message}</p>
                  )}
                </div>

                {/* Provinsi */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Provinsi <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    {...register("provinsi")}
                    placeholder="DKI Jakarta"
                    className="text-xs"
                  />
                  {errors.provinsi && (
                    <p className="text-[11px] text-rose-500">{errors.provinsi.message}</p>
                  )}
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  Alamat Kantor Pusat <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register("alamat")}
                  placeholder="Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan"
                  className="text-xs"
                />
                {errors.alamat && (
                  <p className="text-[11px] text-rose-500">{errors.alamat.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PREFERENSI REGIONAL */}
        <TabsContent value="regional" className="space-y-4 pt-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Coins01Icon} size={18} strokeWidth={1.5} className="text-primary" />
                Mata Uang & Preferensi Regional Standar Indonesia
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pengaturan standar moneter Rupiah, zona waktu nusantara, dan format numerik.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mata Uang Default */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Mata Uang Basis Organisasi
                  </label>
                  <Controller
                    name="mata_uang_default"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Pilih Mata Uang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDR">IDR - Rupiah Indonesia (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Seluruh perhitungan HPP dan mutasi kartu stok dibukukan dalam mata uang ini.
                  </p>
                </div>

                {/* Zona Waktu */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Zona Waktu Operasional
                  </label>
                  <Controller
                    name="zona_waktu"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Pilih Zona Waktu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Jakarta (WIB)">
                            WIB - Waktu Indonesia Barat (UTC+7)
                          </SelectItem>
                          <SelectItem value="Asia/Makassar (WITA)">
                            WITA - Waktu Indonesia Tengah (UTC+8)
                          </SelectItem>
                          <SelectItem value="Asia/Jayapura (WIT)">
                            WIT - Waktu Indonesia Timur (UTC+9)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Basis pencatatan audit timestamp dan tanggal posting jurnal transaksi.
                  </p>
                </div>

                {/* Pemisah Angka */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Format Pemisah Numerik
                  </label>
                  <Controller
                    name="pemisah_angka"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Pilih Pemisah" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="titik">
                            Format Indonesia (Titik ribuan: 1.000.000,00)
                          </SelectItem>
                          <SelectItem value="koma">
                            Format Internasional (Koma ribuan: 1,000,000.00)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Format Tanggal */}
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">
                    Format Tampilan Tanggal
                  </label>
                  <Input
                    {...register("format_tanggal")}
                    disabled
                    className="font-mono text-xs bg-muted/40 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Format tanggal terstandar: DD/MM/YYYY (contoh: 14/10/2026).
                  </p>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-muted/30 border border-border/70 rounded-lg space-y-2 mt-4">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Globe02Icon} size={15} strokeWidth={1.5} className="text-primary" />
                  Pratinjau Format Regional Aktif
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-card rounded border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">Format Moneter</span>
                    <strong className="text-foreground text-sm font-semibold">
                      {formatRupiah(25500000)}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-card rounded border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">Zona Waktu Aktif</span>
                    <strong className="text-foreground text-sm font-semibold">
                      {watchedZonaWaktu || "Asia/Jakarta (WIB)"}
                    </strong>
                  </div>
                  <div className="p-2.5 bg-card rounded border border-border/60">
                    <span className="text-muted-foreground block text-[11px]">Pemisah Ribuan</span>
                    <strong className="text-foreground text-sm font-semibold">
                      {watchedPemisahAngka === "titik" ? "Titik (.)" : "Koma (,)"}
                    </strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: RINGKASAN VERSI SISTEM */}
        <TabsContent value="sistem" className="space-y-4 pt-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <HugeiconsIcon icon={Database01Icon} size={18} strokeWidth={1.5} className="text-primary" />
                Arsitektur & Status Lingkungan Sistem
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Informasi status konektivitas database Supabase, arsitektur modul, dan spesifikasi runtime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Supabase */}
                <div className="p-3.5 bg-card rounded-lg border border-border/60 space-y-1.5">
                  <span className="text-muted-foreground text-[11px] block font-medium">
                    Status Koneksi Supabase PostgreSQL
                  </span>
                  <div className="flex items-center gap-2">
                    {initialData.supabase_status === "connected" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-0.5">
                        <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        Online (Terkoneksi)
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5">
                        <span className="size-1.5 rounded-full bg-amber-500 mr-1.5" />
                        Mode Demo In-Memory (Offline/Lokal)
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/90 pt-1">
                    Saat offline, seluruh operasi CRUD dialihkan secara otomatis ke store memori tanpa pemutusan layanan.
                  </p>
                </div>

                {/* Versi Zeropoint */}
                <div className="p-3.5 bg-card rounded-lg border border-border/60 space-y-1.5">
                  <span className="text-muted-foreground text-[11px] block font-medium">
                    Versi Template Enterprise
                  </span>
                  <strong className="text-sm font-mono font-semibold text-foreground block">
                    Zeropoint v{initialData.versi_aplikasi || "1.0.0-enterprise"}
                  </strong>
                  <p className="text-[11px] text-muted-foreground/90">
                    Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
                  </p>
                </div>

                {/* Standar UI */}
                <div className="p-3.5 bg-card rounded-lg border border-border/60 space-y-1.5">
                  <span className="text-muted-foreground text-[11px] block font-medium">
                    Standar Ikon & Tipografi
                  </span>
                  <strong className="text-xs font-semibold text-foreground block">
                    100% Hugeicons Stroke Rounded (1.5px) • Outfit Font
                  </strong>
                  <p className="text-[11px] text-muted-foreground/90">
                    Bebas dependensi pustaka ikon eksternal lain untuk konsistensi visual berkelas enterprise.
                  </p>
                </div>

                {/* Standar Skema Database */}
                <div className="p-3.5 bg-card rounded-lg border border-border/60 space-y-1.5">
                  <span className="text-muted-foreground text-[11px] block font-medium">
                    Skema Entitas & Keamanan RLS
                  </span>
                  <strong className="text-xs font-semibold text-foreground block">
                    Indonesian Singular Snake_Case + Multi-Tenant RLS
                  </strong>
                  <p className="text-[11px] text-muted-foreground/90">
                    Generator nomor otomatis RPC `buat_kode` dan audit trail `log_audit`.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
