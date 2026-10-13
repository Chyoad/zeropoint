'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  ACTIVE_BRANCH_COOKIE,
  isValidBranchId,
  parseActiveBranchId,
} from '@/lib/branch-session'

export async function getActiveBranchId(): Promise<string | null> {
  const cookieStore = await cookies()
  const branchCookie = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value
  return parseActiveBranchId(branchCookie)
}

export async function setActiveBranchAction(
  branchId: string | 'all'
): Promise<{ success: boolean; branchId: string | 'all' }> {
  if (!isValidBranchId(branchId)) {
    throw new Error(
      `ID Cabang tidak valid: format harus UUID atau "all". Diterima: ${String(branchId)}`
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_BRANCH_COOKIE, branchId, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 hari dalam detik
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  revalidatePath('/', 'layout')

  return { success: true, branchId }
}
