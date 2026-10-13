# Zeropoint Multi-Branch Admin Dashboard Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun template admin dashboard enterprise modern berarsitektur multi-cabang/gudang dengan Next.js App Router, shadcn/ui (`sidebar-07`, font Outfit, Hugeicons), dan Supabase, berfokus pada master data produk multi-satuan ala Accurate dan kartu stok persediaan (buku besar mutasi stok).

**Architecture:** Menggunakan Next.js App Router dengan `@supabase/ssr` (Server Components untuk initial load, Server Actions + Zod untuk mutasi), cookie-based active branch scoping (`zeropoint_active_branch_id`), Supabase PostgreSQL dengan RLS functions, generator kode sequence atomik, multi-satuan dinamis per produk, serta pelacakan buku besar kartu stok running balance.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui (preset `b7BFgU2rI`, `sidebar-07`), Font Outfit (`next/font/google`), `@hugeicons/react` (Stroke Rounded 1.5px), Supabase (`@supabase/ssr`), Zod, React Hook Form, TanStack Table, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-13-zeropoint-admin-template-design.md`

## Global Constraints

- Nama tabel dan kolom wajib Bahasa Indonesia, format `snake_case`, bentuk tunggal (singular), kecuali istilah teknis (`user`, `role`, `email`, `avatar_url`).
- Setiap tabel wajib memiliki `id` UUID PK (`DEFAULT gen_random_uuid()`) dan `kode` TEXT UNIQUE NOT NULL.
- Semua relasi wajib menggunakan `<tabel>_id` UUID FK.
- Setiap tabel operasional wajib memiliki 6 kolom sistem: `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `deleted_by`.
- Seluruh ikon wajib menggunakan `@hugeicons/react` varian Stroke / Outline Rounded 1.5px.
- Seluruh tipografi menggunakan font `Outfit` via `next/font/google`.
- Seluruh kuantitas persediaan di database inti (`stok_produk` dan perhitungan `kartu_stok`) wajib dinormalisasi dan disimpan dalam satuan dasar produk.
- Generator kode bisnis wajib menggunakan tabel `urutan_kode` dan fungsi PostgreSQL atomik `buat_kode` serta `sinkron_urutan_kode`.

## Review Focus

1. **Konversi Multi-Satuan**: Input transaksi dalam satuan turunan (misal 2 Dus dengan rasio 12) harus terkonversi tepat menjadi 24 satuan dasar di kartu stok tanpa galat pembulatan desimal.
2. **Kalkulasi Running Balance Kartu Stok**: Setiap mutasi masuk/keluar harus menghitung `sisa_kuantitas` dan `saldo_nilai` berurutan sesuai cabang aktif secara akurat.
3. **Pemisahan Data Antar Cabang (*Branch Isolation*)**: Staf cabang A tidak boleh dapat melihat atau memanipulasi stok/kartu stok cabang B baik melalui UI maupun query Supabase langsung.
4. **Keamanan Nomor Urut (*Concurrency & Non-reversing Sequence*)**: Pembuatan kode bersamaan (konkuren) dan data import/seed tidak boleh menghasilkan nomor mundur atau kode duplikat.
5. **Dukungan Tipe Produk Non-Fisik & Paket**: Produk bertipe `jasa` dan `non_persediaan` tidak boleh menghasilkan baris kartu stok fisik; produk `paket` harus memotong stok komponen penyusunnya saat transaksi terjadi.

---

### Task 1: Scaffolding Proyek & UI Foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `components.json`, `src/app/layout.tsx`, `src/app/globals.css`
- Modify: `src/app/layout.tsx` (konfigurasi Outfit & direction)
- Test: Build check (`pnpm build` atau lint check)

**Interfaces:**
- Produces: Fondasi Next.js App Router, shadcn components, Outfit typography, dan `@hugeicons/react`.

- [x] **Step 1: Inisialisasi Next.js dengan shadcn preset**
  Jalankan perintah inisialisasi:
  ```bash
  pnpm dlx shadcn@latest init --preset b7BFgU2rI --template next --rtl --pointer -y
  ```

- [x] **Step 2: Pasang package @hugeicons/react & @supabase/ssr**
  Pasang library ikon dan Supabase:
  ```bash
  pnpm add @hugeicons/react @supabase/ssr @supabase/supabase-js zod react-hook-form @hookform/resolvers @tanstack/react-table next-themes
  ```

