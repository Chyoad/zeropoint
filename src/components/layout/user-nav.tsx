"use client"

import * as React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UnfoldMoreIcon,
  UserIcon,
  UserSettings01Icon,
  Logout01Icon,
  Sun01Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons"

export interface UserNavProps {
  user?: {
    name: string
    email: string
    role?: string
    avatar?: string
  }
}

const DEFAULT_USER = {
  name: "Superadmin Direksi",
  email: "admin@zeropoint.local",
  role: "Superadmin",
  avatar: "",
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function UserNav({ user = DEFAULT_USER }: UserNavProps) {
  const { isMobile } = useSidebar()
  const { setTheme, resolvedTheme } = useTheme()
  const role = user.role ?? "Superadmin"
  const initials = getInitials(user.name)

  const handleLogout = React.useCallback(() => {
    // In production, this can call Supabase auth.signOut() or redirect to /login
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                aria-label={`Menu pengguna untuk ${user.name}`}
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name} />
              ) : null}
              <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-semibold">{user.name}</span>
                <Badge
                  variant="outline"
                  className="h-4 px-1 py-0 text-[10px] font-medium border-primary/30 bg-primary/5 text-primary"
                >
                  {role}
                </Badge>
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              strokeWidth={1.5}
              className="ms-auto size-4 shrink-0 text-muted-foreground"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-2 py-2 text-start text-sm">
                  <Avatar className="size-9 rounded-lg">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className="h-4 px-1 py-0 text-[10px] font-medium border-primary/30 bg-primary/5 text-primary"
                      >
                        {role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <HugeiconsIcon
                  icon={UserIcon}
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span>Profil Akun</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                <HugeiconsIcon
                  icon={resolvedTheme === "dark" ? Sun01Icon : Moon02Icon}
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span>Tema: {resolvedTheme === "dark" ? "Beralih ke Terang" : "Beralih ke Gelap"}</span>
                <span className="ms-auto text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                  D
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <HugeiconsIcon
                icon={Logout01Icon}
                strokeWidth={1.5}
                className="size-4 shrink-0 text-destructive"
              />
              <span>Keluar (Logout)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
