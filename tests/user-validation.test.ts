import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  userSchema,
  rolePenggunaEnum,
  urutkanUser,
  type UserInput,
  type RolePengguna,
  type UserWithCabang,
} from '@/lib/validasi/user'
import {
  ambilDaftarUser,
  ambilUserById,
  resetDemoUsers,
  demoUserStore,
  tambahDemoUser,
} from '@/server/queries/user'
import {
  simpanUserAction,
  hapusUserAction,
} from '@/server/actions/user'

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

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.reject(new Error('Supabase Offline'))),
}))

describe('User Validation Schema (userSchema)', () => {
  it('should accept valid minimal payload for superadmin with optional cabang_ids', () => {
    const input = {
      nama_lengkap: 'Superadmin Baru',
      email: 'superadmin.baru@zeropoint.local',
      role: 'superadmin',
    }

    const result = userSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nama_lengkap).toBe('Superadmin Baru')
      expect(result.data.email).toBe('superadmin.baru@zeropoint.local')
      expect(result.data.role).toBe('superadmin')
      expect(result.data.is_aktif).toBe(true)
      expect(result.data.cabang_ids).toEqual([])
    }
  })

  it('should accept valid complete payload with all optional fields and assigned branches', () => {
    const branchId = '10000000-0000-0000-0000-000000000001'
    const input = {
      nama_lengkap: 'Budi Santoso',
      email: 'budi@zeropoint.local',
      role: 'branch_manager',
      avatar_url: 'https://images.unsplash.com/photo-avatar',
      telepon: '0812-3456-7890',
      is_aktif: true,
      cabang_ids: [branchId],
      cabang_default_id: branchId,
    }

    const result = userSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nama_lengkap).toBe('Budi Santoso')
      expect(result.data.cabang_ids).toEqual([branchId])
      expect(result.data.cabang_default_id).toBe(branchId)
    }
  })

  it('should fail when nama_lengkap is empty or less than 2 characters', () => {
    const resEmpty = userSchema.safeParse({
      nama_lengkap: '',
      email: 'user@zeropoint.local',
      role: 'superadmin',
    })
    expect(resEmpty.success).toBe(false)
    if (!resEmpty.success) {
      expect(
        resEmpty.error.issues.some((i) =>
          i.message.includes('minimal 2 karakter')
        )
      ).toBe(true)
    }

    const resOneChar = userSchema.safeParse({
      nama_lengkap: 'A',
      email: 'user@zeropoint.local',
      role: 'superadmin',
    })
    expect(resOneChar.success).toBe(false)
  })

  it('should fail when email format is invalid', () => {
    const invalidEmails = [
      'bukan-email',
      'test@',
      '@domain.com',
      'user name@domain.com',
    ]

    invalidEmails.forEach((email) => {
      const result = userSchema.safeParse({
        nama_lengkap: 'John Doe',
        email,
        role: 'superadmin',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes('Format email tidak valid')
          )
        ).toBe(true)
      }
    })
  })

  it('should accept valid role enum values', () => {
    const validRoles: RolePengguna[] = [
      'superadmin',
      'hq_manager',
      'branch_manager',
      'staff',
      'viewer',
    ]

    validRoles.forEach((role) => {
      const cabang_ids =
        role === 'branch_manager' || role === 'staff'
          ? ['10000000-0000-0000-0000-000000000001']
          : []

      const result = userSchema.safeParse({
        nama_lengkap: `User ${role}`,
        email: `${role}@zeropoint.local`,
        role,
        cabang_ids,
      })
      expect(result.success).toBe(true)
    })
  })

  it('should reject invalid role string', () => {
    const result = userSchema.safeParse({
      nama_lengkap: 'Hacker',
      email: 'hacker@zeropoint.local',
      role: 'invalid_role_test',
    })
    expect(result.success).toBe(false)
  })

  it('should reject branch_manager without assigned branches (cabang_ids empty)', () => {
    const result = userSchema.safeParse({
      nama_lengkap: 'Manager Cabang',
      email: 'bm@zeropoint.local',
      role: 'branch_manager',
      cabang_ids: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('minimal 1 cabang')
        )
      ).toBe(true)
    }
  })

  it('should reject staff without assigned branches (cabang_ids empty)', () => {
    const result = userSchema.safeParse({
      nama_lengkap: 'Operator Gudang',
      email: 'staff@zeropoint.local',
      role: 'staff',
      cabang_ids: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes('minimal 1 cabang')
        )
      ).toBe(true)
    }
  })

  it('should allow superadmin and hq_manager without assigned branches', () => {
    const resSuperadmin = userSchema.safeParse({
      nama_lengkap: 'Direksi Global',
      email: 'direksi@zeropoint.local',
      role: 'superadmin',
      cabang_ids: [],
    })
    expect(resSuperadmin.success).toBe(true)

    const resHQ = userSchema.safeParse({
      nama_lengkap: 'Manager Pusat',
      email: 'hq@zeropoint.local',
      role: 'hq_manager',
      cabang_ids: [],
    })
    expect(resHQ.success).toBe(true)
  })

  it('should enforce that cabang_default_id must be included in cabang_ids if specified', () => {
    const validBranch1 = '10000000-0000-0000-0000-000000000001'
    const validBranch2 = '10000000-0000-0000-0000-000000000002'
    const unassignedBranch = '10000000-0000-0000-0000-000000000003'

    // Valid: default is in cabang_ids
    const validRes = userSchema.safeParse({
      nama_lengkap: 'Budi Branch',
      email: 'budi.branch@zeropoint.local',
      role: 'branch_manager',
      cabang_ids: [validBranch1, validBranch2],
      cabang_default_id: validBranch2,
    })
    expect(validRes.success).toBe(true)

    // Invalid: default is not in cabang_ids
    const invalidRes = userSchema.safeParse({
      nama_lengkap: 'Budi Branch',
      email: 'budi.branch@zeropoint.local',
      role: 'branch_manager',
      cabang_ids: [validBranch1, validBranch2],
      cabang_default_id: unassignedBranch,
    })
    expect(invalidRes.success).toBe(false)
    if (!invalidRes.success) {
      expect(
        invalidRes.error.issues.some((i) =>
          i.message.includes('Cabang default harus dipilih dari daftar cabang')
        )
      ).toBe(true)
    }
  })
})