- [x] **Step 3: Konfigurasi Font Outfit di `src/app/layout.tsx`**
  Impor `Outfit` dari `next/font/google` dengan variabel `--font-outfit`:
  ```tsx
  import { Outfit } from "next/font/google";
  const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
  ```
  Terapkan kelas `${outfit.variable} font-sans` pada tag `<body>`, dengan atribut `dir="ltr"` secara default.

- [x] **Step 4: Pasang blok layout `sidebar-07` dan komponen inti UI shadcn**
  Jalankan perintah:
  ```bash
  npx shadcn@latest add sidebar-07 button dialog dropdown-menu input select table badge card avatar tabs sonner tooltip separator -y
  ```

- [x] **Step 5: Verifikasi build dan commit**
  ```bash
  pnpm build
  git add .
  git commit -m "chore: scaffold Next.js with shadcn preset, Outfit font, and Hugeicons"
  ```

---

### Task 2: Vitest Testing Setup & Unit Test Konversi Multi-Satuan

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `src/lib/konversi-satuan.ts`, `tests/konversi-satuan.test.ts`
- Test: `tests/konversi-satuan.test.ts`

**Interfaces:**
- Produces: `konversiKeSatuanDasar(kuantitas: number, rasioKeDasar: number): number` dan `konversiDariSatuanDasar(kuantitasDasar: number, rasioKeDasar: number): number`.

- [ ] **Step 1: Pasang dev dependencies Vitest**
  ```bash
  pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
  ```

- [ ] **Step 2: Buat konfigurasi `vitest.config.ts`**
  Konfigurasi vitest dengan environment jsdom dan alias path `@/*`.

- [ ] **Step 3: Tulis failing test di `tests/konversi-satuan.test.ts`**
  ```typescript
  import { describe, it, expect } from "vitest";
  import { konversiKeSatuanDasar, konversiDariSatuanDasar } from "@/lib/konversi-satuan";

  describe("Konversi Multi-Satuan", () => {
    it("harus mengonversi kuantitas transaksi ke satuan dasar dengan tepat", () => {
      // 5 Karton x rasio 24 = 120 Pcs
      expect(konversiKeSatuanDasar(5, 24)).toBe(120);
      // 2.5 Lusin x rasio 12 = 30 Pcs
      expect(konversiKeSatuanDasar(2.5, 12)).toBe(30);
    });

    it("harus mengonversi dari satuan dasar ke satuan target", () => {
      // 120 Pcs / rasio 24 = 5 Karton
      expect(konversiDariSatuanDasar(120, 24)).toBe(5);
    });

    it("harus melempar error jika rasio <= 0", () => {
      expect(() => konversiKeSatuanDasar(10, 0)).toThrow();
    });
  });
  ```

- [ ] **Step 4: Jalankan test untuk memastikan test gagal (FAIL)**
  ```bash
  pnpm vitest run tests/konversi-satuan.test.ts
  ```

- [ ] **Step 5: Implementasikan `src/lib/konversi-satuan.ts`**
  Implementasikan logika konversi dengan validasi rasio positif.

- [ ] **Step 6: Jalankan test dan pastikan lulus (PASS)**
  ```bash
  pnpm vitest run tests/konversi-satuan.test.ts
  ```

- [ ] **Step 7: Commit**
  ```bash
  git add vitest.config.ts tests/ src/lib/konversi-satuan.ts
  git commit -m "feat: setup vitest and unit tests for multi-unit conversion"
  ```

---

### Task 3: Skema Database Supabase, Migrasi & Seed

**Files:**
- Create: `supabase/migrations/20261013000000_skema_produk_dan_kartu_stok.sql`
- Create: `supabase/seed.sql`
- Create: `src/types/database.types.ts`
- Test: Verifikasi syntax SQL & kelengkapan tabel/kolom

**Interfaces:**
- Produces: DDL tabel `organisasi`, `cabang`, `user_profile`, `user_cabang`, `kategori_produk`, `produk`, `satuan_produk`, `komponen_paket`, `stok_produk`, `kartu_stok`, `penyesuaian_stok`, `penyesuaian_stok_item`, `log_audit`, `urutan_kode`, fungsi `buat_kode`, `sinkron_urutan_kode`, dan fungsi RLS `auth.is_superadmin()`, `auth.has_branch_access()`.

