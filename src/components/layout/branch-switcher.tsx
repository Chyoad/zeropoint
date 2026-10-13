"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useActiveBranch } from "@/hooks/use-active-branch"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building04Icon,
  Store01Icon,
  WarehouseIcon,
  Layers01Icon,
  UnfoldMoreIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

export type BranchType = "pusat" | "cabang" | "gudang" | "konsolidasi"

export interface BranchItem {
  id: string
  kode: string
  nama: string
  tipe: BranchType
  kota?: string
}

export const DEMO_BRANCHES: BranchItem[] = [
  {
    id: "all",
    kode: "ALL",
    nama: "Semua Cabang (Konsolidasi)",
    tipe: "konsolidasi",
  },
  {
    id: "10000000-0000-0000-0000-000000000001",
    kode: "HQ-0001",
    nama: "Kantor Pusat Jakarta (HQ)",
    tipe: "pusat",
    kota: "Jakarta Selatan",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    kode: "CBG-0001",
    nama: "Cabang Surabaya",
    tipe: "cabang",
    kota: "Surabaya",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    kode: "GDG-0001",
    nama: "Gudang Logistik Cikarang",
    tipe: "gudang",
    kota: "Cikarang, Bekasi",
  },
]

export function getBranchIcon(tipe: BranchType) {
  switch (tipe) {
    case "pusat":
      return Building04Icon
    case "cabang":
      return Store01Icon
    case "gudang":
      return WarehouseIcon
    case "konsolidasi":
      return Layers01Icon
    default:
      return Building04Icon
  }
}

export function getBranchBadgeLabel(tipe: BranchType): string {
  switch (tipe) {
    case "pusat":
      return "HQ"
    case "cabang":
      return "Cabang"
    case "gudang":
      return "Gudang"
    case "konsolidasi":
      return "Konsolidasi"
    default:
      return tipe
  }
}

export function BranchTypeBadge({ tipe }: { tipe: BranchType }) {
  const label = getBranchBadgeLabel(tipe)
  switch (tipe) {
    case "pusat":
      return (
        <Badge
          variant="default"
          className="h-4 px-1.5 py-0 text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-600"
        >
          {label}
        </Badge>
      )
    case "cabang":
      return (
        <Badge
          variant="secondary"
          className="h-4 px-1.5 py-0 text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
        >
          {label}
        </Badge>
      )
    case "gudang":
      return (
        <Badge
          variant="outline"
          className="h-4 px-1.5 py-0 text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
        >
          {label}
        </Badge>
      )
    case "konsolidasi":
      return (
        <Badge
          variant="outline"
          className="h-4 px-1.5 py-0 text-[10px] font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30"
        >
          {label}
        </Badge>
      )
  }
}

export interface BranchSwitcherProps {
  branches?: BranchItem[]
}

export function BranchSwitcher({ branches = DEMO_BRANCHES }: BranchSwitcherProps) {
  const { isMobile } = useSidebar()
  const { activeBranchId, setActiveBranch, isPending } = useActiveBranch()

  // Default to HQ if null, or match active branch
  const activeBranch = React.useMemo(() => {
    if (!activeBranchId) {
      return (
        branches.find((b) => b.tipe === "pusat") ??
        branches[0] ??
        DEMO_BRANCHES[1]
      )
    }
    const found = branches.find((b) => b.id === activeBranchId)
    return (
      found ??
      branches.find((b) => b.tipe === "pusat") ??
      branches[0] ??
      DEMO_BRANCHES[1]
    )
  }, [branches, activeBranchId])

  const handleSelect = React.useCallback(
    async (branchId: string) => {
      if (branchId === activeBranch.id) return
      await setActiveBranch(branchId === "all" ? "all" : branchId)
    },
    [activeBranch.id, setActiveBranch]
  )

  const activeIcon = getBranchIcon(activeBranch.tipe)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                aria-label={`Pilih cabang aktif, saat ini: ${activeBranch.nama}`}
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <HugeiconsIcon
                icon={activeIcon}
                strokeWidth={1.5}
                className="size-4 shrink-0"
              />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold">{activeBranch.nama}</span>
                <BranchTypeBadge tipe={activeBranch.tipe} />
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {activeBranch.kode}
                {activeBranch.kota ? ` • ${activeBranch.kota}` : ""}
                {isPending ? " (Memperbarui...)" : ""}
              </span>
            </div>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              strokeWidth={1.5}
              className="ms-auto size-4 shrink-0 text-muted-foreground"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                Konsolidasi Organisasi
              </DropdownMenuLabel>
              {branches
                .filter((b) => b.tipe === "konsolidasi")
                .map((branch) => {
                  const isSelected = activeBranch.id === branch.id
                  const IconComp = getBranchIcon(branch.tipe)
                  return (
                    <DropdownMenuItem
                      key={branch.id}
                      onClick={() => handleSelect(branch.id)}
                      className="gap-2 p-2 cursor-pointer"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md border bg-muted/40">
                        <HugeiconsIcon
                          icon={IconComp}
                          strokeWidth={1.5}
                          className="size-4"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">
                            {branch.nama}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Semua cabang & gudang
                        </span>
                      </div>
                      <BranchTypeBadge tipe={branch.tipe} />
                      {isSelected ? (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          strokeWidth={1.5}
                          className="size-4 text-primary shrink-0"
                        />
                      ) : null}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                Cabang & Fasilitas Operasional
              </DropdownMenuLabel>
              {branches
                .filter((b) => b.tipe !== "konsolidasi")
                .map((branch) => {
                  const isSelected = activeBranch.id === branch.id
                  const IconComp = getBranchIcon(branch.tipe)
                  return (
                    <DropdownMenuItem
                      key={branch.id}
                      onClick={() => handleSelect(branch.id)}
                      className="gap-2 p-2 cursor-pointer"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md border bg-muted/40">
                        <HugeiconsIcon
                          icon={IconComp}
                          strokeWidth={1.5}
                          className="size-4"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">
                            {branch.nama}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {branch.kode}
                          {branch.kota ? ` • ${branch.kota}` : ""}
                        </span>
                      </div>
                      <BranchTypeBadge tipe={branch.tipe} />
                      {isSelected ? (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          strokeWidth={1.5}
                          className="size-4 text-primary shrink-0"
                        />
                      ) : null}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
