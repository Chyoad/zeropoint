"use client"

import * as React from "react"
import { type Control, useWatch } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building04Icon,
  Store01Icon,
  WarehouseIcon,
  Coins01Icon,
  InformationCircleIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ProdukFormInput, Cabang } from "@/lib/validasi/produk"

export interface SaldoAwalCabangFormProps {
  control: Control<ProdukFormInput, any>
  register: any
  errors: any
  tipeProduk: string
  isEditMode: boolean
  daftarCabang: Cabang[]
}

export function SaldoAwalCabangForm({
  control,
  register,
  tipeProduk,
  isEditMode,
  daftarCabang,
}: SaldoAwalCabangFormProps) {
  const isPersediaan = tipeProduk === "persediaan"

  const watchedSaldoAwal = useWatch({
    control,
    name: "saldo_awal",
  })

  const watchedSatuan = useWatch({
    control,
    name: "satuan",
  })

  const satuanDasarNama = watchedSatuan?.[0]?.nama_satuan?.trim() || "Satuan Dasar"

  // Hitung total kuantitas dan total nilai dari seluruh cabang
  const { totalKuantitas, totalNilai } = React.useMemo(() => {
    let tQty = 0
    let tVal = 0
    if (watchedSaldoAwal && Array.isArray(watchedSaldoAwal)) {
      watchedSaldoAwal.forEach((sa) => {
        const qty = Number(sa?.kuantitas) || 0
        const hpp = Number(sa?.harga_pokok) || 0
        tQty += qty
        tVal += qty * hpp
      })
    }
    return { totalKuantitas: tQty, totalNilai: tVal }
  }, [watchedSaldoAwal])

  if (isEditMode) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-6" strokeWidth={1.5} />
          </div>
          <div className="max-w-md">
            <h4 className="text-base font-semibold text-foreground">Saldo Awal Terkunci</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Saldo awal hanya dapat diinput satu kali saat pendaftaran produk baru. Untuk menambah, mengurangi, atau mengoreksi stok berjalan, silakan gunakan modul <strong>Penyesuaian Stok (Stock Opname)</strong> atau <strong>Kartu Stok</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isPersediaan) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-6" strokeWidth={1.5} />
          </div>
          <div className="max-w-md">
            <h4 className="text-base font-semibold text-foreground">Hanya Berlaku untuk Persediaan Fisik</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Produk dengan tipe Non-Persediaan, Jasa, atau Paket tidak memiliki saldo awal fisik persediaan. Ubah tipe ke <strong>Persediaan</strong> di tab Data Dasar jika produk ini memiliki stok barang fisik di gudang/cabang.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={Building04Icon} className="size-5 text-primary" strokeWidth={1.5} />
          Saldo Awal Persediaan per Cabang
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Masukkan kuantitas fisik awal dan harga pokok pembelian per cabang. Kuantitas dicatat dalam satuan dasar (<strong>{satuanDasarNama}</strong>). Sistem akan otomatis mencatat saldo awal ke Kartu Stok dan Stok Produk masing-masing cabang.
        </p>
      </div>

      <div className="space-y-3">
        {daftarCabang.map((cabang, index) => {
          const currentSa = watchedSaldoAwal?.[index]
          const qty = Number(currentSa?.kuantitas) || 0
          const hpp = Number(currentSa?.harga_pokok) || 0
          const subtotal = qty * hpp

          let icon = Store01Icon
          let badgeVariant: "default" | "secondary" | "outline" = "secondary"
          let badgeLabel = "Cabang"

          if (cabang.tipe === "pusat") {
            icon = Building04Icon
            badgeVariant = "default"
            badgeLabel = "Kantor Pusat"
          } else if (cabang.tipe === "gudang") {
            icon = WarehouseIcon
            badgeVariant = "outline"
            badgeLabel = "Gudang Logistik"
          }

          return (
            <Card key={cabang.id} className="border border-border">
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="min-w-[200px] space-y-1">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={icon} className="size-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-semibold text-sm">{cabang.nama}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={badgeVariant} className="text-[10px] h-4 px-1.5 font-normal">
                      {badgeLabel}
                    </Badge>
                    <span>{cabang.kota || cabang.kode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto md:flex-1 max-w-xl">
                  {/* Kuantitas Awal */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Kuantitas ({satuanDasarNama})
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      {...register(`saldo_awal.${index}.kuantitas`, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Harga Pokok Awal */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">
                      Harga Pokok / HPP (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register(`saldo_awal.${index}.harga_pokok`, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Subtotal Nilai */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Subtotal Nilai
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted/40 rounded-md text-xs font-mono flex items-center justify-between">
                      <span>Rp</span>
                      <span className="font-semibold">{subtotal.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                {/* Hidden cabang_id */}
                <input
                  type="hidden"
                  value={cabang.id}
                  {...register(`saldo_awal.${index}.cabang_id`)}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Ringkasan Saldo Awal */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} className="size-5 text-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Total Persediaan Awal: {totalKuantitas.toLocaleString("id-ID")} {satuanDasarNama}
              </p>
              <p className="text-xs text-muted-foreground">
                Terdistribusi pada {daftarCabang.length} fasilitas cabang/gudang aktif.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">Total Nilai Persediaan Awal:</span>
            <span className="text-lg font-bold font-mono text-primary">
              Rp {totalNilai.toLocaleString("id-ID")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
