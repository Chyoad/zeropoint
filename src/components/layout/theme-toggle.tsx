"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

const emptySubscribe = () => () => {}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground"
        aria-label="Pilih tema tampilan"
        disabled
      >
        <HugeiconsIcon icon={Sun01Icon} strokeWidth={1.5} className="size-4 opacity-50" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60"
            aria-label="Ubah tema tampilan (Terang / Gelap / Sistem)"
          />
        }
      >
        {isDark ? (
          <HugeiconsIcon
            icon={Moon02Icon}
            strokeWidth={1.5}
            className="size-4 text-primary transition-transform duration-200"
          />
        ) : (
          <HugeiconsIcon
            icon={Sun01Icon}
            strokeWidth={1.5}
            className="size-4 text-amber-500 transition-transform duration-200"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          className="flex items-center justify-between gap-2 cursor-pointer text-xs"
          onClick={() => setTheme("light")}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Sun01Icon} strokeWidth={1.5} className="size-3.5 text-amber-500" />
            <span>Terang</span>
          </div>
          {theme === "light" && (
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center justify-between gap-2 cursor-pointer text-xs"
          onClick={() => setTheme("dark")}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Moon02Icon} strokeWidth={1.5} className="size-3.5 text-primary" />
            <span>Gelap</span>
          </div>
          {theme === "dark" && (
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center justify-between gap-2 cursor-pointer text-xs"
          onClick={() => setTheme("system")}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={ComputerIcon} strokeWidth={1.5} className="size-3.5 text-muted-foreground" />
            <span>Sistem</span>
          </div>
          {theme === "system" && (
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
