-- ==============================================================================
-- ZEROPOINT MULTI-BRANCH ADMIN DASHBOARD TEMPLATE
-- Migrasi Awal: Skema Master Data Produk, Multi-Satuan & Kartu Stok
-- File: supabase/migrations/20261013000000_skema_produk_dan_kartu_stok.sql
-- ==============================================================================

-- 0. Ekstensi & Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS auth;

-- ==============================================================================
-- 1. FUNGSI UTILITAS SISTEM
-- ==============================================================================

-- Trigger Otomatis untuk memperbarui kolom updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. TABEL URUTAN_KODE & FUNGSI GENERATOR KODE OTOMATIS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS urutan_kode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,               -- Kunci sequence: misal 'PRD' atau 'KST-20261013'
    prefix TEXT NOT NULL,                   -- 'PRD', 'KST', 'ADJ', 'CBG', dll.
    jenis TEXT NOT NULL CHECK (jenis IN ('tanpa_reset', 'harian')),
    tanggal DATE,                           -- Diisi jika jenis = 'harian', NULL jika 'tanpa_reset'
    nomor_terakhir BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_urutan_kode_kunci ON urutan_kode(kode);
CREATE INDEX IF NOT EXISTS idx_urutan_kode_prefix ON urutan_kode(prefix);

