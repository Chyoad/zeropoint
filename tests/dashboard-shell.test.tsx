import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import * as fs from "fs"
import * as path from "path"
import {
  BranchSwitcher,
  BranchTypeBadge,
  getBranchIcon,
  getBranchBadgeLabel,
  DEMO_BRANCHES,
} from "@/components/layout/branch-switcher"
import {
  AppSidebar,
  NAVIGATION_SECTIONS,
} from "@/components/layout/app-sidebar"
import { UserNav } from "@/components/layout/user-nav"
import { SidebarProvider } from "@/components/ui/sidebar"
import DashboardPage from "@/app/(dashboard)/page"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Mock useActiveBranch hook
vi.mock("@/hooks/use-active-branch", () => ({
  useActiveBranch: () => ({
    activeBranchId: "10000000-0000-0000-0000-000000000001",
    setActiveBranch: vi.fn(),
    isAllBranches: false,
    isPending: false,
  }),
  ActiveBranchProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe("Task 5: Dashboard Shell & Hugeicons Migration", () => {
  describe("1. BranchSwitcher & Branch Type Helpers", () => {
    it("should provide 4 demo branches including Konsolidasi", () => {
      expect(DEMO_BRANCHES).toHaveLength(4)
      const ids = DEMO_BRANCHES.map((b) => b.id)
      expect(ids).toContain("all")
      expect(ids).toContain("10000000-0000-0000-0000-000000000001")
      expect(ids).toContain("10000000-0000-0000-0000-000000000002")
      expect(ids).toContain("10000000-0000-0000-0000-000000000003")
    })

    it("should map branch types to correct badge labels", () => {
      expect(getBranchBadgeLabel("pusat")).toBe("HQ")
      expect(getBranchBadgeLabel("cabang")).toBe("Cabang")
      expect(getBranchBadgeLabel("gudang")).toBe("Gudang")
      expect(getBranchBadgeLabel("konsolidasi")).toBe("Konsolidasi")
    })

    it("should map branch types to valid Hugeicons icon definitions", () => {
      expect(getBranchIcon("pusat")).toBeDefined()
      expect(getBranchIcon("cabang")).toBeDefined()
      expect(getBranchIcon("gudang")).toBeDefined()
      expect(getBranchIcon("konsolidasi")).toBeDefined()
    })

    it("should render BranchTypeBadge correctly", () => {
      const { container: hqBadge } = render(<BranchTypeBadge tipe="pusat" />)
      expect(hqBadge.textContent).toContain("HQ")

      const { container: cabangBadge } = render(<BranchTypeBadge tipe="cabang" />)
      expect(cabangBadge.textContent).toContain("Cabang")

      const { container: gudangBadge } = render(<BranchTypeBadge tipe="gudang" />)
      expect(gudangBadge.textContent).toContain("Gudang")

      const { container: konsolidasiBadge } = render(<BranchTypeBadge tipe="konsolidasi" />)
      expect(konsolidasiBadge.textContent).toContain("Konsolidasi")
    })

    it("should render active branch in BranchSwitcher within SidebarProvider", () => {
      render(
        <SidebarProvider>
          <BranchSwitcher />
        </SidebarProvider>
      )
      // Active branch is Jakarta HQ
      expect(screen.getByText("Kantor Pusat Jakarta (HQ)")).toBeDefined()
      expect(screen.getByText("HQ-0001 • Jakarta Selatan")).toBeDefined()
    })
  })

  describe("2. AppSidebar Navigation Structure", () => {
    it("should define all 4 required navigation sections matching the Zeropoint spec", () => {
      const sectionTitles = NAVIGATION_SECTIONS.map((s) => s.title)
      expect(sectionTitles).toEqual([
        "Ringkasan",
        "Master Data",
        "Inventaris & Logistik",
        "Sistem",
      ])
    })

    it("should define all 8 required navigation menu items with proper URLs", () => {
      const allUrls = NAVIGATION_SECTIONS.flatMap((s) =>
        s.items.map((i) => i.url)
      )
      expect(allUrls).toEqual([
        "/dashboard",
        "/cabang",
        "/pengguna",
        "/produk",
        "/kartu-stok",
        "/penyesuaian-stok",
        "/log-audit",
        "/pengaturan",
      ])
    })

    it("should render AppSidebar with menu items and trigger in SidebarProvider", () => {
      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      )

      expect(screen.getByText("Ringkasan")).toBeDefined()
      expect(screen.getByText("Master Data")).toBeDefined()
      expect(screen.getByText("Inventaris & Logistik")).toBeDefined()
      expect(screen.getByText("Sistem")).toBeDefined()

      expect(screen.getByText("Dashboard")).toBeDefined()
      expect(screen.getByText("Cabang & Gudang")).toBeDefined()
      expect(screen.getByText("Pengguna & Hak Akses")).toBeDefined()
      expect(screen.getByText("Master Produk")).toBeDefined()
      expect(screen.getByText("Kartu Stok")).toBeDefined()
      expect(screen.getByText("Penyesuaian Stok")).toBeDefined()
      expect(screen.getByText("Audit Trail")).toBeDefined()
      expect(screen.getByText("Pengaturan")).toBeDefined()
    })
  })

  describe("3. UserNav Component", () => {
    it("should render user avatar, name, email and role badge", () => {
      render(
        <SidebarProvider>
          <UserNav
            user={{
              name: "Superadmin Direksi",
              email: "admin@zeropoint.local",
              role: "Superadmin",
            }}
          />
        </SidebarProvider>
      )

      expect(screen.getByText("Superadmin Direksi")).toBeDefined()
      expect(screen.getByText("admin@zeropoint.local")).toBeDefined()
      expect(screen.getByText("Superadmin")).toBeDefined()
      expect(screen.getByText("SD")).toBeDefined() // Initials
    })
  })

  describe("4. Dashboard Overview Page", () => {
    it("should render KPI cards and spotlight inventory items", () => {
      render(<DashboardPage />)

      // KPI card titles
      expect(screen.getByText("Total Produk Aktif")).toBeDefined()
      expect(screen.getByText("Total Nilai Persediaan")).toBeDefined()
      expect(screen.getByText("Peringatan Stok Minimum")).toBeDefined()
      expect(screen.getByText("Status Cabang")).toBeDefined()

      // Quick access links
      expect(screen.getByText("Master Produk & Multi-Satuan")).toBeDefined()
      expect(screen.getByText("Buku Besar Kartu Stok")).toBeDefined()
      expect(screen.getByText("Penyesuaian Stok (Opname)")).toBeDefined()

      // Spotlight products from seed
      expect(screen.getByText("Indomie Goreng Spesial")).toBeDefined()
      expect(screen.getByText("Kopi Kapal Api Spesial 65g")).toBeDefined()
      expect(screen.getByText("Teh Botol Sosro Kotak 250ml")).toBeDefined()
    })
  })

  describe("5. Zero Lucide Icons Verification", () => {
    const layoutFiles = [
      "src/components/layout/branch-switcher.tsx",
      "src/components/layout/app-sidebar.tsx",
      "src/components/layout/user-nav.tsx",
      "src/components/layout/dashboard-header.tsx",
      "src/app/(dashboard)/layout.tsx",
      "src/app/(dashboard)/page.tsx",
      "src/app/(dashboard)/dashboard/page.tsx",
    ]

    it("should have zero imports of lucide-react across all layout and dashboard files", () => {
      for (const file of layoutFiles) {
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, "utf-8")
        expect(content).not.toContain("lucide-react")
      }
    })

    it("should import icons from @hugeicons/react or @hugeicons/core-free-icons", () => {
      for (const file of layoutFiles) {
        if (file.endsWith("layout.tsx") || file.endsWith("dashboard/page.tsx")) continue
        const fullPath = path.resolve(process.cwd(), file)
        const content = fs.readFileSync(fullPath, "utf-8")
        const hasHugeicons =
          content.includes("@hugeicons/react") ||
          content.includes("@hugeicons/core-free-icons")
        expect(hasHugeicons).toBe(true)
      }
    })
  })
})