describe('User Sorting Helper (urutkanUser)', () => {
  it('should sort users by role hierarchy (superadmin -> hq_manager -> branch_manager -> staff -> viewer) then alphabetically', () => {
    const sample = [
      { role: 'viewer' as RolePengguna, nama_lengkap: 'Zulham' },
      { role: 'staff' as RolePengguna, nama_lengkap: 'Budi' },
      { role: 'superadmin' as RolePengguna, nama_lengkap: 'Zul' },
      { role: 'superadmin' as RolePengguna, nama_lengkap: 'Agus' },
      { role: 'hq_manager' as RolePengguna, nama_lengkap: 'Chandra' },
      { role: 'branch_manager' as RolePengguna, nama_lengkap: 'Dian' },
    ]

    const sorted = urutkanUser(sample)
    expect(sorted[0].nama_lengkap).toBe('Agus')
    expect(sorted[0].role).toBe('superadmin')
    expect(sorted[1].nama_lengkap).toBe('Zul')
    expect(sorted[1].role).toBe('superadmin')
    expect(sorted[2].role).toBe('hq_manager')
    expect(sorted[3].role).toBe('branch_manager')
    expect(sorted[4].role).toBe('staff')
    expect(sorted[5].role).toBe('viewer')
  })
})

describe('User Queries (ambilDaftarUser & ambilUserById)', () => {
  beforeEach(() => {
    resetDemoUsers()
  })

  it('should return initial 4 demo users when Supabase is offline', async () => {
    const users = await ambilDaftarUser()
    expect(users.length).toBe(4)

    const codes = users.map((u) => u.kode)
    expect(codes).toContain('USR-0001')
    expect(codes).toContain('USR-0002')
    expect(codes).toContain('USR-0003')
    expect(codes).toContain('USR-0004')
  })

  it('should have USR-0001 as Superadmin Direksi with assigned HQ branch', async () => {
    const user = await ambilUserById('20000000-0000-0000-0000-000000000001')
    expect(user).not.toBeNull()
    expect(user?.kode).toBe('USR-0001')
    expect(user?.nama_lengkap).toBe('Superadmin Direksi')
    expect(user?.role).toBe('superadmin')
    expect(user?.cabang_list.length).toBeGreaterThan(0)
    expect(user?.cabang_list[0].kode).toBe('HQ-0001')
  })

  it('should return null for non-existent user ID', async () => {
    const user = await ambilUserById('99999999-9999-9999-9999-999999999999')
    expect(user).toBeNull()
  })
})

