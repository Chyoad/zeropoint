# Zeropoint Admin Template

> **Modular Multi-Branch & Multi-Warehouse Enterprise ERP Admin Template**  
> Dibangun dengan arsitektur modern Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, dan Supabase PostgreSQL.

---

## 📌 Ringkasan Proyek

**Zeropoint** adalah template admin enterprise kelas korporat yang dirancang khusus untuk operasional bisnis multi-cabang, multi-gudang, dan logistik persediaan di Indonesia. Dilengkapi dengan sistem fallback in-memory yang tangguh, Zeropoint dapat dijalankan langsung secara mandiri (**Zero-Config Demo Mode**) tanpa keharusan mengonfigurasi koneksi database Supabase terlebih dahulu, serta dapat beralih ke database Supabase PostgreSQL produksi hanya dengan konfigurasi variabel lingkungan.

---

## ✨ Fitur-Fitur Inti

### 1. Multi-Cabang & Multi-Gudang Scoping
- **Pusat, Cabang, & Gudang**: Pemisahan fasilitas operasional (`pusat`, `cabang`, `gudang`) dengan kode unik (`HQ-XXXX`, `CBG-XXXX`, `GDG-XXXX`).
- **Session Scoping Fleksibel**: Pemilihan cabang aktif tersimpan dalam secure HTTP-only cookies (`zeropoint_active_branch`) dan disinkronkan melalui middleware Supabase SSR.
- **Akses Global HQ vs Cabang Terbatas**: Superadmin dan HQ Manager dapat memantau seluruh cabang (`Semua Fasilitas`), sementara manajer cabang dibatasi hanya pada fasilitas yang ditugaskan.

### 2. Master Produk Multi-Satuan Bertingkat (Ala Accurate)
- **Hierarki Multi-Satuan**: Mendukung satuan terkecil/dasar (misal: *Pcs*) dan satuan turunan bertingkat (misal: *Lusin* = rasio 12, *Karton/Dus* = rasio 40).
- **Multi-Level Pricing**: Struktur harga bertingkat untuk setiap satuan:
  - Harga Jual Reguler / Default
  - Harga Jual Grosir (Wholesale)
  - Harga Jual Member / Khusus Pelanggan
- **Konversi Otomatis**: Helper presisi tinggi untuk mengonversi kuantitas transaksi multi-satuan ke satuan dasar akuntansi.

### 3. Perakitan Dinamis Paket Barang (*Dynamic Bundle Assembly*)
- **Tipe Produk Fleksibel**: `persediaan`, `non_persediaan`, `jasa`, dan `paket`.
- **Bill of Materials (BOM)**: Produk tipe `paket` didefinisikan dari komponen-komponen penyusun dengan kuantitas dan satuan masing-masing.
- **Kalkulasi HPP Otomatis**: HPP produk paket dihitung secara dinamis dari akumulasi total HPP komponen penyusunnya.

### 4. Buku Besar Kartu Stok (*Stock Ledger*)
- **Metode Valuasi Rata-Rata Bergerak (*Moving Average*)**: Setiap transaksi masuk memperbarui rata-rata tertimbang harga pokok penjualan (HPP) secara *real-time*.
- **Riwayat Mutasi Lengkap**: Mendukung transaksi `saldo_awal`, `masuk_pembelian`, `keluar_penjualan`, `penyesuaian_masuk`, `penyesuaian_keluar`, `retur_masuk`, dan `retur_keluar`.
- **Informasi Tambahan**: Pencatatan nomor batch (*batch number*) dan tanggal kedaluwarsa (*expiry date*).
- **Ekspor Data**: Dukungan ekspor laporan buku besar kartu stok ke format CSV terstandar.

### 5. Penyesuaian Stok / Stock Opname Fisik
- **Siklus Hidup Transaksi**: Alur status transaksi yang terkontrol (`draft` $\rightarrow$ `selesai` atau `dibatalkan`).
- **Perhitungan Selisih Otomatis**: Membandingkan stok buku akuntansi terhadap stok fisik riil di gudang.
- **Posting Mutasi Otomatis**: Finalisasi stock opname secara otomatis mencatat jurnal kartu stok penyesuaian masuk atau keluar dan memperbarui saldo persediaan fisik.

