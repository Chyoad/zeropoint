"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building04Icon,
  Store01Icon,
  WarehouseIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  cabangSchema,
  type CabangInput,
  type CabangFormInput,
  type TipeCabang,
} from "@/lib/validasi/cabang"
import { simpanCabangAction } from "@/server/actions/cabang"
import type { Cabang } from "@/lib/validasi/cabang"

export interface CabangDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cabangToEdit?: Cabang | null
  onSuccess?: (cabang: Cabang) => void
}

export function CabangDialog({
  open,
  onOpenChange,
  cabangToEdit,
  onSuccess,
}: CabangDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const isEditMode = Boolean(cabangToEdit)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CabangFormInput, any, CabangInput>({
    resolver: zodResolver(cabangSchema),
    defaultValues: {
      nama: "",
      tipe: "cabang",
      alamat: "",
      kota: "",
      telepon: "",
      is_aktif: true,
    },
  })

  // Sinkronkan form saat modal dibuka atau target cabang diedit
  React.useEffect(() => {
    if (open) {
      if (cabangToEdit) {
        reset({
          nama: cabangToEdit.nama,
          tipe: cabangToEdit.tipe,
          alamat: cabangToEdit.alamat ?? "",
          kota: cabangToEdit.kota ?? "",
          telepon: cabangToEdit.telepon ?? "",
          is_aktif: cabangToEdit.is_aktif,
        })
      } else {
        reset({
          nama: "",
          tipe: "cabang",
          alamat: "",
          kota: "",
          telepon: "",
          is_aktif: true,
        })
      }
    }
  }, [open, cabangToEdit, reset])

  const onSubmit = async (values: CabangInput) => {
    try {
      setIsSubmitting(true)
      const res = await simpanCabangAction(values, cabangToEdit?.id)

      if (res.success && res.data) {
        toast.success(
          isEditMode
            ? `Fasilitas "${values.nama}" berhasil diperbarui.`
            : `Fasilitas "${values.nama}" berhasil ditambahkan.`
        )
        onSuccess?.(res.data)
        onOpenChange(false)
      } else {
        toast.error(res.error || "Gagal menyimpan data fasilitas.")
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan internal saat menyimpan fasilitas."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Fasilitas Cabang" : "Tambah Cabang / Fasilitas"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Perbarui informasi fasilitas ${cabangToEdit?.kode || ""}.`
              : "Daftarkan kantor pusat, cabang operasional, atau gudang logistik baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Nama Fasilitas */}
          <div className="space-y-1.5">
            <label
              htmlFor="nama"
              className="text-sm font-medium leading-none text-foreground"
            >
              Nama Fasilitas <span className="text-destructive">*</span>
            </label>
            <Input
              id="nama"
              placeholder="Contoh: Kantor Cabang Bandung / Gudang Cibitung"
              {...register("nama")}
              aria-invalid={Boolean(errors.nama)}
              className={errors.nama ? "border-destructive focus-visible:ring-destructive/30" : ""}
            />
            {errors.nama?.message ? (
              <p className="text-xs text-destructive">{errors.nama.message}</p>
            ) : null}
          </div>

          {/* Tipe Fasilitas */}
          <div className="space-y-1.5">
            <label
              htmlFor="tipe"
              className="text-sm font-medium leading-none text-foreground"
            >
              Tipe Lokasi <span className="text-destructive">*</span>
            </label>
            <Controller
              control={control}
              name="tipe"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    if (val) field.onChange(val as TipeCabang)
                  }}
                >
                  <SelectTrigger id="tipe" className="w-full">
                    <SelectValue placeholder="Pilih tipe fasilitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pusat">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Building04Icon}
                          strokeWidth={1.5}
                          className="size-4 text-blue-600"
                        />
                        <span>Kantor Pusat (HQ)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cabang">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={Store01Icon}
                          strokeWidth={1.5}
                          className="size-4 text-emerald-600"
                        />
                        <span>Cabang Operasional</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gudang">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon
                          icon={WarehouseIcon}
                          strokeWidth={1.5}
                          className="size-4 text-amber-600"
                        />
                        <span>Gudang Logistik</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipe?.message ? (
              <p className="text-xs text-destructive">{errors.tipe.message}</p>
            ) : null}
          </div>

          {/* Grid: Kota & Telepon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="kota"
                className="text-sm font-medium leading-none text-foreground"
              >
                Kota / Wilayah
              </label>
              <Input
                id="kota"
                placeholder="Contoh: Bandung, Jawa Barat"
                {...register("kota")}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="telepon"
                className="text-sm font-medium leading-none text-foreground"
              >
                Nomor Telepon
              </label>
              <Input
                id="telepon"
                placeholder="Contoh: 022-7561234"
                {...register("telepon")}
              />
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div className="space-y-1.5">
            <label
              htmlFor="alamat"
              className="text-sm font-medium leading-none text-foreground"
            >
              Alamat Lengkap
            </label>
            <Input
              id="alamat"
              placeholder="Contoh: Jl. Soekarno Hatta No. 45"
              {...register("alamat")}
            />
          </div>

          {/* Switch / Checkbox Status Aktif */}
          <div className="pt-1">
            <Controller
              control={control}
              name="is_aktif"
              render={({ field }) => (
                <label className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 rounded border-input accent-primary text-primary focus:ring-ring cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Status Operasional Aktif
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Fasilitas aktif dapat digunakan dalam operasional persediaan
                    </span>
                  </div>
                </label>
              )}
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    strokeWidth={1.5}
                    className="size-4 animate-spin me-1.5"
                  />
                  <span>Menyimpan...</span>
                </>
              ) : isEditMode ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Fasilitas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
