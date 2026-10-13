import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  ACTIVE_BRANCH_COOKIE,
  isValidBranchId,
  parseActiveBranchId,
  getActiveBranchId,
  setActiveBranchAction,
} from '@/server/actions/branch-session'
import { useActiveBranch } from '@/hooks/use-active-branch'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

// Mock next/headers and next/cache
const mockCookieStore = {
  get: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Active Branch Session & Supabase SSR Clients', () => {
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const anotherUUID = 'b1ffcd00-0d1c-4fe9-cc7e-7cc0ce491b22'
  const invalidUUID = 'not-a-valid-uuid'

  beforeEach(() => {
    vi.clearAllMocks()
    mockCookieStore.get.mockReset()
    mockCookieStore.getAll.mockReset()
    mockCookieStore.set.mockReset()
    mockCookieStore.delete.mockReset()

    // Reset document cookie
    if (typeof document !== 'undefined') {
      document.cookie = `${ACTIVE_BRANCH_COOKIE}=; max-age=0; path=/`
    }
  })

  describe('Cookie constant & Validation', () => {
    it('should define the active branch cookie name as zeropoint_active_branch_id', () => {
      expect(ACTIVE_BRANCH_COOKIE).toBe('zeropoint_active_branch_id')
    })

    it('should validate branchId as valid when "all"', () => {
      expect(isValidBranchId('all')).toBe(true)
    })

    it('should validate branchId as valid when standard UUID', () => {
      expect(isValidBranchId(validUUID)).toBe(true)
      expect(isValidBranchId(anotherUUID)).toBe(true)
    })

    it('should invalidate malformed or non-UUID branchId', () => {
      expect(isValidBranchId(invalidUUID)).toBe(false)
      expect(isValidBranchId('')).toBe(false)
      expect(isValidBranchId('   ')).toBe(false)
      expect(isValidBranchId('all-branches')).toBe(false)
      expect(isValidBranchId(12345 as unknown as string)).toBe(false)
      expect(isValidBranchId(null as unknown as string)).toBe(false)
      expect(isValidBranchId(undefined as unknown as string)).toBe(false)
    })

    it('should correctly parse active branch ID or return null on invalid input', () => {
      expect(parseActiveBranchId('all')).toBe('all')
      expect(parseActiveBranchId(validUUID)).toBe(validUUID)
      expect(parseActiveBranchId(invalidUUID)).toBeNull()
      expect(parseActiveBranchId('')).toBeNull()
      expect(parseActiveBranchId(null)).toBeNull()
      expect(parseActiveBranchId(undefined)).toBeNull()
    })
  })

  describe('Server Action: getActiveBranchId', () => {
    it('should return null when cookie is not set', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await getActiveBranchId()
      expect(result).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith(ACTIVE_BRANCH_COOKIE)
    })

    it('should return "all" when cookie is "all"', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'all' })

      const result = await getActiveBranchId()
      expect(result).toBe('all')
    })

    it('should return valid UUID when cookie holds valid UUID', async () => {
      mockCookieStore.get.mockReturnValue({ value: validUUID })

      const result = await getActiveBranchId()
      expect(result).toBe(validUUID)
    })

    it('should return null when cookie contains corrupt/invalid string', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-uuid-value' })

      const result = await getActiveBranchId()
      expect(result).toBeNull()
    })
  })

  describe('Server Action: setActiveBranchAction', () => {
    it('should set cookie and revalidate layout when called with valid UUID', async () => {
      const { revalidatePath } = await import('next/cache')

      const result = await setActiveBranchAction(validUUID)

      expect(result).toEqual({ success: true, branchId: validUUID })
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        ACTIVE_BRANCH_COOKIE,
        validUUID,
        expect.objectContaining({
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
          httpOnly: false,
          sameSite: 'lax',
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('should set cookie and revalidate layout when called with "all"', async () => {
      const { revalidatePath } = await import('next/cache')

      const result = await setActiveBranchAction('all')

      expect(result).toEqual({ success: true, branchId: 'all' })
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        ACTIVE_BRANCH_COOKIE,
        'all',
        expect.objectContaining({
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
          httpOnly: false,
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('should throw error when called with invalid branchId', async () => {
      await expect(setActiveBranchAction(invalidUUID)).rejects.toThrow(
        /ID Cabang tidak valid/
      )
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })
  })

  describe('React Hook: useActiveBranch', () => {
    it('should initialize with initialBranchId option', () => {
      const { result } = renderHook(() =>
        useActiveBranch({ initialBranchId: validUUID })
      )

      expect(result.current.activeBranchId).toBe(validUUID)
      expect(result.current.isAllBranches).toBe(false)
      expect(result.current.isPending).toBe(false)
    })

    it('should reflect isAllBranches = true when initialBranchId is "all"', () => {
      const { result } = renderHook(() =>
        useActiveBranch({ initialBranchId: 'all' })
      )

      expect(result.current.activeBranchId).toBe('all')
      expect(result.current.isAllBranches).toBe(true)
    })

    it('should update state and invoke setActiveBranchAction on setActiveBranch', async () => {
      const { result } = renderHook(() =>
        useActiveBranch({ initialBranchId: validUUID })
      )

      await act(async () => {
        await result.current.setActiveBranch('all')
      })

      expect(result.current.activeBranchId).toBe('all')
      expect(result.current.isAllBranches).toBe(true)
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        ACTIVE_BRANCH_COOKIE,
        'all',
        expect.anything()
      )
    })

    it('should switch between branches and update state accordingly', async () => {
      const { result } = renderHook(() =>
        useActiveBranch({ initialBranchId: 'all' })
      )

      expect(result.current.isAllBranches).toBe(true)

      await act(async () => {
        await result.current.setActiveBranch(anotherUUID)
      })

      expect(result.current.activeBranchId).toBe(anotherUUID)
      expect(result.current.isAllBranches).toBe(false)
    })

    it('should reject invalid branch ID with error', async () => {
      const { result } = renderHook(() => useActiveBranch())

      await expect(
        act(async () => {
          await result.current.setActiveBranch('invalid-branch-id')
        })
      ).rejects.toThrow(/ID Cabang tidak valid/)
    })
  })

  describe('Supabase SSR Clients Instantiation', () => {
    it('should instantiate browser client with fallback defaults without error', () => {
      const client = createBrowserClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should instantiate server client with fallback defaults without error', async () => {
      mockCookieStore.getAll.mockReturnValue([])
      const client = await createServerClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should run updateSession middleware without error', async () => {
      const req = new NextRequest('http://localhost:3000/dashboard')
      const response = await updateSession(req)
      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })
  })
})