### 6. Otorisasi Pengguna & Hak Akses Berjenjang
- **Hierarki Peran (*Roles*)**:
  - `superadmin`: Akses penuh ke seluruh organisasi, konfigurasi sistem, dan lintas cabang.
  - `hq_manager`: Manajemen operasional lintas cabang dari kantor pusat.
  - `branch_manager`: Pengelolaan fasilitas cabang dan inventaris tertentu.
  - `staff`: Eksekusi operasional transaksi harian.
  - `viewer`: Akses baca-saja (*read-only*) untuk pelaporan dan audit.
- **Penugasan Multi-Cabang**: Satu pengguna dapat memiliki akses ke beberapa cabang dengan satu cabang default terpilih.

### 7. Audit Trail & Log Keamanan Lengkap
- **Rekam Jejak Mutasi Data**: Setiap penambahan (`CREATE`), perubahan (`UPDATE`), penghapusan (`DELETE`), dan penyesuaian akuntansi (`ADJUST`) dicatat secara terperinci.
- **Inspeksi JSON Diff**: Dialog interaktif untuk membandingkan data sebelum (*old state*) dan sesudah (*new state*) perubahan.
- **Pencatatan Metadata**: User pelaku, cabang lokasi, IP Address, User Agent, dan stempel waktu (*timestamp*).

### 8. Pengaturan Organisasi & Standar Finansial Indonesia
- **Identitas Perusahaan**: NPWP, alamat kantor pusat, nomor telepon, dan email resmi.
- **Preferensi Moneter**: Mata uang default Rupiah (IDR) dengan pemisah angka standar Indonesia (titik ribuan, koma desimal).
- **Zona Waktu**: Dukungan penuh zona waktu nusantara (WIB UTC+7, WITA UTC+8, WIT UTC+9).

---

## 🏛️ Arsitektur Database

Zeropoint menerapkan konvensi penamaan **Bahasa Indonesia Tunggal (*Indonesian Singular Snake_Case*)** untuk seluruh tabel, kolom, enum, dan fungsi basis data:

```
├── urutan_kode            # Registry counter penomoran otomatis
├── organisasi             # Profil entitas korporat induk
├── cabang                 # Master fasilitas kantor pusat, cabang, & gudang
├── user_profile           # Metadata identitas & peran pengguna
├── user_cabang            # Matriks relasi hak akses pengguna ke cabang
├── kategori_produk        # Klasifikasi kategori barang persediaan
├── produk                 # Master barang dagang, jasa, & paket
├── satuan_produk          # Multi-satuan konversi & matriks multi-harga
├── komponen_paket         # Komposisi komponen perakitan paket produk
├── stok_produk            # Saldo stok real-time per produk per cabang
├── kartu_stok             # Buku besar mutasi inventaris & running balance
├── penyesuaian_stok       # Header dokumen transaksi stock opname
├── penyesuaian_stok_item  # Baris rincian item selisih stock opname
└── log_audit              # Rekam jejak audit trail seluruh operasi
```

### Stored Procedure & Trigger Utama
- `buat_kode(p_prefix, p_panjang, p_jenis, p_tanggal)`: Generator penomoran kode otomatis terurut tanpa reset atau berbasis tanggal harian (misal: `PRD-0001`, `OPN-20261014-0001`).
- `sinkron_urutan_kode`: Sinkronisasi nilai *counter* maksimum dari data yang telah ada.
- **Row Level Security (RLS)**: Enkapsulasi data antar-organisasi dan validasi hak akses cabang pengguna melalui fungsi helper `has_branch_access` dan `is_superadmin`.

---

## 🎨 Standar Desain & UI

1. **100% Hugeicons (@hugeicons/react & @hugeicons/core-free-icons)**:
   - Stroke Rounded (1.5px) seragam di seluruh aplikasi.
   - **Ketat**: Zero `lucide-react` import di seluruh berkas kode.
