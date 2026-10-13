-- ==============================================================================
-- ZEROPOINT MULTI-BRANCH ADMIN DASHBOARD TEMPLATE
-- Data Awal / Seed: Organisasi, Multi-Cabang, Produk Multi-Satuan & Kartu Stok
-- File: supabase/seed.sql
-- ==============================================================================

-- 1. Inisialisasi Organisasi Utama
INSERT INTO organisasi (id, kode, nama, logo_url, pengaturan)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ORG-0001',
    'PT Zeropoint Nusantara',
    '/logo.png',
    '{"mata_uang": "IDR", "zona_waktu": "Asia/Jakarta", "format_tanggal": "DD/MM/YYYY"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 2. Inisialisasi Cabang (Pusat HQ, Cabang Surabaya, Gudang Logistik Cikarang)
INSERT INTO cabang (id, kode, organisasi_id, nama, tipe, alamat, kota, telepon, is_aktif)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'HQ-0001',
        '00000000-0000-0000-0000-000000000001',
        'Kantor Pusat Jakarta (HQ)',
        'pusat',
        'Jl. Jenderal Sudirman Kav. 52-53',
        'Jakarta Selatan',
        '021-5551234',
        true
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'CBG-0001',
        '00000000-0000-0000-0000-000000000001',
        'Cabang Surabaya',
        'cabang',
        'Jl. Basuki Rahmat No. 45',
        'Surabaya',
        '031-5554321',
        true
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'GDG-0001',
        '00000000-0000-0000-0000-000000000001',
        'Gudang Logistik Cikarang',
        'gudang',
        'Kawasan Industri GIIC Blok C No. 12',
        'Cikarang, Bekasi',
        '021-8998001',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 2.5 Inisialisasi Pengguna auth.users Supabase
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@zeropoint.local', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Superadmin Direksi"}', now(), now()),
    ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager.hq@zeropoint.local', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Budi Santoso"}', now(), now()),
    ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bm.sby@zeropoint.local', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Siti Rahayu"}', now(), now()),
    ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff.ckr@zeropoint.local', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ahmad Fauzi"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Inisialisasi Pengguna Awal (Superadmin, HQ Manager, Branch Manager, Staff Gudang)
INSERT INTO user_profile (id, kode, organisasi_id, user_id, email, nama_lengkap, role, is_aktif)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'USR-0001',
        '00000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'admin@zeropoint.local',
        'Superadmin Direksi',
        'superadmin',
        true
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'USR-0002',
        '00000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'manager.hq@zeropoint.local',
        'Budi Santoso (HQ Manager)',
        'hq_manager',
        true
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'USR-0003',
        '00000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000003',
        'bm.sby@zeropoint.local',
        'Siti Rahayu (BM Surabaya)',
        'branch_manager',
        true
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        'USR-0004',
        '00000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000004',
        'staff.ckr@zeropoint.local',
        'Ahmad Fauzi (Operator Gudang)',
        'staff',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 4. Penugasan Pengguna ke Cabang (user_cabang)