- [ ] **Step 1: Buat file migrasi SQL `supabase/migrations/20261013000000_skema_produk_dan_kartu_stok.sql`**
  - Definisikan tabel `urutan_kode` beserta fungsi atomik `buat_kode()` dan `sinkron_urutan_kode()`.
  - Definisikan 12 tabel data dengan seluruh kolom dalam Bahasa Indonesia singular `snake_case`, `id` UUID PK, `kode` unik, dan 6 kolom sistem.
  - Tambahkan fungsi trigger `trg_set_updated_at` untuk memperbarui kolom `updated_at`.
  - Buat helper functions `auth.is_superadmin()` dan `auth.has_branch_access(target_cabang_id UUID)`.
  - Aktifkan Row-Level Security (RLS) pada semua tabel dengan filter `deleted_at IS NULL`.

- [ ] **Step 2: Buat `supabase/seed.sql`**
  - Masukkan data awal organisasi default (`ORG-0001`, "PT Zeropoint Graha Abadi").
  - Masukkan cabang demo: `HQ-0001` (Jakarta - Pusat), `CBG-0001` (Surabaya - Cabang), `GDG-0001` (Cikarang - Gudang).
  - Masukkan kategori produk: Bahan Makanan, Komputer & IT, Layanan Jasa.
  - Masukkan produk contoh dengan multi-satuan (contoh: Indomie Kuah dengan Satuan Dasar `Pcs` rasio 1 dan `Karton` rasio 40).
  - Masukkan saldo awal kartu stok demo pada cabang HQ dan Gudang Cikarang.
  - Panggil `sinkron_urutan_kode` untuk setiap tabel di akhir file seed.

- [ ] **Step 3: Buat TypeScript definitions di `src/types/database.types.ts`**
  Definisikan tipe TypeScript lengkap untuk setiap baris tabel, tipe insert, dan tipe update sesuai skema SQL.

- [ ] **Step 4: Commit**
  ```bash
  git add supabase/ src/types/database.types.ts
  git commit -m "feat: add initial database schema migrations and seed data"
  ```

---

### Task 4: Supabase SSR Client & Branch Scoping State

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/middleware.ts`
- Create: `src/hooks/use-active-branch.ts`
- Create: `src/server/actions/branch-session.ts`
- Test: `tests/branch-session.test.ts`

**Interfaces:**
- Produces: `createClient()` (browser), `createClient()` (server RSC/Action), `getActiveBranchId()`, `setActiveBranchId(branchId: string | null)`.

- [ ] **Step 1: Tulis test untuk helper sesi cabang di `tests/branch-session.test.ts`**
  Uji logika validasi ID cabang dan pembacaan cookie `zeropoint_active_branch_id`.

- [ ] **Step 2: Jalankan test (FAIL)**
  ```bash
  pnpm vitest run tests/branch-session.test.ts
  ```

- [ ] **Step 3: Implementasikan Supabase SSR client di `src/lib/supabase/`**
  - `client.ts`: `createBrowserClient`
  - `server.ts`: `createServerClient` dengan `cookies()` dari `next/headers`
  - `middleware.ts`: Refresh session Supabase dan inject active branch cookie

- [ ] **Step 4: Buat Server Action `src/server/actions/branch-session.ts`**
  Fungsi `setActiveBranchAction(branchId: string | 'all')` yang menulis HTTP cookie dan memanggil `revalidatePath('/', 'layout')`.

- [ ] **Step 5: Buat hook `src/hooks/use-active-branch.ts`**
  Hook React untuk membaca nilai cabang aktif saat ini dan mentrigger perpindahan cabang.

- [ ] **Step 6: Jalankan test (PASS) dan commit**
  ```bash
  pnpm vitest run tests/branch-session.test.ts
  git add src/lib/supabase/ src/middleware.ts src/hooks/ src/server/actions/ tests/
  git commit -m "feat: implement supabase ssr clients and active branch cookie management"
  ```

---

### Task 5: Dashboard Shell, Hugeicons Migration & Branch Switcher di `sidebar-07`

**Files:**
- Create: `src/components/layout/branch-switcher.tsx`
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/user-nav.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/page.tsx`
- Test: Verifikasi rendering komponen dan tidak ada error import icon