2. **Tipografi Google Font Outfit**:
   - Tampilan bersih, modern, dan mudah dibaca untuk data numerik akuntansi.
3. **Format Mata Uang Rupiah**:
   - Seluruh nilai nominal diformat menggunakan helper `formatRupiah(nilai)` (contoh: `Rp 1.500.000`).
4. **Dark & Light Mode**:
   - Integrasi `next-themes` dengan palet warna netral Tailwind CSS v4.

---

## 🚀 Memulai (Panduan Instalasi & Menjalankan Proyek)

### Prasyarat
- **Node.js**: Versi 20.x ke atas.
- **Package Manager**: `pnpm` (disarankan) atau `npm`.

### 1. Kloning & Instalasi Dependensi
```bash
git clone https://github.com/your-org/zeropoint.git
cd zeropoint
pnpm install
```

### 2. Menjalankan Mode In-Memory Demo (Tanpa Setup Supabase)
Zeropoint memiliki dataset in-memory realistis bawaan. Anda dapat langsung menjalankan server pengembang tanpa konfigurasi database:

```bash
pnpm dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000) untuk mengakses dashboard.

### 3. Menghubungkan ke Supabase Produksi (Opsional)
Salin berkas lingkungan dan isi kredensial Supabase Anda:
```bash
cp .env.example .env.local
```
Konfigurasikan:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Jalankan migrasi dan seeding database ke Supabase:
```bash
# Menjalankan migrasi skema
supabase db push
# atau jalankan skrip SQL di supabase/migrations/ dan supabase/seed.sql pada SQL Editor Supabase
```

---

## 🧪 Pengujian & CI/CD

Proyek ini dilengkapi dengan cakupan pengujian unit komprehensif menggunakan **Vitest** dan pipeline otomatis **GitHub Actions**.

### Menjalankan Unit Tests
```bash
# Menjalankan seluruh test suite
pnpm test

# Menjalankan test spesifik modul
pnpm test tests/log-audit-pengaturan.test.ts
```

### Typecheck & Build
```bash
# Verifikasi tipe TypeScript
pnpm typecheck

# Membangun build produksi Next.js
pnpm build
```

### Alur Kerja GitHub Actions CI (`.github/workflows/ci.yml`)
Setiap kali ada `push` atau `pull_request` ke cabang `main`, alur kerja otomatis melakukan:
1. `actions/checkout@v4`
2. `pnpm/action-setup@v4`
3. `actions/setup-node@v4` (Node.js 20 & pnpm cache)
4. `pnpm install --frozen-lockfile`
5. `pnpm typecheck`
6. `pnpm test`
7. `pnpm build`

---

## 🧩 Panduan Ekstensi Modul Baru

Untuk menambahkan modul baru (misalnya modul *Pemasok / Supplier*):

1. **Definisikan Skema & Tipe Validasi** (`src/lib/validasi/pemasok.ts`):
   Gunakan Zod untuk validasi data input dan inferensi tipe TypeScript.
2. **Buat Kueri Data** (`src/server/queries/pemasok.ts`):
   Implementasikan fungsi `ambilDaftarPemasok()` dengan dukungan fallback demo store saat offline via `withTimeout`.
3. **Buat Server Actions** (`src/server/actions/pemasok.ts`):
   Implementasikan mutasi data dengan revalidasi path (`revalidatePath('/pemasok')`) dan pencatatan riwayat ke `log_audit`.
4. **Buat Komponen UI** (`src/components/pemasok/`):
   Gunakan tabel dan dialog shadcn dengan ikon Hugeicons 1.5px.
5. **Daftarkan Rute Halaman** (`src/app/(dashboard)/pemasok/page.tsx`):
   Halaman Server Component dengan integrasi filter cabang.
6. **Tambahkan Navigasi Sidebar** (`src/components/layout/app-sidebar.tsx`):
   Daftarkan menu ke array `NAVIGATION_SECTIONS`.

---

## 📄 Lisensi

Hak Cipta © 2026 PT Zeropoint Nusantara. Dilindungi Undang-Undang.
