'use client'

import { useState, useTransition, useCallback } from 'react'
import {
  ACTIVE_BRANCH_COOKIE,
  isValidBranchId,
} from '@/lib/branch-session'
import { setActiveBranchAction } from '@/server/actions/branch-session'

export interface UseActiveBranchOptions {
  initialBranchId?: string | null
}

export interface UseActiveBranchReturn {
  activeBranchId: string | null
  setActiveBranch: (branchId: string | 'all') => Promise<void>
  isAllBranches: boolean
  isPending: boolean
}

function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + name + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

function setClientCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function useActiveBranch(
  options?: UseActiveBranchOptions
): UseActiveBranchReturn {
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(
    () => {
      if (options?.initialBranchId !== undefined) {
        return isValidBranchId(options.initialBranchId)
          ? options.initialBranchId
          : null
      }
      const cookieVal = getClientCookie(ACTIVE_BRANCH_COOKIE)
      return isValidBranchId(cookieVal) ? cookieVal : null
    }
  )

  const [prevInitialBranchId, setPrevInitialBranchId] = useState(
    options?.initialBranchId
  )

  // Adjust state during render when initialBranchId prop changes
  if (options?.initialBranchId !== prevInitialBranchId) {
    setPrevInitialBranchId(options?.initialBranchId)
    setActiveBranchIdState(
      isValidBranchId(options?.initialBranchId) ? options.initialBranchId : null
    )
  }

  const [isPending, startTransition] = useTransition()

  const setActiveBranch = useCallback(
    async (branchId: string | 'all') => {
      if (!isValidBranchId(branchId)) {
        throw new Error(
          `ID Cabang tidak valid: format harus UUID atau "all". Diterima: ${String(branchId)}`
        )
      }

      // Update state client secara optimistik dan tulis cookie client
      setActiveBranchIdState(branchId)
      setClientCookie(ACTIVE_BRANCH_COOKIE, branchId)

      // Jalankan server action dalam transisi React
      await new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            await setActiveBranchAction(branchId)
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    },
    [startTransition]
  )

  const isAllBranches = activeBranchId === 'all'

  return {
    activeBranchId,
    setActiveBranch,
    isAllBranches,
    isPending,
  }
}
