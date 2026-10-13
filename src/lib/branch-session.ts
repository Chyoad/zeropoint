export const ACTIVE_BRANCH_COOKIE = 'zeropoint_active_branch_id'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidBranchId(branchId: unknown): branchId is string | 'all' {
  if (typeof branchId !== 'string') return false
  if (branchId === 'all') return true
  return UUID_REGEX.test(branchId.trim())
}

export function parseActiveBranchId(
  cookieValue?: string | null
): string | null {
  if (!cookieValue) return null
  return isValidBranchId(cookieValue) ? cookieValue.trim() : null
}
