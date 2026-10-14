"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { BranchSwitcher } from "@/components/layout/branch-switcher"
import { UserNav } from "@/components/layout/user-nav"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  Store01Icon,
  UserGroupIcon,
  PackageIcon,
  Invoice01Icon,
  Task01Icon,
  ShieldUserIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"

export interface NavItem {
  title: string
  url: string
  icon: typeof DashboardSquare01Icon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: "Ringkasan",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: DashboardSquare01Icon,
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      {
        title: "Cabang & Gudang",
        url: "/cabang",
        icon: Store01Icon,
      },
      {
        title: "Pengguna & Hak Akses",
        url: "/pengguna",
        icon: UserGroupIcon,
      },
      {
        title: "Master Produk",
        url: "/produk",
        icon: PackageIcon,
      },
    ],
  },
  {
    title: "Inventaris & Logistik",
    items: [
      {
        title: "Kartu Stok",
        url: "/kartu-stok",
        icon: Invoice01Icon,
      },
      {
        title: "Penyesuaian Stok",
        url: "/penyesuaian-stok",
        icon: Task01Icon,
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      {
        title: "Audit Trail",
        url: "/log-audit",
        icon: ShieldUserIcon,
      },
      {
        title: "Pengaturan",
        url: "/pengaturan",
        icon: Settings02Icon,
      },
    ],
  },
]

export function AppSidebar({
  variant = "floating",
  collapsible = "icon",
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const isRouteActive = React.useCallback(
    (url: string) => {
      if (url === "/dashboard") {
        return pathname === "/dashboard" || pathname === "/"
      }
      return pathname === url || pathname.startsWith(`${url}/`)
    },
    [pathname]
  )

  return (
    <Sidebar variant={variant} collapsible={collapsible} {...props}>
      <SidebarHeader>
        <BranchSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {NAVIGATION_SECTIONS.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = isRouteActive(item.url)
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        strokeWidth={1.5}
                        className="size-4 shrink-0"
                      />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
