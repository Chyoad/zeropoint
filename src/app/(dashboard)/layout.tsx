import * as React from "react"
import { cookies } from "next/headers"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { ACTIVE_BRANCH_COOKIE, parseActiveBranchId } from "@/lib/branch-session"
import { ActiveBranchProvider } from "@/hooks/use-active-branch"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const activeBranchId = parseActiveBranchId(
    cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value
  )

  return (
    <ActiveBranchProvider initialBranchId={activeBranchId}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ActiveBranchProvider>
  )
}
