"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  FilterIcon,
  ViewIcon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  Store01Icon,
  UserIcon,
  Clock01Icon,
  ComputerIcon,
  RefreshIcon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatTanggalWaktuIndonesia } from "@/lib/utils"
import {
  formatBadgeAksi,
  type LogAudit,
} from "@/lib/validasi/log-audit"
import type { Cabang } from "@/lib/validasi/cabang"

export interface LogAuditTableProps {
  initialLogs: LogAudit[]
  daftarCabang: Cabang[]
}

export function LogAuditTable({ initialLogs, daftarCabang }: LogAuditTableProps) {
  const [logs, setLogs] = React.useState<LogAudit[]>(initialLogs)
  const [filterCabang, setFilterCabang] = React.useState<string>("all")
  const [filterAksi, setFilterAksi] = React.useState<string>("all")
  const [filterEntitas, setFilterEntitas] = React.useState<string>("all")
  const [pencarian, setPencarian] = React.useState<string>("")
  const [selectedLog, setSelectedLog] = React.useState<LogAudit | null>(null)
  const [copiedOld, setCopiedOld] = React.useState(false)
  const [copiedNew, setCopiedNew] = React.useState(false)

  // Filter logs locally
  const filteredLogs = React.useMemo(() => {
    let result = [...logs]

    if (filterCabang !== "all") {
      result = result.filter((log) => log.cabang_id === filterCabang)
    }

    if (filterAksi !== "all") {
      result = result.filter(
        (log) => (log.aksi || "").toUpperCase() === filterAksi.toUpperCase()
      )
    }

    if (filterEntitas !== "all") {
      result = result.filter(
        (log) =>
          (log.entitas || "").toLowerCase() === filterEntitas.toLowerCase() ||
          (log.tabel_nama || "").toLowerCase() === filterEntitas.toLowerCase()
      )
    }

    const keyword = pencarian.trim().toLowerCase()
    if (keyword) {
      result = result.filter(
        (log) =>
          (log.kode && log.kode.toLowerCase().includes(keyword)) ||
          (log.deskripsi && log.deskripsi.toLowerCase().includes(keyword)) ||
          (log.user_nama && log.user_nama.toLowerCase().includes(keyword)) ||
          (log.cabang_nama && log.cabang_nama.toLowerCase().includes(keyword)) ||
          (log.entitas && log.entitas.toLowerCase().includes(keyword)) ||
          (log.ip_address && log.ip_address.toLowerCase().includes(keyword))
      )
    }

    return result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [logs, filterCabang, filterAksi, filterEntitas, pencarian])

  // Unique entitas list from logs
  const daftarEntitasUnik = React.useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => {
      if (l.entitas) set.add(l.entitas)
      if (l.tabel_nama) set.add(l.tabel_nama)
    })
    return Array.from(set).sort()
  }, [logs])

  const copyToClipboard = async (
    data: unknown,
    type: "old" | "new"
  ) => {
    try {
      const text = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(text)
      if (type === "old") {
        setCopiedOld(true)
        setTimeout(() => setCopiedOld(false), 2000)
      } else {
        setCopiedNew(true)
        setTimeout(() => setCopiedNew(false), 2000)
      }
      toast.success("JSON berhasil disalin ke papan klip")
    } catch {
      toast.error("Gagal menyalin JSON")
    }
  }

  const handleResetFilter = () => {
    setFilterCabang("all")
    setFilterAksi("all")
    setFilterEntitas("all")
    setPencarian("")
  }

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Cari kode log, deskripsi, user, atau entitas..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Cabang */}
              <div className="w-[180px]">
                <Select value={filterCabang} onValueChange={(val) => setFilterCabang(val || "all")}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Semua Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Cabang</SelectItem>
                    {daftarCabang.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aksi */}
              <div className="w-[140px]">
                <Select value={filterAksi} onValueChange={(val) => setFilterAksi(val || "all")}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Semua Aksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Aksi</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="ADJUST">ADJUST</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Entitas */}
              <div className="w-[160px]">
                <Select
                  value={filterEntitas}
                  onValueChange={(val) => setFilterEntitas(val || "all")}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Semua Entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Entitas</SelectItem>
                    {daftarEntitasUnik.map((entitas) => (
                      <SelectItem key={entitas} value={entitas}>
                        {entitas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filter Button */}
              {(filterCabang !== "all" ||
                filterAksi !== "all" ||
                filterEntitas !== "all" ||
                pencarian) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilter}
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.5} className="mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={FilterIcon} size={13} strokeWidth={1.5} />
              Menampilkan <strong className="text-foreground">{filteredLogs.length}</strong> dari{" "}
              {logs.length} catatan aktivitas audit
            </span>
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              Audit Scoped
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-border/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[150px] text-xs font-semibold">Waktu & Tanggal</TableHead>
                <TableHead className="w-[140px] text-xs font-semibold">Kode Audit</TableHead>
                <TableHead className="w-[90px] text-xs font-semibold">Aksi</TableHead>
                <TableHead className="w-[120px] text-xs font-semibold">Entitas</TableHead>
                <TableHead className="min-w-[240px] text-xs font-semibold">Deskripsi Aktivitas</TableHead>
                <TableHead className="w-[160px] text-xs font-semibold">Pelaku / Pengguna</TableHead>
                <TableHead className="w-[160px] text-xs font-semibold">Cabang</TableHead>
                <TableHead className="w-[110px] text-xs font-semibold">IP Address</TableHead>
                <TableHead className="w-[80px] text-center text-xs font-semibold">Rincian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <HugeiconsIcon icon={ShieldUserIcon} size={32} strokeWidth={1.5} className="opacity-40" />
                      <p className="text-sm font-medium">Tidak ada log audit yang sesuai filter</p>
                      <p className="text-xs text-muted-foreground/80">
                        Coba ubah kriteria filter pencarian atau tanggal audit
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const badgeStyle = formatBadgeAksi(log.aksi)
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      {/* Waktu */}
                      <TableCell className="text-xs whitespace-nowrap font-medium text-foreground/80">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={Clock01Icon}
                            size={13}
                            strokeWidth={1.5}
                            className="text-muted-foreground"
                          />
                          {formatTanggalWaktuIndonesia(log.created_at)}
                        </div>
                      </TableCell>

                      {/* Kode Audit */}
                      <TableCell className="text-xs font-mono font-medium text-foreground">
                        {log.kode}
                      </TableCell>

                      {/* Aksi Badge */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border ${badgeStyle.bg} ${badgeStyle.color} ${badgeStyle.border}`}
                        >
                          {badgeStyle.label}
                        </span>
                      </TableCell>

                      {/* Entitas */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] tracking-wider uppercase bg-muted/60"
                        >
                          {log.entitas || log.tabel_nama}
                        </Badge>
                      </TableCell>

                      {/* Deskripsi */}
                      <TableCell className="text-xs text-foreground/90 leading-snug">
                        {log.deskripsi || "Tidak ada rincian deskriptif"}
                      </TableCell>

                      {/* Pelaku */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={UserIcon}
                            size={13}
                            strokeWidth={1.5}
                            className="text-muted-foreground"
                          />
                          <span className="font-medium text-foreground/80">
                            {log.user_nama || "Sistem / Otomatis"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Cabang */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={Store01Icon}
                            size={13}
                            strokeWidth={1.5}
                            className="text-muted-foreground"
                          />
                          <span>{log.cabang_nama || "Organisasi (Global)"}</span>
                        </div>
                      </TableCell>

                      {/* IP Address */}
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <HugeiconsIcon
                            icon={ComputerIcon}
                            size={12}
                            strokeWidth={1.5}
                            className="text-muted-foreground/70"
                          />
                          <span>{log.ip_address || "-"}</span>
                        </div>
                      </TableCell>

                      {/* Action Button */}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 hover:bg-muted"
                          title="Lihat Rincian JSON"
                          onClick={() => setSelectedLog(log)}
                        >
                          <HugeiconsIcon icon={ViewIcon} size={15} strokeWidth={1.5} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* JSON VIEWER DIALOG */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 gap-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={ShieldUserIcon}
                size={20}
                strokeWidth={1.5}
                className="text-primary"
              />
              <DialogTitle className="text-base font-semibold">
                Rincian Log Audit: {selectedLog?.kode}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Inspeksi rekam jejak perubahan data terperinci sebelum dan sesudah mutasi.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Meta Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/40 rounded-lg border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Aksi</span>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border mt-0.5 ${
                      formatBadgeAksi(selectedLog.aksi).bg
                    } ${formatBadgeAksi(selectedLog.aksi).color} ${
                      formatBadgeAksi(selectedLog.aksi).border
                    }`}
                  >
                    {selectedLog.aksi}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Entitas</span>
                  <span className="font-mono font-medium text-foreground mt-0.5 block">
                    {selectedLog.entitas || selectedLog.tabel_nama}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pelaku</span>
                  <span className="font-medium text-foreground mt-0.5 block">
                    {selectedLog.user_nama || "Sistem"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Waktu</span>
                  <span className="text-foreground mt-0.5 block">
                    {formatTanggalWaktuIndonesia(selectedLog.created_at)}
                  </span>
                </div>
              </div>

              {selectedLog.deskripsi && (
                <div className="p-3 bg-card rounded-lg border border-border/60 text-xs">
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Deskripsi Aktivitas
                  </span>
                  <p className="text-foreground">{selectedLog.deskripsi}</p>
                </div>
              )}

              {/* JSON Diff / Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Lama */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-rose-500" />
                      Data Sebelum (Lama)
                    </span>
                    {selectedLog.data_lama && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => copyToClipboard(selectedLog.data_lama, "old")}
                      >
                        <HugeiconsIcon
                          icon={copiedOld ? CheckmarkCircle02Icon : Copy01Icon}
                          size={12}
                          strokeWidth={1.5}
                          className="mr-1 text-muted-foreground"
                        />
                        {copiedOld ? "Tersalin" : "Salin"}
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg border border-border/80 bg-zinc-950 text-zinc-100 p-3 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed">
                    {selectedLog.data_lama ? (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.data_lama, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs">
                        Tidak ada data sebelumnya (Record baru)
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Baru */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Data Sesudah (Baru)
                    </span>
                    {selectedLog.data_baru && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => copyToClipboard(selectedLog.data_baru, "new")}
                      >
                        <HugeiconsIcon
                          icon={copiedNew ? CheckmarkCircle02Icon : Copy01Icon}
                          size={12}
                          strokeWidth={1.5}
                          className="mr-1 text-muted-foreground"
                        />
                        {copiedNew ? "Tersalin" : "Salin"}
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg border border-border/80 bg-zinc-950 text-zinc-100 p-3 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed">
                    {selectedLog.data_baru ? (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.data_baru, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-500 italic text-xs">
                        Tidak ada data baru (Record dihapus)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