**Interfaces:**
- Produces: Layout dashboard lengkap dengan `BranchSwitcher` di header `sidebar-07`, navigasi menu utama, dan Overview KPI page.
- Consumes: `@hugeicons/react`, `useActiveBranch`, `sidebar-07`.

- [ ] **Step 1: Implementasikan `src/components/layout/branch-switcher.tsx`**
  Komponen dropdown pemilih cabang di header sidebar:
  - Tampilkan nama cabang aktif + badge (`HQ`, `Cabang`, `Gudang`).
  - Dropdown pencarian cabang cepat.
  - Opsi *"Semua Cabang (Konsolidasi)"* untuk Superadmin.
  - Gunakan ikon `Building04Icon` dan `ArrowUpDownIcon` dari `@hugeicons/react`.

- [ ] **Step 2: Migrasikan ikon `sidebar-07` ke `@hugeicons/react`**
  Sesuaikan `src/components/layout/app-sidebar.tsx`:
  - Ganti semua import ikon Lucide menjadi ikon Stroke Rounded dari `@hugeicons/react` (`DashboardSquare01Icon`, `PackageIcon`, `Invoice01Icon`, `Store01Icon`, `UserGroupIcon`, `Settings02Icon`, dll.).
  - Pasang `BranchSwitcher` di bagian atas (`SidebarHeader`).

- [ ] **Step 3: Implementasikan `src/components/layout/user-nav.tsx`**
  Dropdown profil user di sidebar footer / header: avatar, nama staf, role badge, tombol logout.

- [ ] **Step 4: Buat `src/app/(dashboard)/layout.tsx` dan `page.tsx`**
  - `layout.tsx`: Membungkus konten dalam `SidebarProvider` dan `SidebarInset`.
  - `page.tsx`: Overview KPI Dashboard (Total Produk, Nilai Persediaan, Mutasi Pending, Peringatan Stok Minimum) yang otomatis terfilter oleh cabang aktif.

- [ ] **Step 5: Verifikasi build dan commit**
  ```bash
  pnpm build
  git add src/components/layout/ src/app/\(dashboard\)/
  git commit -m "feat: integrate branch switcher into sidebar-07 and migrate icons to Hugeicons"
  ```

---

### Task 6: Modul Manajemen Cabang & Gudang (`/cabang`)

**Files:**
- Create: `src/server/queries/cabang.ts`
- Create: `src/server/actions/cabang.ts`
- Create: `src/components/cabang/cabang-table.tsx`
- Create: `src/components/cabang/cabang-dialog.tsx`
- Create: `src/app/(dashboard)/cabang/page.tsx`
- Test: `tests/cabang-validation.test.ts`

**Interfaces:**
- Produces: CRUD Cabang & Gudang dengan pembuatan kode otomatis `buat_kode('CBG', 4, 'tanpa_reset')`.

- [ ] **Step 1: Tulis unit test skema Zod cabang di `tests/cabang-validation.test.ts`**
  Uji validasi field: nama wajib, tipe ('pusat' | 'cabang' | 'gudang'), format nomor telepon.

- [ ] **Step 2: Implementasikan `src/server/queries/cabang.ts` dan `src/server/actions/cabang.ts`**
  - Queries: `ambilDaftarCabang()` dengan filter soft-delete (`deleted_at IS NULL`).
  - Actions: `simpanCabangAction(formData)`, `hapusCabangAction(id)` (soft-delete).

- [ ] **Step 3: Buat data-table cabang di `src/components/cabang/cabang-table.tsx`**
  Tabel TanStack menampilkan: Kode, Nama, Tipe, Kota, Status Aktif, dan Action menu.

- [ ] **Step 4: Buat dialog form cabang di `src/components/cabang/cabang-dialog.tsx`**
  Dialog Tambah/Edit Cabang menggunakan React Hook Form + Zod resolver.

- [ ] **Step 5: Buat halaman `src/app/(dashboard)/cabang/page.tsx`**
  Halaman Server Component yang me-render header, tombol "Tambah Cabang", dan `CabangTable`.

- [ ] **Step 6: Jalankan test, build, dan commit**
  ```bash
  pnpm vitest run tests/cabang-validation.test.ts
  git add src/server/queries/cabang.ts src/server/actions/cabang.ts src/components/cabang/ src/app/\(dashboard\)/cabang/ tests/
  git commit -m "feat: implement branches and warehouses management module"
  ```

---

