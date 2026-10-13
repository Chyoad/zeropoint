"use client"

import * as React from "react"
import { type Control, useFieldArray, useWatch, Controller, useFormContext } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  Add01Icon,
  Delete02Icon,
  InformationCircleIcon,
  Coins01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProdukFormInput, ProdukWithRelations } from "@/lib/validasi/produk"

export interface KomponenPaketFormProps {
  control: Control<ProdukFormInput, any>
  register: any
  errors: any
  tipeProduk: string
  availableProducts: ProdukWithRelations[]
}

export function KomponenPaketForm({
  control,
  register,
  errors,
  tipeProduk,
  availableProducts,
}: KomponenPaketFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "komponen",
  })

  const watchedKomponen = useWatch({
    control,
    name: "komponen",
  })

  const isPaket = tipeProduk === "paket"
  const { setValue } = useFormContext<ProdukFormInput>()

  const handleTambahKomponen = () => {
    // Pick the first available component if any
    const firstPrd = availableProducts.find((p) => p.tipe_produk !== "paket")
    append({
      produk_komponen_id: firstPrd?.id || "",
      satuan_produk_id: firstPrd?.satuan_dasar?.id || null,
      kuantitas: 1,
    })
  }

  // Calculate estimated total HPP from chosen components
  const estimasiTotalHpp = React.useMemo(() => {
    if (!watchedKomponen) return 0
    return watchedKomponen.reduce((acc, curr) => {
      if (!curr?.produk_komponen_id) return acc
      const prd = availableProducts.find((p) => p.id === curr.produk_komponen_id)
      const hpp = Number(prd?.harga_pokok_standar) || 0
      const qty = Number(curr.kuantitas) || 0
      return acc + hpp * qty
    }, 0)
  }, [watchedKomponen, availableProducts])

  if (!isPaket) {
    return (
      <Card className="border-dashed border-2 bg-muted/20">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <HugeiconsIcon icon={PackageIcon} className="size-6" strokeWidth={1.5} />
          </div>
          <div className="max-w-md">
            <h4 className="text-base font-semibold text-foreground">Tab Komponen Paket Nonaktif</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Tab ini hanya aktif untuk produk dengan tipe <strong>Paket (Bundling Dinamis)</strong>. Ubah tipe produk di tab Data Dasar jika produk ini merupakan paket gabungan barang dan jasa.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={PackageIcon} className="size-5 text-primary" strokeWidth={1.5} />
            Penyusun Paket Dinamis (*On-the-Fly*)
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tentukan barang persediaan atau jasa yang menyusun paket bundling ini. Saat paket dijual, stok fisik komponen penyusun akan otomatis terpotong pada kartu stok.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTambahKomponen}
          className="self-start sm:self-auto gap-1.5"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={1.5} />
          Tambah Komponen
        </Button>
      </div>

      {errors.komponen?.message && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" strokeWidth={1.5} />
          <span>{errors.komponen.message}</span>
        </div>
      )}

      {fields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Belum ada komponen penyusun. Klik &quot;Tambah Komponen&quot; untuk memilih produk dan kuantitas.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTambahKomponen}
              className="gap-1.5"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={1.5} />
              Tambah Komponen Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const currentItem = watchedKomponen?.[index] || field
            const selectedPrd = availableProducts.find(
              (p) => p.id === currentItem.produk_komponen_id
            )
            const currentQty = Number(currentItem.kuantitas) || 1
            const hppItem = Number(selectedPrd?.harga_pokok_standar) || 0
            const subtotalHpp = hppItem * currentQty

            return (
              <Card key={field.id} className="border border-border">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full sm:w-auto space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Produk Komponen <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      control={control}
                      name={`komponen.${index}.produk_komponen_id`}
                      render={({ field: pField }) => (
                        <Select
                          value={pField.value}
                          onValueChange={(val) => {
                            pField.onChange(val)
                            const picked = availableProducts.find((p) => p.id === val)
                            if (picked?.satuan_dasar?.id) {
                              setValue(
                                `komponen.${index}.satuan_produk_id`,
                                picked.satuan_dasar.id
                              )
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih produk komponen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts
                              .filter((p) => p.tipe_produk !== "paket")
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <span className="font-mono text-xs text-muted-foreground mr-2">
                                    {p.kode}
                                  </span>
                                  {p.nama} ({p.satuan_dasar?.nama_satuan || "Unit"})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.komponen?.[index]?.produk_komponen_id?.message && (
                      <p className="text-xs text-destructive">
                        {errors.komponen[index].produk_komponen_id.message}
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-32 space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Kuantitas <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="1"
                      {...register(`komponen.${index}.kuantitas`, { valueAsNumber: true })}
                      className={errors.komponen?.[index]?.kuantitas ? "border-destructive" : ""}
                    />
                    {errors.komponen?.[index]?.kuantitas?.message && (
                      <p className="text-xs text-destructive">
                        {errors.komponen[index].kuantitas.message}
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-40 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Estimasi HPP
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted/40 rounded-md text-xs font-mono flex items-center justify-between">
                      <span>Rp</span>
                      <span className="font-semibold">{subtotalHpp.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="pt-6 sm:pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 px-2"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.5} />
                      <span className="sr-only">Hapus komponen</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Coins01Icon} className="size-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium">
                  Estimasi Total Harga Pokok Komponen ({fields.length} item):
                </span>
              </div>
              <span className="text-base font-bold font-mono text-primary">
                Rp {estimasiTotalHpp.toLocaleString("id-ID")}
              </span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