-- Fungsi Atomik: buat_kode(prefix, panjang, jenis, tanggal)
CREATE OR REPLACE FUNCTION buat_kode(
    p_prefix TEXT,
    p_panjang INT DEFAULT 4,
    p_jenis TEXT DEFAULT 'tanpa_reset',
    p_tanggal DATE DEFAULT CURRENT_DATE
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kunci TEXT;
    v_nomor BIGINT;
    v_nomor_str TEXT;
    v_tanggal_str TEXT;
    v_hasil TEXT;
BEGIN
    IF p_jenis NOT IN ('tanpa_reset', 'harian') THEN
        RAISE EXCEPTION 'Jenis kode tidak valid: %. Gunakan "tanpa_reset" atau "harian"', p_jenis;
    END IF;

    IF p_jenis = 'harian' THEN
        v_tanggal_str := to_char(p_tanggal, 'YYYYMMDD');
        v_kunci := p_prefix || '-' || v_tanggal_str;
    ELSE
        v_tanggal_str := NULL;
        v_kunci := p_prefix;
    END IF;

    -- Atomic Upsert & Increment
    INSERT INTO urutan_kode (kode, prefix, jenis, tanggal, nomor_terakhir, updated_at)
    VALUES (v_kunci, p_prefix, p_jenis, p_tanggal, 1, now())
    ON CONFLICT (kode)
    DO UPDATE SET
        nomor_terakhir = urutan_kode.nomor_terakhir + 1,
        updated_at = now()
    RETURNING nomor_terakhir INTO v_nomor;

    v_nomor_str := CASE WHEN length(v_nomor::TEXT) >= p_panjang THEN v_nomor::TEXT ELSE lpad(v_nomor::TEXT, p_panjang, '0') END;

    IF p_jenis = 'harian' THEN
        v_hasil := p_prefix || '-' || v_tanggal_str || '-' || v_nomor_str;
    ELSE
        v_hasil := p_prefix || '-' || v_nomor_str;
    END IF;

    RETURN v_hasil;
END;
$$;

-- Fungsi Sinkronisasi Sequence: sinkron_urutan_kode(...)
CREATE OR REPLACE FUNCTION sinkron_urutan_kode(
    p_nama_tabel TEXT,
    p_kolom_kode TEXT,
    p_prefix TEXT,
    p_jenis TEXT DEFAULT 'tanpa_reset',
    p_tanggal DATE DEFAULT CURRENT_DATE
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kunci TEXT;
    v_pola_regex TEXT;
    v_nomor_tertinggi BIGINT := 0;
    v_nomor_sekarang BIGINT := 0;
    v_sql TEXT;
    v_tanggal_str TEXT;
BEGIN
    IF p_jenis = 'harian' THEN
        v_tanggal_str := to_char(p_tanggal, 'YYYYMMDD');
        v_kunci := p_prefix || '-' || v_tanggal_str;
        v_pola_regex := '^' || p_prefix || '-' || v_tanggal_str || '-([0-9]+)$';
    ELSE
        v_tanggal_str := NULL;
        v_kunci := p_prefix;
        v_pola_regex := '^' || p_prefix || '-([0-9]+)$';
    END IF;

    v_sql := format(
        'SELECT COALESCE(MAX((substring(%I from %L))::BIGINT), 0) FROM %I WHERE %I ~ %L',
        p_kolom_kode, v_pola_regex, p_nama_tabel, p_kolom_kode, v_pola_regex
    );
    EXECUTE v_sql INTO v_nomor_tertinggi;

    SELECT nomor_terakhir INTO v_nomor_sekarang
    FROM urutan_kode
    WHERE kode = v_kunci;

    IF v_nomor_sekarang IS NULL THEN
        INSERT INTO urutan_kode (kode, prefix, jenis, tanggal, nomor_terakhir, updated_at)
        VALUES (v_kunci, p_prefix, p_jenis, p_tanggal, v_nomor_tertinggi, now());
    ELSIF v_nomor_tertinggi > v_nomor_sekarang THEN
        UPDATE urutan_kode
        SET nomor_terakhir = v_nomor_tertinggi,
            updated_at = now()
        WHERE kode = v_kunci;
    END IF;

    RETURN GREATEST(COALESCE(v_nomor_sekarang, 0), v_nomor_tertinggi);
END;
$$;

-- ==============================================================================
-- 3. TABEL ORGANISASI & CABANG
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organisasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    logo_url TEXT,
    pengaturan JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_organisasi_kode ON organisasi(kode);
CREATE INDEX IF NOT EXISTS idx_organisasi_deleted_at ON organisasi(deleted_at);

CREATE TABLE IF NOT EXISTS cabang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    organisasi_id UUID NOT NULL REFERENCES organisasi(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    tipe TEXT DEFAULT 'cabang' NOT NULL CHECK (tipe IN ('pusat', 'cabang', 'gudang')),
    alamat TEXT,
    kota TEXT,
    telepon TEXT,
    is_aktif BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cabang_kode ON cabang(kode);
CREATE INDEX IF NOT EXISTS idx_cabang_organisasi_id ON cabang(organisasi_id);
CREATE INDEX IF NOT EXISTS idx_cabang_tipe ON cabang(tipe);
CREATE INDEX IF NOT EXISTS idx_cabang_deleted_at ON cabang(deleted_at);

-- ==============================================================================
-- 4. TABEL PENGGUNA & PENUGASAN CABANG
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    organisasi_id UUID NOT NULL REFERENCES organisasi(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    role TEXT DEFAULT 'staff' NOT NULL CHECK (role IN ('superadmin', 'hq_manager', 'branch_manager', 'staff', 'viewer')),
    avatar_url TEXT,
    telepon TEXT,
    is_aktif BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profile_kode ON user_profile(kode);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_role ON user_profile(role);
CREATE INDEX IF NOT EXISTS idx_user_profile_organisasi_id ON user_profile(organisasi_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_deleted_at ON user_profile(deleted_at);

CREATE TABLE IF NOT EXISTS user_cabang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    user_profile_id UUID NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
    cabang_id UUID NOT NULL REFERENCES cabang(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_cabang_relasi UNIQUE (user_profile_id, cabang_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cabang_kode ON user_cabang(kode);
CREATE INDEX IF NOT EXISTS idx_user_cabang_profile ON user_cabang(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_cabang_cabang ON user_cabang(cabang_id);
CREATE INDEX IF NOT EXISTS idx_user_cabang_deleted_at ON user_cabang(deleted_at);

-- ==============================================================================
-- 5. TABEL MASTER PRODUK, MULTI-SATUAN & PAKET
-- ==============================================================================

CREATE TABLE IF NOT EXISTS kategori_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    organisasi_id UUID NOT NULL REFERENCES organisasi(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_kategori_produk_kode ON kategori_produk(kode);
CREATE INDEX IF NOT EXISTS idx_kategori_produk_organisasi ON kategori_produk(organisasi_id);
CREATE INDEX IF NOT EXISTS idx_kategori_produk_deleted_at ON kategori_produk(deleted_at);

CREATE TABLE IF NOT EXISTS produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    organisasi_id UUID NOT NULL REFERENCES organisasi(id) ON DELETE CASCADE,
    kategori_produk_id UUID REFERENCES kategori_produk(id) ON DELETE SET NULL,
    nama TEXT NOT NULL,
    tipe_produk TEXT DEFAULT 'persediaan' NOT NULL CHECK (tipe_produk IN ('persediaan', 'non_persediaan', 'jasa', 'paket')),
    metode_valuasi TEXT DEFAULT 'rata_rata' NOT NULL CHECK (metode_valuasi IN ('rata_rata', 'fifo')),
    harga_pokok_standar NUMERIC(15,2) DEFAULT 0 NOT NULL,
    harga_beli_terakhir NUMERIC(15,2) DEFAULT 0 NOT NULL,
    peringatan_stok_minimum NUMERIC(15,2) DEFAULT 0 NOT NULL,
    dapat_dijual BOOLEAN DEFAULT true NOT NULL,
    dapat_dibeli BOOLEAN DEFAULT true NOT NULL,
    gambar_url TEXT,
    deskripsi TEXT,
    is_aktif BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_produk_kode ON produk(kode);
CREATE INDEX IF NOT EXISTS idx_produk_organisasi ON produk(organisasi_id);
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori_produk_id);
CREATE INDEX IF NOT EXISTS idx_produk_tipe ON produk(tipe_produk);
CREATE INDEX IF NOT EXISTS idx_produk_deleted_at ON produk(deleted_at);

CREATE TABLE IF NOT EXISTS satuan_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE CASCADE,
    nama_satuan TEXT NOT NULL,
    rasio_ke_dasar NUMERIC(15,4) DEFAULT 1 NOT NULL,
    is_satuan_dasar BOOLEAN DEFAULT false NOT NULL,
    barcode TEXT UNIQUE,
    harga_jual_default NUMERIC(15,2) DEFAULT 0 NOT NULL,
    harga_jual_grosir NUMERIC(15,2) DEFAULT 0 NOT NULL,
    harga_jual_member NUMERIC(15,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_satuan_produk_kode ON satuan_produk(kode);
CREATE INDEX IF NOT EXISTS idx_satuan_produk_produk ON satuan_produk(produk_id);
CREATE INDEX IF NOT EXISTS idx_satuan_produk_barcode ON satuan_produk(barcode);
CREATE INDEX IF NOT EXISTS idx_satuan_produk_deleted_at ON satuan_produk(deleted_at);

CREATE TABLE IF NOT EXISTS komponen_paket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    paket_id UUID NOT NULL REFERENCES produk(id) ON DELETE CASCADE,
    produk_komponen_id UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
    satuan_produk_id UUID REFERENCES satuan_produk(id) ON DELETE RESTRICT,
    kuantitas NUMERIC(15,4) DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_komponen_paket_kode ON komponen_paket(kode);
CREATE INDEX IF NOT EXISTS idx_komponen_paket_paket ON komponen_paket(paket_id);
CREATE INDEX IF NOT EXISTS idx_komponen_paket_komponen ON komponen_paket(produk_komponen_id);
CREATE INDEX IF NOT EXISTS idx_komponen_paket_deleted_at ON komponen_paket(deleted_at);

-- ==============================================================================
-- 6. TABEL SALDO STOK PRODUK & BUKU BESAR KARTU STOK
-- ==============================================================================

CREATE TABLE IF NOT EXISTS stok_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE CASCADE,
    cabang_id UUID NOT NULL REFERENCES cabang(id) ON DELETE CASCADE,
    kuantitas NUMERIC(15,4) DEFAULT 0 NOT NULL,
    kuantitas_tersedia NUMERIC(15,4) DEFAULT 0 NOT NULL,
    kuantitas_tertahan NUMERIC(15,4) DEFAULT 0 NOT NULL,
    hpp_rata_rata NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_nilai NUMERIC(15,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_stok_produk_cabang UNIQUE (produk_id, cabang_id)
);

CREATE INDEX IF NOT EXISTS idx_stok_produk_kode ON stok_produk(kode);
CREATE INDEX IF NOT EXISTS idx_stok_produk_produk ON stok_produk(produk_id);
CREATE INDEX IF NOT EXISTS idx_stok_produk_cabang ON stok_produk(cabang_id);
CREATE INDEX IF NOT EXISTS idx_stok_produk_deleted_at ON stok_produk(deleted_at);

CREATE TABLE IF NOT EXISTS kartu_stok (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    cabang_id UUID NOT NULL REFERENCES cabang(id) ON DELETE RESTRICT,
    produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
    tanggal TIMESTAMPTZ DEFAULT now() NOT NULL,
    jenis_mutasi TEXT NOT NULL CHECK (
        jenis_mutasi IN (
            'saldo_awal',
            'masuk_pembelian',
            'keluar_penjualan',
            'penyesuaian_masuk',
            'penyesuaian_keluar',
            'keluar_paket',
            'retur_masuk',
            'retur_keluar'
        )
    ),
    nomor_referensi TEXT,
    referensi_id UUID,
    satuan_produk_id UUID REFERENCES satuan_produk(id) ON DELETE SET NULL,
    kuantitas_transaksi NUMERIC(15,4) DEFAULT 0 NOT NULL,
    faktor_konversi NUMERIC(15,4) DEFAULT 1 NOT NULL,
    kuantitas_masuk NUMERIC(15,4) DEFAULT 0 NOT NULL,
    kuantitas_keluar NUMERIC(15,4) DEFAULT 0 NOT NULL,
    sisa_kuantitas NUMERIC(15,4) DEFAULT 0 NOT NULL,
    harga_satuan NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_nilai_masuk NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_nilai_keluar NUMERIC(15,2) DEFAULT 0 NOT NULL,
    saldo_nilai NUMERIC(15,2) DEFAULT 0 NOT NULL,
    hpp_rata_rata NUMERIC(15,2) DEFAULT 0 NOT NULL,
    batch_nomor TEXT,
    tanggal_kadaluarsa DATE,
    kartu_stok_masuk_id UUID REFERENCES kartu_stok(id) ON DELETE SET NULL,
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_kartu_stok_kode ON kartu_stok(kode);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_cabang_produk_tgl ON kartu_stok(cabang_id, produk_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_produk ON kartu_stok(produk_id);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_cabang ON kartu_stok(cabang_id);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_jenis_mutasi ON kartu_stok(jenis_mutasi);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_fifo_ref ON kartu_stok(kartu_stok_masuk_id);
CREATE INDEX IF NOT EXISTS idx_kartu_stok_deleted_at ON kartu_stok(deleted_at);

-- ==============================================================================
-- 7. TABEL PENYESUAIAN STOK (STOCK OPNAME)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS penyesuaian_stok (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    cabang_id UUID NOT NULL REFERENCES cabang(id) ON DELETE RESTRICT,
    tanggal TIMESTAMPTZ DEFAULT now() NOT NULL,
    tipe_penyesuaian TEXT NOT NULL CHECK (tipe_penyesuaian IN ('saldo_awal', 'opname', 'koreksi')),
    status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'selesai', 'dibatalkan')),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_kode ON penyesuaian_stok(kode);
CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_cabang ON penyesuaian_stok(cabang_id);
CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_status ON penyesuaian_stok(status);
CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_deleted_at ON penyesuaian_stok(deleted_at);

CREATE TABLE IF NOT EXISTS penyesuaian_stok_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    penyesuaian_stok_id UUID NOT NULL REFERENCES penyesuaian_stok(id) ON DELETE CASCADE,
    produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
    satuan_produk_id UUID REFERENCES satuan_produk(id) ON DELETE RESTRICT,
    stok_buku NUMERIC(15,4) DEFAULT 0 NOT NULL,
    stok_fisik NUMERIC(15,4) DEFAULT 0 NOT NULL,
    selisih NUMERIC(15,4) DEFAULT 0 NOT NULL,
    harga_satuan NUMERIC(15,2) DEFAULT 0 NOT NULL,
    total_nilai_penyesuaian NUMERIC(15,2) DEFAULT 0 NOT NULL,
    alasan TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_item_kode ON penyesuaian_stok_item(kode);
CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_item_ref ON penyesuaian_stok_item(penyesuaian_stok_id);
CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_item_produk ON penyesuaian_stok_item(produk_id);
CREATE INDEX IF NOT EXISTS idx_penyesuaian_stok_item_deleted_at ON penyesuaian_stok_item(deleted_at);

-- ==============================================================================
-- 8. TABEL LOG AUDIT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS log_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode TEXT UNIQUE NOT NULL,
    organisasi_id UUID REFERENCES organisasi(id) ON DELETE CASCADE,
    cabang_id UUID REFERENCES cabang(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tabel_nama TEXT NOT NULL,
    record_id UUID,
    aksi TEXT NOT NULL,
    data_lama JSONB,
    data_baru JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_log_audit_kode ON log_audit(kode);
CREATE INDEX IF NOT EXISTS idx_log_audit_tabel ON log_audit(tabel_nama);
CREATE INDEX IF NOT EXISTS idx_log_audit_record ON log_audit(record_id);
CREATE INDEX IF NOT EXISTS idx_log_audit_cabang ON log_audit(cabang_id);
CREATE INDEX IF NOT EXISTS idx_log_audit_created_at ON log_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_log_audit_deleted_at ON log_audit(deleted_at);

-- ==============================================================================
-- 9. TRIGGERS UPDATED_AT
-- ==============================================================================

CREATE OR REPLACE TRIGGER trg_urutan_kode_updated_at BEFORE UPDATE ON urutan_kode FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_organisasi_updated_at BEFORE UPDATE ON organisasi FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_cabang_updated_at BEFORE UPDATE ON cabang FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_user_profile_updated_at BEFORE UPDATE ON user_profile FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_user_cabang_updated_at BEFORE UPDATE ON user_cabang FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_kategori_produk_updated_at BEFORE UPDATE ON kategori_produk FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_produk_updated_at BEFORE UPDATE ON produk FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_satuan_produk_updated_at BEFORE UPDATE ON satuan_produk FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_komponen_paket_updated_at BEFORE UPDATE ON komponen_paket FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_stok_produk_updated_at BEFORE UPDATE ON stok_produk FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_kartu_stok_updated_at BEFORE UPDATE ON kartu_stok FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_penyesuaian_stok_updated_at BEFORE UPDATE ON penyesuaian_stok FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_penyesuaian_stok_item_updated_at BEFORE UPDATE ON penyesuaian_stok_item FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_log_audit_updated_at BEFORE UPDATE ON log_audit FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM user_profile
        WHERE user_id = auth.uid()
          AND role = 'superadmin'
          AND is_aktif = true
          AND deleted_at IS NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION auth.has_branch_access(target_cabang_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Superadmin & HQ Manager memiliki akses universal ke seluruh cabang
    IF EXISTS (
        SELECT 1
        FROM user_profile
        WHERE user_id = auth.uid()
          AND role IN ('superadmin', 'hq_manager')
          AND is_aktif = true
          AND deleted_at IS NULL
    ) THEN
        RETURN TRUE;
    END IF;

    -- Branch Manager, Staff, Viewer wajib terdaftar pada tabel user_cabang
    RETURN EXISTS (
        SELECT 1
        FROM user_cabang uc
        JOIN user_profile up ON up.id = uc.user_profile_id
        WHERE up.user_id = auth.uid()
          AND uc.cabang_id = target_cabang_id
          AND up.is_aktif = true
          AND up.deleted_at IS NULL
          AND uc.deleted_at IS NULL
    );
END;
$$;

-- Helper untuk mendapatkan ID Organisasi pengguna aktif tanpa self-recursion di RLS
CREATE OR REPLACE FUNCTION auth.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_org_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT organisasi_id INTO v_org_id
    FROM user_profile
    WHERE user_id = auth.uid()
      AND is_aktif = true
      AND deleted_at IS NULL
    LIMIT 1;

    RETURN v_org_id;
END;
$$;

-- Alias fungsi pada skema public untuk kemudahan pemanggilan
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT auth.is_superadmin();
$$;

CREATE OR REPLACE FUNCTION public.has_branch_access(target_cabang_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT auth.has_branch_access(target_cabang_id);
$$;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT auth.get_user_organization_id();
$$;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE urutan_kode ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabang ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cabang ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori_produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE satuan_produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE komponen_paket ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE kartu_stok ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyesuaian_stok ENABLE ROW LEVEL SECURITY;
ALTER TABLE penyesuaian_stok_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_audit ENABLE ROW LEVEL SECURITY;

-- Polisi urutan_kode
CREATE POLICY "urutan_kode_select_auth" ON urutan_kode
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "urutan_kode_all_auth" ON urutan_kode
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Polisi organisasi
CREATE POLICY "organisasi_select_policy" ON organisasi
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
CREATE POLICY "organisasi_modify_policy" ON organisasi
    FOR ALL TO authenticated
    USING (auth.is_superadmin() AND deleted_at IS NULL)
    WITH CHECK (auth.is_superadmin());

-- Polisi cabang
CREATE POLICY "cabang_select_policy" ON cabang
    FOR SELECT TO authenticated
    USING (auth.has_branch_access(id) AND deleted_at IS NULL);
CREATE POLICY "cabang_modify_policy" ON cabang
    FOR ALL TO authenticated
    USING (auth.is_superadmin() AND deleted_at IS NULL)
    WITH CHECK (auth.is_superadmin());

-- Polisi user_profile
CREATE POLICY "user_profile_select_policy" ON user_profile
    FOR SELECT TO authenticated
    USING (
        (
            auth.uid() = user_id
            OR auth.is_superadmin()
            OR organisasi_id = auth.get_user_organization_id()
        )
        AND deleted_at IS NULL
    );
CREATE POLICY "user_profile_modify_policy" ON user_profile
    FOR ALL TO authenticated
    USING (auth.is_superadmin() OR auth.uid() = user_id)
    WITH CHECK (auth.is_superadmin() OR auth.uid() = user_id);

-- Polisi user_cabang
CREATE POLICY "user_cabang_select_policy" ON user_cabang
    FOR SELECT TO authenticated
    USING (
        (auth.has_branch_access(cabang_id) OR auth.is_superadmin())
        AND deleted_at IS NULL
    );
CREATE POLICY "user_cabang_modify_policy" ON user_cabang
    FOR ALL TO authenticated
    USING (auth.is_superadmin() AND deleted_at IS NULL)
    WITH CHECK (auth.is_superadmin());

-- Polisi kategori_produk
CREATE POLICY "kategori_produk_select_policy" ON kategori_produk
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
CREATE POLICY "kategori_produk_modify_policy" ON kategori_produk
    FOR ALL TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);

-- Polisi produk
CREATE POLICY "produk_select_policy" ON produk
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
CREATE POLICY "produk_modify_policy" ON produk
    FOR ALL TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);

-- Polisi satuan_produk
CREATE POLICY "satuan_produk_select_policy" ON satuan_produk
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
CREATE POLICY "satuan_produk_modify_policy" ON satuan_produk
    FOR ALL TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);

-- Polisi komponen_paket
CREATE POLICY "komponen_paket_select_policy" ON komponen_paket
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
CREATE POLICY "komponen_paket_modify_policy" ON komponen_paket
    FOR ALL TO authenticated
    USING (deleted_at IS NULL)
    WITH CHECK (true);

-- Polisi stok_produk (Branch Scoped)
CREATE POLICY "stok_produk_select_policy" ON stok_produk
    FOR SELECT TO authenticated
    USING (auth.has_branch_access(cabang_id) AND deleted_at IS NULL);
CREATE POLICY "stok_produk_modify_policy" ON stok_produk
    FOR ALL TO authenticated
    USING (auth.has_branch_access(cabang_id))
    WITH CHECK (auth.has_branch_access(cabang_id));

-- Polisi kartu_stok (Branch Scoped Ledger)
CREATE POLICY "kartu_stok_select_policy" ON kartu_stok
    FOR SELECT TO authenticated
    USING (auth.has_branch_access(cabang_id) AND deleted_at IS NULL);
CREATE POLICY "kartu_stok_insert_policy" ON kartu_stok
    FOR INSERT TO authenticated
    WITH CHECK (auth.has_branch_access(cabang_id));
CREATE POLICY "kartu_stok_update_policy" ON kartu_stok
    FOR UPDATE TO authenticated
    USING (auth.is_superadmin() AND deleted_at IS NULL)
    WITH CHECK (auth.is_superadmin());

-- Polisi penyesuaian_stok (Branch Scoped)
CREATE POLICY "penyesuaian_stok_select_policy" ON penyesuaian_stok
    FOR SELECT TO authenticated
    USING (auth.has_branch_access(cabang_id) AND deleted_at IS NULL);
CREATE POLICY "penyesuaian_stok_modify_policy" ON penyesuaian_stok
    FOR ALL TO authenticated
    USING (auth.has_branch_access(cabang_id))
    WITH CHECK (auth.has_branch_access(cabang_id));

-- Polisi penyesuaian_stok_item
CREATE POLICY "penyesuaian_stok_item_select_policy" ON penyesuaian_stok_item
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM penyesuaian_stok ps
            WHERE ps.id = penyesuaian_stok_item.penyesuaian_stok_id
              AND auth.has_branch_access(ps.cabang_id)
        )
        AND deleted_at IS NULL
    );
CREATE POLICY "penyesuaian_stok_item_modify_policy" ON penyesuaian_stok_item
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM penyesuaian_stok ps
            WHERE ps.id = penyesuaian_stok_item.penyesuaian_stok_id
              AND auth.has_branch_access(ps.cabang_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM penyesuaian_stok ps
            WHERE ps.id = penyesuaian_stok_item.penyesuaian_stok_id
              AND auth.has_branch_access(ps.cabang_id)
        )
    );

-- Polisi log_audit
CREATE POLICY "log_audit_select_policy" ON log_audit
    FOR SELECT TO authenticated
    USING (
        (auth.is_superadmin() OR (cabang_id IS NOT NULL AND auth.has_branch_access(cabang_id)))
        AND deleted_at IS NULL
    );
CREATE POLICY "log_audit_insert_policy" ON log_audit
    FOR INSERT TO authenticated
    WITH CHECK (true);