### Task 7: Modul Pengguna & Hak Akses Multi-Cabang (`/user`)

**Files:**
- Create: `src/server/queries/user.ts`
- Create: `src/server/actions/user.ts`
- Create: `src/components/user/user-table.tsx`
- Create: `src/components/user/user-dialog.tsx`
- Create: `src/app/(dashboard)/user/page.tsx`
- Test: `tests/user-validation.test.ts`

**Interfaces:**
- Produces: Pengelolaan staf, penugasan role (Superadmin, HQ Manager, Branch Manager, Staff, Viewer), dan penugasan multi-cabang (`user_cabang`).

- [ ] **Step 1: Tulis test validasi penugasan user di `tests/user-validation.test.ts`**
  Validasi role dan keharusan memilih minimal 1 cabang jika role adalah branch_manager atau staff.

- [ ] **Step 2: Implementasikan Server Queries & Actions di `src/server/`**
  - `ambilDaftarUser()` (join dengan `user_cabang` dan `cabang`).
  - `simpanUserAction()` dan `hapusUserAction()`.

- [ ] **Step 3: Buat komponen UI tabel dan dialog penugasan cabang**
  Daftar user dengan chip cabang yang dapat diakses dan pemilihan cabang default.

- [ ] **Step 4: Buat halaman `src/app/(dashboard)/user/page.tsx`**

- [ ] **Step 5: Commit**
  ```bash
  git add src/server/queries/user.ts src/server/actions/user.ts src/components/user/ src/app/\(dashboard\)/user/ tests/
  git commit -m "feat: implement users and multi-branch assignment module"
  ```

---

### Task 8: Modul Master Produk & Multi-Satuan ala Accurate (`/produk`)

**Files:**
- Create: `src/server/queries/produk.ts`
- Create: `src/server/actions/produk.ts`
- Create: `src/components/produk/produk-table.tsx`
- Create: `src/components/produk/produk-form-tabs.tsx`
- Create: `src/components/produk/satuan-repeater.tsx`
- Create: `src/components/produk/komponen-paket-form.tsx`
- Create: `src/components/produk/saldo-awal-cabang-form.tsx`
- Create: `src/app/(dashboard)/produk/page.tsx`
- Create: `src/app/(dashboard)/produk/baru/page.tsx`
- Create: `src/app/(dashboard)/produk/[id]/page.tsx`
- Test: `tests/produk-validation.test.ts`

**Interfaces:**
- Produces: CRUD Produk lengkap dengan 4 tipe produk (`persediaan`, `non_persediaan`, `jasa`, `paket`), multi-satuan fleksibel (`satuan_produk`), komponen paket dinamis (`komponen_paket`), dan pengisian saldo awal per cabang.

- [ ] **Step 1: Tulis unit test validasi produk di `tests/produk-validation.test.ts`**
  - Produk persediaan wajib memiliki minimal 1 satuan dasar (`is_satuan_dasar = true`, `rasio_ke_dasar = 1`).
  - Produk paket wajib memiliki minimal 1 komponen penyusun.
  - Kode produk di-generate via `buat_kode('PRD', 4, 'tanpa_reset')`.

- [ ] **Step 2: Implementasikan Server Queries & Actions produk di `src/server/`**
  - `ambilDaftarProduk(filter)`
  - `ambilDetailProduk(id)` (join `satuan_produk`, `komponen_paket`, `stok_produk`)
  - `simpanProdukAction(payload)`: Transaksi database atomik yang menyimpan data produk, batch insert satuan, komponen paket, dan jika ada saldo awal, otomatis mencatat baris `kartu_stok` dan `stok_produk`.

- [ ] **Step 3: Implementasikan form multi-tab di `src/components/produk/produk-form-tabs.tsx`**
  - **Tab 1: Data Dasar**: Nama, Tipe Produk, Kategori, Metode Valuasi (Rata-rata/FIFO), Harga Pokok Standar, Harga Beli Terakhir.
  - **Tab 2: Multi-Satuan (`satuan-repeater.tsx`)**: Tambah/hapus satuan (Satuan Dasar, Satuan 2, Satuan 3), rasio konversi, barcode unik, harga jual default/grosir/member.
  - **Tab 3: Komponen Paket (`komponen-paket-form.tsx`)**: Pemilihan item komponen dan kuantitas (hanya aktif jika tipe = `paket`).
  - **Tab 4: Saldo Awal Cabang (`saldo-awal-cabang-form.tsx`)**: Input kuantitas saldo awal dan harga pokok per cabang (hanya aktif jika tipe = `persediaan` pada form baru).

