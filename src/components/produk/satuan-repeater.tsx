"use client"

import * as React from "react"
import { type Control, useFieldArray, useWatch } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  Tag01Icon,
  BarCode01Icon,
  InformationCircleIcon,
  Layers01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { ProdukFormInput } from "@/lib/validasi/produk"

export interface SatuanRepeaterProps {
  control: Control<ProdukFormInput, any>
  register: any
  errors: any
}

export function SatuanRepeater({ control, register, errors }: SatuanRepeaterProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "satuan",
  })

  const watchedSatuan = useWatch({
    control,
    name: "satuan",
  })

  const satuanDasarNama = watchedSatuan?.[0]?.nama_satuan?.trim() || "Satuan Dasar"

  const handleTambahSatuanBertingkat = () => {
    append({
      nama_satuan: "",
      rasio_ke_dasar: 12,
      is_satuan_dasar: false,
      barcode: "",
      harga_jual_default: 0,
      harga_jual_grosir: 0,
      harga_jual_member: 0,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={Layers01Icon} className="size-5 text-primary" strokeWidth={1.5} />
            Multi-Satuan ala Accurate
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tentukan satuan terkecil (satuan dasar) sebagai basis pencatatan stok, serta satuan bertingkat (Lusin, Karton, Box) dengan rasio pengali otomatis.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTambahSatuanBertingkat}
          className="self-start sm:self-auto gap-1.5"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={1.5} />
          Tambah Satuan Bertingkat
        </Button>
      </div>

      {errors.satuan?.message && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" strokeWidth={1.5} />
          <span>{errors.satuan.message}</span>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const isDasar = index === 0 || field.is_satuan_dasar
          const currentItem = watchedSatuan?.[index] || field
          const currentRasio = currentItem.rasio_ke_dasar || 1
          const currentNama = currentItem.nama_satuan || ""

          return (
            <Card key={field.id} className={isDasar ? "border-primary/40 bg-card/60" : "border-border"}>
              <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isDasar ? "default" : "secondary"} className="gap-1 font-medium">
                    {isDasar ? (
                      <>
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" strokeWidth={1.5} />
                        Satuan Dasar (Basis Mutasi Stok)
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Layers01Icon} className="size-3.5" strokeWidth={1.5} />
                        Satuan Bertingkat Level {index}
                      </>
                    )}
                  </Badge>

                  {!isDasar && Boolean(currentNama) && (
                    <span className="text-xs font-medium text-muted-foreground">
                      1 {String(currentNama)} = {Number(currentRasio)} {String(satuanDasarNama)}
                    </span>
                  )}
                </div>

                {!isDasar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Hapus satuan</span>
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Nama Satuan */}
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <HugeiconsIcon icon={Tag01Icon} className="size-3 text-muted-foreground" strokeWidth={1.5} />
                    Nama Satuan <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder={isDasar ? "Contoh: Pcs, Unit, Botol" : "Contoh: Karton, Lusin, Box"}
                    {...register(`satuan.${index}.nama_satuan`)}
                    className={errors.satuan?.[index]?.nama_satuan ? "border-destructive" : ""}
                  />
                  {errors.satuan?.[index]?.nama_satuan?.message && (
                    <p className="text-xs text-destructive">{errors.satuan[index].nama_satuan.message}</p>
                  )}
                </div>

                {/* Rasio ke Satuan Dasar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Rasio Pengali <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      disabled={isDasar}
                      placeholder="1"
                      {...register(`satuan.${index}.rasio_ke_dasar`, { valueAsNumber: true })}
                      className={errors.satuan?.[index]?.rasio_ke_dasar ? "border-destructive" : ""}
                    />
                  </div>
                  {isDasar ? (
                    <p className="text-[11px] text-muted-foreground">Terkunci 1 untuk dasar</p>
                  ) : (
                    errors.satuan?.[index]?.rasio_ke_dasar?.message && (
                      <p className="text-xs text-destructive">
                        {errors.satuan[index].rasio_ke_dasar.message}
                      </p>
                    )
                  )}
                </div>

                {/* Barcode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <HugeiconsIcon icon={BarCode01Icon} className="size-3 text-muted-foreground" strokeWidth={1.5} />
                    Barcode
                  </label>
                  <Input
                    placeholder="Scan / ketik barcode"
                    {...register(`satuan.${index}.barcode`)}
                  />
                </div>

                {/* Harga Jual Default */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Harga Jual Default (Rp)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register(`satuan.${index}.harga_jual_default`, { valueAsNumber: true })}
                  />
                </div>

                {/* Harga Jual Grosir */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Harga Grosir (Rp)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register(`satuan.${index}.harga_jual_grosir`, { valueAsNumber: true })}
                  />
                </div>

                {/* Hidden is_satuan_dasar */}
                <input
                  type="hidden"
                  value={isDasar ? "true" : "false"}
                  {...register(`satuan.${index}.is_satuan_dasar`)}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
