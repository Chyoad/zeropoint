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
  ShieldUserIcon,
  GlobalIcon,
  AlertCircleIcon,
  StarIcon,
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  userSchema,
  ROLE_CONFIG,
  type UserInput,
  type UserFormInput,
  type UserWithCabang,
  type RolePengguna,
} from "@/lib/validasi/user"
import { simpanUserAction } from "@/server/actions/user"
import type { Cabang } from "@/lib/validasi/cabang"

export interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserWithCabang | null
  daftarCabang: Cabang[]
  onSuccess?: (user: UserWithCabang) => void
}

function getCabangIcon(tipe: string) {
  switch (tipe) {
    case "pusat":
      return Building04Icon
    case "gudang":
      return WarehouseIcon
    case "cabang":
    default:
      return Store01Icon
  }
}

export function UserDialog({
  open,
  onOpenChange,
  userToEdit,
  daftarCabang,
  onSuccess,
}: UserDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEditMode = Boolean(userToEdit)

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormInput, any, UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nama_lengkap: "",
      email: "",
      role: "staff",
      avatar_url: "",
      telepon: "",
      is_aktif: true,
      cabang_ids: [],
      cabang_default_id: "",
    },
  })

  const selectedCabangIds = watch("cabang_ids") || []
  const currentRole = watch("role") as RolePengguna
  const selectedDefaultId = watch("cabang_default_id")

  // Sinkronkan form saat modal dibuka atau userToEdit berubah
  React.useEffect(() => {
    if (open) {
      if (userToEdit) {
        const branchIds = userToEdit.cabang_list.map((c) => c.id)
        const defId =
          userToEdit.cabang_default_id ||
          userToEdit.cabang_list.find((c) => c.is_default)?.id ||
          (branchIds[0] ?? "")

        reset({
          nama_lengkap: userToEdit.nama_lengkap,
          email: userToEdit.email,
          role: userToEdit.role,
          avatar_url: userToEdit.avatar_url ?? "",
          telepon: userToEdit.telepon ?? "",
          is_aktif: userToEdit.is_aktif,
          cabang_ids: branchIds,
          cabang_default_id: defId,
        })
      } else {
        const defaultBranchId = daftarCabang.length > 0 ? daftarCabang[0].id : ""
        reset({
          nama_lengkap: "",
          email: "",
          role: "staff",
          avatar_url: "",
          telepon: "",
          is_aktif: true,
          cabang_ids: defaultBranchId ? [defaultBranchId] : [],
          cabang_default_id: defaultBranchId,
        })
      }
    }
  }, [open, userToEdit, daftarCabang, reset])

  const toggleCabang = (cabangId: string) => {
    const isChecked = selectedCabangIds.includes(cabangId)
    let newSelected: string[]

    if (isChecked) {
      newSelected = selectedCabangIds.filter((id) => id !== cabangId)
      setValue("cabang_ids", newSelected, { shouldValidate: true })

      // Jika cabang default yang dicopot, alihkan ke cabang pertama yang tersisa
      if (selectedDefaultId === cabangId) {
        setValue("cabang_default_id", newSelected[0] || "", {
          shouldValidate: true,
        })
      }
    } else {
      newSelected = [...selectedCabangIds, cabangId]
      setValue("cabang_ids", newSelected, { shouldValidate: true })

      // Jika belum ada cabang default, jadikan ini sebagai default
      if (!selectedDefaultId || selectedDefaultId === "") {
        setValue("cabang_default_id", cabangId, { shouldValidate: true })
      }
    }
  }

  const onSubmit = async (values: UserInput) => {
    try {
      setIsSubmitting(true)
      const res = await simpanUserAction(values, userToEdit?.id)

      if (res.success && res.data) {
        toast.success(
          isEditMode
            ? `Data pengguna "${values.nama_lengkap}" berhasil diperbarui.`
            : `Pengguna "${values.nama_lengkap}" berhasil ditambahkan.`
        )
        onSuccess?.(res.data)
        onOpenChange(false)
      } else {
        toast.error(res.error || "Gagal menyimpan data pengguna.")
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan internal saat menyimpan pengguna."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isGlobalRole =
    currentRole === "superadmin" || currentRole === "hq_manager"
  const isBranchMandatory =
    currentRole === "branch_manager" || currentRole === "staff"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={ShieldUserIcon}
              strokeWidth={1.5}
              className="size-5 text-primary"
            />
            <span>
              {isEditMode ? "Edit Profil & Hak Akses Pengguna" : "Tambah Pengguna Baru"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Perbarui informasi profil, peran RBAC, dan penugasan cabang untuk ${userToEdit?.kode || ""}.`
              : "Daftarkan pengguna baru beserta penetapan cabang operasional dan cabang default."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Grid: Nama Lengkap & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="nama_lengkap"
                className="text-sm font-medium leading-none text-foreground"
              >
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <Input
                id="nama_lengkap"
                placeholder="Contoh: Budi Santoso"
                {...register("nama_lengkap")}
                aria-invalid={Boolean(errors.nama_lengkap)}
                className={
                  errors.nama_lengkap
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {errors.nama_lengkap?.message ? (
                <p className="text-xs text-destructive">
                  {errors.nama_lengkap.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none text-foreground"
              >
                Alamat Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nama@zeropoint.local"
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
                className={
                  errors.email
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {errors.email?.message ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>
          </div>

          {/* Grid: Role & Nomor Telepon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="role"
                className="text-sm font-medium leading-none text-foreground"
              >
                Peran & Hak Akses (RBAC) <span className="text-destructive">*</span>
              </label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val) field.onChange(val as RolePengguna)
                    }}
                  >
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Pilih Peran" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(ROLE_CONFIG) as RolePengguna[]
                      ).map((r) => (
                        <SelectItem key={r} value={r}>
                          <div className="flex flex-col py-0.5">
                            <span className="font-medium">
                              {ROLE_CONFIG[r].label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {ROLE_CONFIG[r].deskripsi}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role?.message ? (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              ) : null}
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
                placeholder="Contoh: 0812-3456-7890"
                {...register("telepon")}
              />
            </div>
          </div>

          {/* Info Banner Hak Akses Berdasarkan Role */}
          {isGlobalRole ? (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-200/60 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 text-xs">
              <HugeiconsIcon
                icon={GlobalIcon}
                strokeWidth={1.5}
                className="size-4 shrink-0 text-purple-600 mt-0.5"
              />
              <div>
                <span className="font-semibold">Hak Akses Global Konsolidasi: </span>
                Peran {ROLE_CONFIG[currentRole].label} secara otomatis memiliki akses
                ke seluruh kantor dan cabang tanpa batasan. Penugasan cabang spesifik di
                bawah berfungsi sebagai preferensi cabang utama saat login.
              </div>
            </div>
          ) : isBranchMandatory ? (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                strokeWidth={1.5}
                className="size-4 shrink-0 text-amber-600 mt-0.5"
              />
              <div>
                <span className="font-semibold">Penugasan Cabang Wajib: </span>
                Peran {ROLE_CONFIG[currentRole].label} wajib memiliki minimal 1 cabang
                operasional yang ditugaskan.
              </div>
            </div>
          ) : null}

          {/* Penugasan Multi-Cabang */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Penugasan Cabang & Fasilitas Operasional{" "}
                {isBranchMandatory && (
                  <span className="text-destructive">*</span>
                )}
              </label>
              <span className="text-xs text-muted-foreground">
                {selectedCabangIds.length} cabang dipilih
              </span>
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2 max-h-48 overflow-y-auto">
              {daftarCabang.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Belum ada fasilitas cabang terdaftar di sistem.
                </p>
              ) : (
                daftarCabang.map((cabang) => {
                  const Icon = getCabangIcon(cabang.tipe)
                  const isChecked = selectedCabangIds.includes(cabang.id)
                  const isDefault = selectedDefaultId === cabang.id

                  return (
                    <div
                      key={cabang.id}
                      onClick={() => toggleCabang(cabang.id)}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                        isChecked
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="size-4 rounded border-input accent-primary text-primary focus:ring-ring cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={Icon}
                            strokeWidth={1.5}
                            className={`size-4 ${
                              cabang.tipe === "pusat"
                                ? "text-blue-600"
                                : cabang.tipe === "gudang"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {cabang.nama}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDefault && isChecked && (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                          >
                            <HugeiconsIcon
                              icon={StarIcon}
                              strokeWidth={1.5}
                              className="size-3 text-amber-500 fill-amber-500"
                            />
                            Utama / Default
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {cabang.kode}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {errors.cabang_ids?.message ? (
              <p className="text-xs text-destructive">
                {errors.cabang_ids.message}
              </p>
            ) : null}
          </div>

          {/* Pemilihan Cabang Default */}
          <div className="space-y-1.5">
            <label
              htmlFor="cabang_default_id"
              className="text-sm font-medium leading-none text-foreground flex items-center gap-1.5"
            >
              <span>Cabang Aktif Default (Saat Login)</span>
              {selectedCabangIds.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  - pilih salah satu dari cabang yang ditugaskan
                </span>
              )}
            </label>
            <Controller
              control={control}
              name="cabang_default_id"
              render={({ field }) => {
                const assignedCabangs = daftarCabang.filter((c) =>
                  selectedCabangIds.includes(c.id)
                )

                return (
                  <Select
                    value={field.value || ""}
                    onValueChange={(val) => field.onChange(val || "")}
                    disabled={assignedCabangs.length === 0}
                  >
                    <SelectTrigger id="cabang_default_id" className="w-full">
                      <SelectValue
                        placeholder={
                          assignedCabangs.length === 0
                            ? "Pilih cabang di atas terlebih dahulu"
                            : "Pilih cabang default saat login"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {assignedCabangs.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span>{c.nama}</span>
                            <span className="text-xs text-muted-foreground">
                              ({c.kode})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            />
            {errors.cabang_default_id?.message ? (
              <p className="text-xs text-destructive">
                {errors.cabang_default_id.message}
              </p>
            ) : null}
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
                      Status Pengguna Aktif
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pengguna aktif memiliki hak akses untuk masuk ke sistem dashboard
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
                "Tambah Pengguna"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