- [ ] **Step 4: Buat halaman `/produk`, `/produk/baru`, dan `/produk/[id]`**
  Tabel katalog produk dengan filter tipe produk, badge status, dan pencarian.

- [ ] **Step 5: Jalankan test, verifikasi build, dan commit**
  ```bash
  pnpm vitest run tests/produk-validation.test.ts
  git add src/server/queries/produk.ts src/server/actions/produk.ts src/components/produk/ src/app/\(dashboard\)/produk/ tests/
  git commit -m "feat: implement accurate-style multi-unit product management module"
  ```

---

### Task 9: Modul Buku Besar Kartu Stok / *Stock Ledger* (`/kartu-stok`)

**Files:**
- Create: `src/server/queries/kartu-stok.ts`
- Create: `src/components/kartu-stok/kartu-stok-table.tsx`
- Create: `src/components/kartu-stok/kartu-stok-filter.tsx`
- Create: `src/app/(dashboard)/kartu-stok/page.tsx`
- Test: `tests/kartu-stok-calculation.test.ts`

**Interfaces:**
- Produces: Laporan buku besar mutasi persediaan running balance per cabang dan per produk.
- Consumes: `kartu_stok`, `stok_produk`, `useActiveBranch`.

- [ ] **Step 1: Tulis unit test running balance di `tests/kartu-stok-calculation.test.ts`**
  ```typescript
  import { describe, it, expect } from "vitest";

  describe("Kalkulasi Kartu Stok Running Balance", () => {
    it("harus menghitung sisa kuantitas dan saldo nilai moving average secara tepat", () => {
      // Saldo awal: 10 pcs @ Rp 10.000 = Rp 100.000
      let saldoQty = 10;
      let saldoNilai = 100000;
      let hpp = saldoNilai / saldoQty; // 10.000

      // Masuk pembelian: 10 pcs @ Rp 12.000 = Rp 120.000
      const masukQty = 10;
      const masukNilai = 120000;
      saldoQty += masukQty; // 20 pcs
      saldoNilai += masukNilai; // 220.000
      hpp = saldoNilai / saldoQty; // 11.000

      expect(saldoQty).toBe(20);
      expect(saldoNilai).toBe(220000);
      expect(hpp).toBe(11000);

      // Keluar penjualan: 5 pcs @ HPP Rp 11.000 = Rp 55.000
      const keluarQty = 5;
      const keluarNilai = keluarQty * hpp;
      saldoQty -= keluarQty; // 15 pcs
      saldoNilai -= keluarNilai; // 165.000

      expect(saldoQty).toBe(15);
      expect(saldoNilai).toBe(165000);
    });
  });
  ```

- [ ] **Step 2: Jalankan test (PASS)**
  ```bash
  pnpm vitest run tests/kartu-stok-calculation.test.ts
  ```

- [ ] **Step 3: Implementasikan query buku besar di `src/server/queries/kartu-stok.ts`**
  Query data `kartu_stok` yang memfilter berdasarkan `produk_id`, `cabang_id`, dan rentang tanggal dengan urutan kronologis `tanggal ASC, created_at ASC`.

- [ ] **Step 4: Buat komponen UI `kartu-stok-table.tsx` dan `kartu-stok-filter.tsx`**
  Tabel buku besar persediaan dengan kolom lengkap: Tanggal, No. Referensi, Tipe Mutasi, Satuan Transaksi, Masuk (Qty), Keluar (Qty), Sisa Qty, Harga Satuan, Total Masuk (Rp), Total Keluar (Rp), Saldo Nilai (Rp), HPP Rata-rata.

- [ ] **Step 5: Buat halaman `src/app/(dashboard)/kartu-stok/page.tsx`**
  Integrasi filter produk, cabang, tanggal, dan tombol export CSV/Excel.

- [ ] **Step 6: Commit**
  ```bash
  git add src/server/queries/kartu-stok.ts src/components/kartu-stok/ src/app/\(dashboard\)/kartu-stok/ tests/
  git commit -m "feat: implement stock card ledger module with running balance"
  ```

---

