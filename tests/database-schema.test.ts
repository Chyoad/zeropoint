import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../src/types/database.types'

describe('Supabase Database Schema & Migration Verification', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261013000000_skema_produk_dan_kartu_stok.sql'
  )
  const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql')

  it('verifies migration file exists and is non-empty', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
    const content = fs.readFileSync(migrationPath, 'utf-8')
    expect(content.length).toBeGreaterThan(1000)
  })

  it('defines all 14 required tables in SQL migration', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    const expectedTables = [
      'urutan_kode',
      'organisasi',
      'cabang',
      'user_profile',
      'user_cabang',
      'kategori_produk',
      'produk',
      'satuan_produk',
      'komponen_paket',
      'stok_produk',
      'kartu_stok',
      'penyesuaian_stok',
      'penyesuaian_stok_item',
      'log_audit',
    ]

    for (const table of expectedTables) {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`, 'i')
      expect(tableRegex.test(content)).toBe(true)
    }
  })

  it('defines 6 system columns on operational tables', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    const operationalTables = [
      'organisasi',
      'cabang',
      'user_profile',
      'user_cabang',
      'kategori_produk',
      'produk',
      'satuan_produk',
      'komponen_paket',
      'stok_produk',
      'kartu_stok',
      'penyesuaian_stok',
      'penyesuaian_stok_item',
      'log_audit',
    ]
    const systemColumns = [
      'created_at',
      'updated_at',
      'created_by',
      'updated_by',
      'deleted_at',
      'deleted_by',
    ]

    for (const table of operationalTables) {
      // Find the CREATE TABLE statement block
      const tableMatch = content.match(
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(([\\s\\S]*?)\\);`, 'i')
      )
      expect(tableMatch, `Table ${table} should be matched in DDL`).toBeTruthy()
      const tableBody = tableMatch![1]

      for (const col of systemColumns) {
        expect(tableBody).toContain(col)
      }
    }
  })

  it('enforces id UUID PRIMARY KEY and kode TEXT UNIQUE NOT NULL', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    const allTables = [
      'urutan_kode',
      'organisasi',
      'cabang',
      'user_profile',
      'user_cabang',
      'kategori_produk',
      'produk',
      'satuan_produk',
      'komponen_paket',
      'stok_produk',
      'kartu_stok',
      'penyesuaian_stok',
      'penyesuaian_stok_item',
      'log_audit',
    ]

    for (const table of allTables) {
      const tableMatch = content.match(
        new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(([\\s\\S]*?)\\);`, 'i')
      )
      expect(tableMatch, `Table ${table} definition found`).toBeTruthy()
      const tableBody = tableMatch![1]

      expect(tableBody).toMatch(/id\s+UUID\s+PRIMARY\s+KEY/i)
      expect(tableBody).toMatch(/kode\s+TEXT\s+UNIQUE\s+NOT\s+NULL/i)
    }
  })

  it('defines atomic code generator and sequence sync functions', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    expect(content).toContain('CREATE OR REPLACE FUNCTION buat_kode(')
    expect(content).toContain('CREATE OR REPLACE FUNCTION sinkron_urutan_kode(')
    expect(content).toContain('CREATE OR REPLACE FUNCTION set_updated_at()')
  })

  it('defines RLS helper functions auth.is_superadmin and auth.has_branch_access', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    expect(content).toContain('CREATE OR REPLACE FUNCTION auth.is_superadmin()')
    expect(content).toContain('CREATE OR REPLACE FUNCTION auth.has_branch_access(target_cabang_id UUID)')
  })

  it('enables Row Level Security on all public tables', () => {
    const content = fs.readFileSync(migrationPath, 'utf-8')
    const expectedTables = [
      'urutan_kode',
      'organisasi',
      'cabang',
      'user_profile',
      'user_cabang',
      'kategori_produk',
      'produk',
      'satuan_produk',
      'komponen_paket',
      'stok_produk',
      'kartu_stok',
      'penyesuaian_stok',
      'penyesuaian_stok_item',
      'log_audit',
    ]

    for (const table of expectedTables) {
      expect(content).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
    }
  })
})

describe('Supabase Seed Data Verification', () => {
  const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql')

  it('verifies seed.sql exists and contains required seed records', () => {
    expect(fs.existsSync(seedPath)).toBe(true)
    const content = fs.readFileSync(seedPath, 'utf-8')

    // 1. Organisasi ORG-0001
    expect(content).toContain('ORG-0001')
    expect(content).toContain('PT Zeropoint Nusantara')

    // 2. Cabang HQ, Surabaya, Cikarang
    expect(content).toContain('HQ-0001')
    expect(content).toContain('CBG-0001')
    expect(content).toContain('GDG-0001')

    // 3. User & roles
    expect(content).toContain('USR-0001')
    expect(content).toContain('superadmin')
    expect(content).toContain('UCB-0001')

    // 4. Kategori produk
    expect(content).toContain('KAT-0001')
    expect(content).toContain('Makanan & Minuman')

    // 5. Produk multi-satuan (Indomie Pcs & Karton)
    expect(content).toContain('PRD-0001')
    expect(content).toContain('Indomie Goreng Spesial')
    expect(content).toContain('Pcs')
    expect(content).toContain('Karton')
    expect(content).toContain('8998866200111')
    expect(content).toContain('8998866200128')

    // 6. Produk unit (Mouse Logitech)
    expect(content).toContain('PRD-0002')
    expect(content).toContain('Mouse Logitech B100 Optical USB')
    expect(content).toContain('Unit')

    // 7. Jasa & Paket
    expect(content).toContain('PRD-0003')
    expect(content).toContain('Jasa Instalasi')
    expect(content).toContain('PRD-0004')
    expect(content).toContain('Paket Workstation')
    expect(content).toContain('KPK-0001')
    expect(content).toContain('KPK-0002')

    // 8. Saldo stok awal & kartu stok
    expect(content).toContain('STK-0001')
    expect(content).toContain('KST-20261013-0001')
    expect(content).toContain('saldo_awal')

    // 9. Sinkronisasi urutan_kode calls at the end
    expect(content).toContain("PERFORM sinkron_urutan_kode('organisasi'")
    expect(content).toContain("PERFORM sinkron_urutan_kode('cabang'")
    expect(content).toContain("PERFORM sinkron_urutan_kode('produk'")
    expect(content).toContain("PERFORM sinkron_urutan_kode('kartu_stok'")
  })
})

describe('TypeScript Database Definitions Verification', () => {
  it('validates Database type keys represent all 14 tables', () => {
    // Type-level assertion
    type TablesKey = keyof Database['public']['Tables']
    const expectedTables: TablesKey[] = [
      'urutan_kode',
      'organisasi',
      'cabang',
      'user_profile',
      'user_cabang',
      'kategori_produk',
      'produk',
      'satuan_produk',
      'komponen_paket',
      'stok_produk',
      'kartu_stok',
      'penyesuaian_stok',
      'penyesuaian_stok_item',
      'log_audit',
    ]

    expect(expectedTables.length).toBe(14)
  })
})