describe('User Server Actions (simpanUserAction & hapusUserAction)', () => {
  beforeEach(() => {
    resetDemoUsers()
  })

  it('should create a new user successfully with generated USR code and assigned branches', async () => {
    const branchId = '10000000-0000-0000-0000-000000000002'
    const input = {
      nama_lengkap: 'Hendra Gunawan',
      email: 'hendra@zeropoint.local',
      role: 'branch_manager' as RolePengguna,
      telepon: '0812-9999-8888',
      is_aktif: true,
      cabang_ids: [branchId],
      cabang_default_id: branchId,
    }

    const res = await simpanUserAction(input)
    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data?.nama_lengkap).toBe('Hendra Gunawan')
    expect(res.data?.kode).toMatch(/^USR-\d{4}$/)
    expect(res.data?.cabang_list.length).toBe(1)
    expect(res.data?.cabang_list[0].id).toBe(branchId)

    // Verify it appears in ambilDaftarUser
    const users = await ambilDaftarUser()
    expect(users.some((u) => u.nama_lengkap === 'Hendra Gunawan')).toBe(true)
  })

  it('should reject simpanUserAction with invalid input', async () => {
    const input = {
      nama_lengkap: '',
      email: 'invalid-email',
      role: 'staff' as RolePengguna,
      cabang_ids: [],
    }

    const res = await simpanUserAction(input)
    expect(res.success).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('should update existing user data and branch assignments', async () => {
    const userId = '20000000-0000-0000-0000-000000000004' // Ahmad Fauzi
    const newBranchId = '10000000-0000-0000-0000-000000000002'

    const res = await simpanUserAction(
      {
        nama_lengkap: 'Ahmad Fauzi Updated',
        email: 'ahmad.fauzi.new@zeropoint.local',
        role: 'staff',
        telepon: '0815-1111-2222',
        is_aktif: true,
        cabang_ids: [newBranchId],
        cabang_default_id: newBranchId,
      },
      userId
    )

    expect(res.success).toBe(true)
    expect(res.data?.nama_lengkap).toBe('Ahmad Fauzi Updated')
    expect(res.data?.email).toBe('ahmad.fauzi.new@zeropoint.local')
    expect(res.data?.cabang_list[0].id).toBe(newBranchId)

    const updatedUser = await ambilUserById(userId)
    expect(updatedUser?.nama_lengkap).toBe('Ahmad Fauzi Updated')
  })

  it('should fail when updating non-existent user', async () => {
    const res = await simpanUserAction(
      {
        nama_lengkap: 'Ghost User',
        email: 'ghost@zeropoint.local',
        role: 'superadmin',
        cabang_ids: [],
      },
      '99999999-9999-9999-9999-999999999999'
    )
    expect(res.success).toBe(false)
    expect(res.error).toContain('tidak ditemukan')
  })

  it('should soft-delete regular non-superadmin user successfully', async () => {
    const targetId = '20000000-0000-0000-0000-000000000004' // Staff Ahmad Fauzi
    const res = await hapusUserAction(targetId)
    expect(res.success).toBe(true)

    const user = await ambilUserById(targetId)
    expect(user).toBeNull()

    const allUsers = await ambilDaftarUser()
    expect(allUsers.some((u) => u.id === targetId)).toBe(false)
  })

  it('should PREVENT deleting the last active Superadmin in the system', async () => {
    const superadminId = '20000000-0000-0000-0000-000000000001'

    // At initial state, only 1 superadmin exists
    const res = await hapusUserAction(superadminId)
    expect(res.success).toBe(false)
    expect(res.error).toContain(
      'Tidak dapat menghapus pengguna dengan peran Superadmin terakhir'
    )

    // Ensure superadmin was NOT deleted
    const user = await ambilUserById(superadminId)
    expect(user).not.toBeNull()
    expect(user?.role).toBe('superadmin')
  })

  it('should allow deleting a Superadmin if another active Superadmin still exists', async () => {
    // Add a second superadmin
    const secondSuperadmin: UserWithCabang = {
      id: '20000000-0000-0000-0000-000000000099',
      kode: 'USR-0099',
      organisasi_id: '00000000-0000-0000-0000-000000000001',
      user_id: 'a0000000-0000-0000-0000-000000000099',
      email: 'superadmin2@zeropoint.local',
      nama_lengkap: 'Superadmin Kedua',
      role: 'superadmin',
      avatar_url: null,
      telepon: null,
      is_aktif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
      cabang_list: [],
      cabang_default_id: null,
    }
    tambahDemoUser(secondSuperadmin)

    // Now 2 active superadmins exist, deleting the first one should succeed
    const firstSuperadminId = '20000000-0000-0000-0000-000000000001'
    const res = await hapusUserAction(firstSuperadminId)
    expect(res.success).toBe(true)

    // The second superadmin should still be active
    const remaining = await ambilUserById('20000000-0000-0000-0000-000000000099')
    expect(remaining).not.toBeNull()

    // Now deleting the second superadmin should FAIL because it is the last one
    const resSecond = await hapusUserAction('20000000-0000-0000-0000-000000000099')
    expect(resSecond.success).toBe(false)
    expect(resSecond.error).toContain(
      'Tidak dapat menghapus pengguna dengan peran Superadmin terakhir'
    )
  })
})

describe('Design Constraints & Zero lucide-react verification', () => {
  it('should ensure zero imports from lucide-react in the entire src directory', () => {
    const srcDir = path.resolve(process.cwd(), 'src')

    function scanDir(dir: string): string[] {
      const results: string[] = []
      const list = fs.readdirSync(dir)
      list.forEach((file) => {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        if (stat && stat.isDirectory()) {
          results.push(...scanDir(fullPath))
        } else if (/\.(ts|tsx)$/.test(file)) {
          const content = fs.readFileSync(fullPath, 'utf8')
          if (content.includes('lucide-react')) {
            results.push(fullPath)
          }
        }
      })
      return results
    }

    const offendingFiles = scanDir(srcDir)
    expect(offendingFiles).toEqual([])
  })
})