### Task 10: Modul Penyesuaian Stok / *Stock Opname* (`/penyesuaian-stok`)

**Files:**
- Create: `src/server/queries/penyesuaian-stok.ts`
- Create: `src/server/actions/penyesuaian-stok.ts`
- Create: `src/components/penyesuaian-stok/penyesuaian-table.tsx`
- Create: `src/components/penyesuaian-stok/penyesuaian-form.tsx`
- Create: `src/app/(dashboard)/penyesuaian-stok/page.tsx`
- Create: `src/app/(dashboard)/penyesuaian-stok/baru/page.tsx`
- Test: `tests/penyesuaian-stok.test.ts`

**Interfaces:**
- Produces: Transaksi stock opname/penyesuaian stok yang mengoreksi saldo `stok_produk` dan meng-generate baris mutasi `kartu_stok` (`penyesuaian_masuk` / `penyesuaian_keluar`).

- [ ] **Step 1: Tulis test kalkulasi selisih opname di `tests/penyesuaian-stok.test.ts`**
  Uji penghitungan `selisih = stok_fisik - stok_buku` dan penentuan jenis mutasi.

- [ ] **Step 2: Implementasikan Server Actions di `src/server/actions/penyesuaian-stok.ts`**
  - Buat kode transaksi via `buat_kode('ADJ', 4, 'harian')`.
  - Simpan header `penyesuaian_stok` dan rincian `penyesuaian_stok_item`.
  - Saat status = `selesai`, lakukan pembaruan atomik:
    - Update `stok_produk.kuantitas` ke nilai stok fisik.
    - Catat baris baru di `kartu_stok` untuk setiap item yang berselisih.

- [ ] **Step 3: Buat komponen dan halaman form input Stock Opname**
  Halaman pemilihan cabang, pemuatan daftar produk dan stok buku otomatis, serta input stok fisik dengan indikator warna selisih (hijau jika lebih, merah jika kurang).

- [ ] **Step 4: Jalankan test, verifikasi build, dan commit**
  ```bash
  pnpm vitest run tests/penyesuaian-stok.test.ts
  git add src/server/queries/penyesuaian-stok.ts src/server/actions/penyesuaian-stok.ts src/components/penyesuaian-stok/ src/app/\(dashboard\)/penyesuaian-stok/ tests/
  git commit -m "feat: implement stock adjustment and stock opname module"
  ```

---

### Task 11: Audit Trail, Pengaturan Organisasi, CI/CD Workflow & Dokumentasi

**Files:**
- Create: `src/app/(dashboard)/log-audit/page.tsx`
- Create: `src/app/(dashboard)/pengaturan/page.tsx`
- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Test: Full CI verification (`pnpm lint`, `pnpm vitest run`, `pnpm build`)

**Interfaces:**
- Produces: Halaman log audit, halaman pengaturan profil perusahaan & preferensi, automated GitHub Actions CI, dan dokumentasi komprehensif.

- [ ] **Step 1: Buat halaman `src/app/(dashboard)/log-audit/page.tsx`**
  Tabel riwayat aktivitas pengguna (Waktu, Cabang, Pelaku, Aksi, Entitas, Rincian Perubahan JSON).

- [ ] **Step 2: Buat halaman `src/app/(dashboard)/pengaturan/page.tsx`**
  Form pengaturan profil organisasi, logo perusahaan, preferensi mata uang (IDR), dan toggle tema Dark/Light.

- [ ] **Step 3: Buat GitHub Actions CI di `.github/workflows/ci.yml`**
  Workflow otomatis untuk branch `main`: install pnpm, install dependencies, run linter, run typecheck (`tsc --noEmit`), run vitest tests, dan run `pnpm build`.

- [ ] **Step 4: Tulis dokumentasi komprehensif di `README.md`**
  - Arsitektur proyek & standar penamaan tabel/kolom.
  - Cara setup lokal dengan Supabase CLI / Cloud.
  - Alur multi-satuan dan kartu stok.
  - Panduan menambahkan modul baru berbasis template ini.

- [ ] **Step 5: Verifikasi akhir seluruh linting, typecheck, dan build**
  ```bash
  pnpm vitest run
  pnpm build
  git add .github/ README.md src/app/\(dashboard\)/log-audit/ src/app/\(dashboard\)/pengaturan/
  git commit -m "docs: finalize audit log, settings, ci workflow, and documentation"
  ```