INSERT INTO user_cabang (id, kode, user_profile_id, cabang_id, is_default)
VALUES
    (
        '21000000-0000-0000-0000-000000000001',
        'UCB-0001',
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        true
    ),
    (
        '21000000-0000-0000-0000-000000000002',
        'UCB-0002',
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        true
    ),
    (
        '21000000-0000-0000-0000-000000000003',
        'UCB-0003',
        '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000002',
        true
    ),
    (
        '21000000-0000-0000-0000-000000000004',
        'UCB-0004',
        '20000000-0000-0000-0000-000000000004',
        '10000000-0000-0000-0000-000000000003',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 5. Inisialisasi Kategori Produk
INSERT INTO kategori_produk (id, kode, organisasi_id, nama, keterangan)
VALUES
    (
        '30000000-0000-0000-0000-000000000001',
        'KAT-0001',
        '00000000-0000-0000-0000-000000000001',
        'Makanan & Minuman',
        'Kebutuhan pokok dan makanan cepat saji persediaan'
    ),
    (
        '30000000-0000-0000-0000-000000000002',
        'KAT-0002',
        '00000000-0000-0000-0000-000000000001',
        'Elektronik & Perangkat Komputer',
        'Periferal IT dan aksesoris kantor'
    ),
    (
        '30000000-0000-0000-0000-000000000003',
        'KAT-0003',
        '00000000-0000-0000-0000-000000000001',
        'Layanan & Servis IT',
        'Jasa instalasi, perbaikan, dan pemeliharaan teknis'
    ),
    (
        '30000000-0000-0000-0000-000000000004',
        'KAT-0004',
        '00000000-0000-0000-0000-000000000001',
        'Paket Bundling Solusi',
        'Paket gabungan hardware dan layanan setup'
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Inisialisasi Produk
-- PRD-0001: Indomie Goreng Spesial (Persediaan, Multi-Satuan: Pcs & Karton)
-- PRD-0002: Mouse Logitech B100 (Persediaan, Satuan Tunggal: Unit, FIFO)
-- PRD-0003: Jasa Instalasi Workstation (Jasa)
-- PRD-0004: Paket Workstation Hemat (Paket Dinamis on-the-fly)
INSERT INTO produk (
    id,
    kode,
    organisasi_id,
    kategori_produk_id,
    nama,
    tipe_produk,
    metode_valuasi,
    harga_pokok_standar,
    harga_beli_terakhir,
    peringatan_stok_minimum,
    dapat_dijual,
    dapat_dibeli,
    deskripsi,
    is_aktif
) VALUES
    (
        '40000000-0000-0000-0000-000000000001',
        'PRD-0001',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        'Indomie Goreng Spesial',
        'persediaan',
        'rata_rata',
        2800.00,
        2800.00,
        50.00,
        true,
        true,
        'Mie instan goreng rasa original 85g dengan multi-satuan Pcs dan Karton (40 Pcs)',
        true
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        'PRD-0002',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000002',
        'Mouse Logitech B100 Optical USB',
        'persediaan',
        'fifo',
        45000.00,
        45000.00,
        10.00,
        true,
        true,
        'Mouse kabel USB optical standar kantor dengan metode valuasi FIFO',
        true
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        'PRD-0003',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000003',
        'Jasa Instalasi & Setup Workstation',
        'jasa',
        'rata_rata',
        0.00,
        0.00,
        0.00,
        true,
        false,
        'Layanan perakitan, konfigurasi OS, instalasi software dan jaringan per workstation',
        true
    ),
    (
        '40000000-0000-0000-0000-000000000004',
        'PRD-0004',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000004',
        'Paket Workstation Hemat',
        'paket',
        'rata_rata',
        0.00,
        0.00,
        0.00,
        true,
        false,
        'Paket bundling hemat berisi 1x Mouse Logitech + 1x Jasa Instalasi Workstation',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 7. Inisialisasi Satuan Produk (Multi-Satuan)
INSERT INTO satuan_produk (
    id,
    kode,
    produk_id,
    nama_satuan,
    rasio_ke_dasar,
    is_satuan_dasar,
    barcode,
    harga_jual_default,
    harga_jual_grosir,
    harga_jual_member
) VALUES
    -- Indomie: Satuan Dasar = Pcs (rasio 1)
    (
        '50000000-0000-0000-0000-000000000001',
        'SAT-0001',
        '40000000-0000-0000-0000-000000000001',
        'Pcs',
        1.0000,
        true,
        '8998866200111',
        3500.00,
        3300.00,
        3200.00
    ),
    -- Indomie: Satuan 2 = Karton (rasio 40)
    (
        '50000000-0000-0000-0000-000000000002',
        'SAT-0002',
        '40000000-0000-0000-0000-000000000001',
        'Karton',
        40.0000,
        false,
        '8998866200128',
        135000.00,
        130000.00,
        128000.00
    ),
    -- Mouse Logitech: Satuan Dasar = Unit
    (
        '50000000-0000-0000-0000-000000000003',
        'SAT-0003',
        '40000000-0000-0000-0000-000000000002',
        'Unit',
        1.0000,
        true,
        '097855065431',
        65000.00,
        60000.00,
        58000.00
    ),
    -- Jasa Instalasi: Satuan Dasar = Layanan
    (
        '50000000-0000-0000-0000-000000000004',
        'SAT-0004',
        '40000000-0000-0000-0000-000000000003',
        'Layanan',
        1.0000,
        true,
        'SRV-0001',
        150000.00,
        150000.00,
        135000.00
    ),
    -- Paket Workstation: Satuan Dasar = Paket
    (
        '50000000-0000-0000-0000-000000000005',
        'SAT-0005',
        '40000000-0000-0000-0000-000000000004',
        'Paket',
        1.0000,
        true,
        'BDL-0001',
        200000.00,
        190000.00,
        185000.00
    )
ON CONFLICT (id) DO NOTHING;

-- 8. Komponen Paket untuk PRD-0004 (Paket Workstation Hemat)
-- Komponen 1: Mouse Logitech (PRD-0002) x 1 Unit
-- Komponen 2: Jasa Instalasi (PRD-0003) x 1 Layanan
INSERT INTO komponen_paket (
    id,
    kode,
    paket_id,
    produk_komponen_id,
    satuan_produk_id,
    kuantitas
) VALUES
    (
        '60000000-0000-0000-0000-000000000001',
        'KPK-0001',
        '40000000-0000-0000-0000-000000000004',
        '40000000-0000-0000-0000-000000000002',
        '50000000-0000-0000-0000-000000000003',
        1.0000
    ),
    (
        '60000000-0000-0000-0000-000000000002',
        'KPK-0002',
        '40000000-0000-0000-0000-000000000004',
        '40000000-0000-0000-0000-000000000003',
        '50000000-0000-0000-0000-000000000004',
        1.0000
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Inisialisasi Saldo Awal Stok Produk per Cabang (stok_produk)
-- Normalisasi: Seluruh kuantitas dicatat dalam SATUAN DASAR
INSERT INTO stok_produk (
    id,
    kode,
    produk_id,
    cabang_id,
    kuantitas,
    kuantitas_tersedia,
    kuantitas_tertahan,
    hpp_rata_rata,
    total_nilai
) VALUES
    -- Indomie di Kantor Pusat (HQ): 200 Pcs (setara 5 Karton) @ Rp 2.800 = Rp 560.000
    (
        '70000000-0000-0000-0000-000000000001',
        'STK-0001',
        '40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        200.0000,
        200.0000,
        0.0000,
        2800.00,
        560000.00
    ),
    -- Indomie di Gudang Cikarang: 400 Pcs (setara 10 Karton) @ Rp 2.750 = Rp 1.100.000
    (
        '70000000-0000-0000-0000-000000000002',
        'STK-0002',
        '40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        400.0000,
        400.0000,
        0.0000,
        2750.00,
        1100000.00
    ),
    -- Mouse Logitech di Kantor Pusat (HQ): 25 Unit @ Rp 45.000 = Rp 1.125.000
    (
        '70000000-0000-0000-0000-000000000003',
        'STK-0003',
        '40000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        25.0000,
        25.0000,
        0.0000,
        45000.00,
        1125000.00
    ),
    -- Mouse Logitech di Cabang Surabaya: 10 Unit @ Rp 46.000 = Rp 460.000
    (
        '70000000-0000-0000-0000-000000000004',
        'STK-0004',
        '40000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002',
        10.0000,
        10.0000,
        0.0000,
        46000.00,
        460000.00
    )
ON CONFLICT (id) DO NOTHING;

-- 10. Inisialisasi Mutasi Buku Besar Kartu Stok (kartu_stok)
INSERT INTO kartu_stok (
    id,
    kode,
    cabang_id,
    produk_id,
    tanggal,
    jenis_mutasi,
    nomor_referensi,
    satuan_produk_id,
    kuantitas_transaksi,
    faktor_konversi,
    kuantitas_masuk,
    kuantitas_keluar,
    sisa_kuantitas,
    harga_satuan,
    total_nilai_masuk,
    total_nilai_keluar,
    saldo_nilai,
    hpp_rata_rata,
    catatan
) VALUES
    -- Saldo Awal Indomie di HQ (Transaksi 5 Karton = 200 Pcs)
    (
        '80000000-0000-0000-0000-000000000001',
        'KST-20261013-0001',
        '10000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001',
        '2026-10-13 00:00:00+07',
        'saldo_awal',
        'SA-20261013-0001',
        '50000000-0000-0000-0000-000000000002',
        5.0000,
        40.0000,
        200.0000,
        0.0000,
        200.0000,
        2800.00,
        560000.00,
        0.00,
        560000.00,
        2800.00,
        'Saldo awal persediaan kantor pusat (5 Karton)'
    ),
    -- Saldo Awal Indomie di Gudang Cikarang (Transaksi 10 Karton = 400 Pcs)
    (
        '80000000-0000-0000-0000-000000000002',
        'KST-20261013-0002',
        '10000000-0000-0000-0000-000000000003',
        '40000000-0000-0000-0000-000000000001',
        '2026-10-13 00:00:00+07',
        'saldo_awal',
        'SA-20261013-0002',
        '50000000-0000-0000-0000-000000000002',
        10.0000,
        40.0000,
        400.0000,
        0.0000,
        400.0000,
        2750.00,
        1100000.00,
        0.00,
        1100000.00,
        2750.00,
        'Saldo awal persediaan gudang logistik cikarang (10 Karton)'
    ),
    -- Saldo Awal Mouse Logitech di HQ (25 Unit)
    (
        '80000000-0000-0000-0000-000000000003',
        'KST-20261013-0003',
        '10000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000002',
        '2026-10-13 00:00:00+07',
        'saldo_awal',
        'SA-20261013-0003',
        '50000000-0000-0000-0000-000000000003',
        25.0000,
        1.0000,
        25.0000,
        0.0000,
        25.0000,
        45000.00,
        1125000.00,
        0.00,
        1125000.00,
        45000.00,
        'Saldo awal unit inventaris kantor pusat (lapisan FIFO #1)'
    ),
    -- Saldo Awal Mouse Logitech di Cabang Surabaya (10 Unit)
    (
        '80000000-0000-0000-0000-000000000004',
        'KST-20261013-0004',
        '10000000-0000-0000-0000-000000000002',
        '40000000-0000-0000-0000-000000000002',
        '2026-10-13 00:00:00+07',
        'saldo_awal',
        'SA-20261013-0004',
        '50000000-0000-0000-0000-000000000003',
        10.0000,
        1.0000,
        10.0000,
        0.0000,
        10.0000,
        46000.00,
        460000.00,
        0.00,
        460000.00,
        460000.00,
        'Saldo awal unit inventaris cabang surabaya'
    )
ON CONFLICT (id) DO NOTHING;

-- 11. SINKRONISASI SEQUENCE URUTAN_KODE UNTUK SELURUH TABEL
DO $$
BEGIN
    -- Organisasi & Cabang
    PERFORM sinkron_urutan_kode('organisasi', 'kode', 'ORG', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('cabang', 'kode', 'HQ', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('cabang', 'kode', 'CBG', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('cabang', 'kode', 'GDG', 'tanpa_reset');

    -- User Profile & User Cabang
    PERFORM sinkron_urutan_kode('user_profile', 'kode', 'USR', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('user_cabang', 'kode', 'UCB', 'tanpa_reset');

    -- Kategori, Produk, Satuan & Komponen Paket
    PERFORM sinkron_urutan_kode('kategori_produk', 'kode', 'KAT', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('produk', 'kode', 'PRD', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('satuan_produk', 'kode', 'SAT', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('komponen_paket', 'kode', 'KPK', 'tanpa_reset');

    -- Stok Produk & Kartu Stok
    PERFORM sinkron_urutan_kode('stok_produk', 'kode', 'STK', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('kartu_stok', 'kode', 'KST', 'harian', '2026-10-13');

    -- Penyesuaian Stok & Audit Log
    PERFORM sinkron_urutan_kode('penyesuaian_stok', 'kode', 'ADJ', 'harian', '2026-10-13');
    PERFORM sinkron_urutan_kode('penyesuaian_stok_item', 'kode', 'ADI', 'tanpa_reset');
    PERFORM sinkron_urutan_kode('log_audit', 'kode', 'AUD', 'tanpa_reset');
END;
$$;
