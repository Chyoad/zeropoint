'use client'

import React, {
  createContext,
  useContext,
  useState,
  useTransition,
  useCallback,
  type ReactNode,
} from 'react'
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

function setClientCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

const ActiveBranchContext = createContext<UseActiveBranchReturn | null>(null)

export interface ActiveBranchProviderProps {
  initialBranchId?: string | null
  children: ReactNode
}

export function ActiveBranchProvider({
  initialBranchId,
  children,
}: ActiveBranchProviderProps) {
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(() =>
    isValidBranchId(initialBranchId) ? initialBranchId : null
  )

  const [prevInitialBranchId, setPrevInitialBranchId] = useState(
    initialBranchId
  )

  // Adjust state during render when initialBranchId prop changes
  if (initialBranchId !== prevInitialBranchId) {
    setPrevInitialBranchId(initialBranchId)
    setActiveBranchIdState(
      isValidBranchId(initialBranchId) ? initialBranchId : null
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

      setActiveBranchIdState(branchId)
      setClientCookie(ACTIVE_BRANCH_COOKIE, branchId)

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

  const value: UseActiveBranchReturn = {
    activeBranchId,
    setActiveBranch,
    isAllBranches: activeBranchId === 'all',
    isPending,
  }

  return React.createElement(
    ActiveBranchContext.Provider,
    { value },
    children
  )
}

export function useActiveBranch(
  options?: UseActiveBranchOptions
): UseActiveBranchReturn {
  const context = useContext(ActiveBranchContext)

  const [localBranchId, setLocalBranchId] = useState<string | null>(() =>
    isValidBranchId(options?.initialBranchId) ? options.initialBranchId : null
  )
  const [prevInitial, setPrevInitial] = useState(options?.initialBranchId)

  if (options?.initialBranchId !== prevInitial) {
    setPrevInitial(options?.initialBranchId)
    setLocalBranchId(
      isValidBranchId(options?.initialBranchId) ? options.initialBranchId : null
    )
  }

  const [localPending, startLocalTransition] = useTransition()

  const localSetActiveBranch = useCallback(
    async (branchId: string | 'all') => {
      if (!isValidBranchId(branchId)) {
        throw new Error(
          `ID Cabang tidak valid: format harus UUID atau "all". Diterima: ${String(branchId)}`
        )
      }
      setLocalBranchId(branchId)
      setClientCookie(ACTIVE_BRANCH_COOKIE, branchId)

      await new Promise<void>((resolve, reject) => {
        startLocalTransition(async () => {
          try {
            await setActiveBranchAction(branchId)
            resolve()
          } catch (err) {
            reject(err)
          }
        })
      })
    },
    [startLocalTransition]
  )

  if (context && options?.initialBranchId === undefined) {
    return context
  }

  return {
    activeBranchId: localBranchId,
    setActiveBranch: localSetActiveBranch,
    isAllBranches: localBranchId === 'all',
    isPending: localPending,
  }
}
