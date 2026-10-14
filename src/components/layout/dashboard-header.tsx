"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useActiveBranch } from "@/hooks/use-active-branch"
import {
  DEMO_BRANCHES,
  BranchTypeBadge,
  getBranchIcon,
} from "@/components/layout/branch-switcher"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon } from "@hugeicons/core-free-icons"
import { ThemeToggle } from "@/components/layout/theme-toggle"

interface RouteInfo {
  parent?: string
  title: string
}

const ROUTE_MAP: Record<string, RouteInfo> = {
  "/": { title: "Dashboard Overview" },
  "/dashboard": { title: "Dashboard Overview" },
  "/cabang": { parent: "Master Data", title: "Cabang & Gudang" },
  "/pengguna": { parent: "Master Data", title: "Pengguna & Hak Akses" },
  "/produk": { parent: "Master Data", title: "Master Produk" },
  "/kartu-stok": { parent: "Inventaris & Logistik", title: "Kartu Stok" },
  "/penyesuaian-stok": { parent: "Inventaris & Logistik", title: "Penyesuaian Stok" },
  "/log-audit": { parent: "Sistem", title: "Audit Trail" },
  "/pengaturan": { parent: "Sistem", title: "Pengaturan Organisasi" },
}

export function DashboardHeader() {
  const pathname = usePathname()
  const { activeBranchId } = useActiveBranch()

  const routeInfo = React.useMemo(() => {
    if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname]
    const matchedPrefix = Object.keys(ROUTE_MAP).find(
      (prefix) => prefix !== "/" && pathname.startsWith(prefix)
    )
    if (matchedPrefix) return ROUTE_MAP[matchedPrefix]
    return { title: "Zeropoint Admin" }
  }, [pathname])

  const activeBranch = React.useMemo(() => {
    if (!activeBranchId) return DEMO_BRANCHES[1] // Default HQ Jakarta
    return (
      DEMO_BRANCHES.find((b) => b.id === activeBranchId) ?? DEMO_BRANCHES[1]
    )
  }, [activeBranchId])

  const BranchIcon = getBranchIcon(activeBranch.tipe)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
                <HugeiconsIcon icon={Home01Icon} strokeWidth={1.5} className="size-3.5" />
                <span>Zeropoint</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {routeInfo.parent ? (
              <>
                <BreadcrumbSeparator className="hidden sm:inline-flex" />
                <BreadcrumbItem className="hidden sm:inline-flex text-muted-foreground">
                  <span>{routeInfo.parent}</span>
                </BreadcrumbItem>
              </>
            ) : null}
            <BreadcrumbSeparator className="hidden sm:inline-flex" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold">
                {routeInfo.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        {/* Branch Scope Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs">
          <div className="flex size-4 items-center justify-center text-primary">
            <HugeiconsIcon icon={BranchIcon} strokeWidth={1.5} className="size-3.5" />
          </div>
          <span className="font-medium text-foreground max-w-[140px] truncate md:max-w-none">
            {activeBranch.nama}
          </span>
          <BranchTypeBadge tipe={activeBranch.tipe} />
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" title="Cabang Aktif" />
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />
      </div>
    </header>
  )
}
