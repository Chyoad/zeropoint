import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'
import {
  type LogAudit,
  type OpsiFilterLogAudit,
  formatBadgeAksi,
} from '@/lib/validasi/log-audit'

export {
  type LogAudit,
  type OpsiFilterLogAudit,
  formatBadgeAksi,
}

export const INITIAL_DEMO_LOG_AUDIT: LogAudit[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    kode: 'LOG-20261014-0001',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'CREATE',
    entitas: 'produk',
    entitas_id: '40000000-0000-0000-0000-000000000001',
    tabel_nama: 'produk',
    record_id: '40000000-0000-0000-0000-000000000001',
    data_lama: null,
    data_baru: {
      kode: 'PRD-0001',
      nama: 'Indomie Goreng Spesial',
      tipe_produk: 'persediaan',
      metode_valuasi: 'rata_rata',
      harga_pokok_standar: 2800,
      dapat_dijual: true,
      dapat_dibeli: true,
      satuan: [
        { nama_satuan: 'Pcs', rasio_ke_dasar: 1, is_satuan_dasar: true, harga_jual_default: 3500 },
        { nama_satuan: 'Karton', rasio_ke_dasar: 40, is_satuan_dasar: false, harga_jual_default: 135000 },
      ],
    },
    deskripsi: 'Membuat master produk baru PRD-0001 (Indomie Goreng Spesial) dengan multi-satuan Pcs & Karton',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T08:00:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000002',
    kode: 'LOG-20261014-0002',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'CREATE',
    entitas: 'kartu_stok',
    entitas_id: '80000000-0000-0000-0000-000000000001',
    tabel_nama: 'kartu_stok',
    record_id: '80000000-0000-0000-0000-000000000001',
    data_lama: null,
    data_baru: {
      kode: 'KST-20261013-0001',
      cabang_id: '10000000-0000-0000-0000-000000000001',
      produk_id: '40000000-0000-0000-0000-000000000001',
      jenis_mutasi: 'saldo_awal',
      kuantitas_masuk: 200,
      harga_satuan: 2800,
      saldo_nilai: 560000,
      hpp_rata_rata: 2800,
    },
    deskripsi: 'Input saldo awal persediaan 200 Pcs Indomie Goreng Spesial di Kantor Pusat Jakarta',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T08:15:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000003',
    kode: 'LOG-20261014-0003',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'CREATE',
    entitas: 'user_profile',
    entitas_id: '20000000-0000-0000-0000-000000000002',
    tabel_nama: 'user_profile',
    record_id: '20000000-0000-0000-0000-000000000002',
    data_lama: null,
    data_baru: {
      kode: 'USR-0002',
      nama_lengkap: 'Budi Santoso',
      email: 'manager.hq@zeropoint.local',
      role: 'hq_manager',
      is_aktif: true,
    },
    deskripsi: 'Mendaftarkan pengguna baru Budi Santoso dengan hak akses HQ Manager',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T09:00:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000004',
    kode: 'LOG-20261014-0004',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'CREATE',
    entitas: 'user_cabang',
    entitas_id: '21000000-0000-0000-0000-000000000002',
    tabel_nama: 'user_cabang',
    record_id: '21000000-0000-0000-0000-000000000002',
    data_lama: null,
    data_baru: {
      user_profile_id: '20000000-0000-0000-0000-000000000002',
      cabang_id: '10000000-0000-0000-0000-000000000001',
      is_default: true,
    },
    deskripsi: 'Menugaskan user Budi Santoso ke Kantor Pusat Jakarta (HQ) sebagai default cabang',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T09:05:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000005',
    kode: 'LOG-20261014-0005',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000003',
    cabang_nama: 'Gudang Logistik Cikarang',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'UPDATE',
    entitas: 'cabang',
    entitas_id: '10000000-0000-0000-0000-000000000003',
    tabel_nama: 'cabang',
    record_id: '10000000-0000-0000-0000-000000000003',
    data_lama: {
      nama: 'Gudang Cikarang',
      telepon: '021-8998000',
    },
    data_baru: {
      nama: 'Gudang Logistik Cikarang',
      telepon: '021-8998001',
    },
    deskripsi: 'Memperbarui nama resmi dan nomor kontak operasional fasilitas Gudang Logistik Cikarang',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T10:30:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000006',
    kode: 'LOG-20261014-0006',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000002',
    user_nama: 'Budi Santoso',
    aksi: 'CREATE',
    entitas: 'kartu_stok',
    entitas_id: '80000000-0000-0000-0000-000000000005',
    tabel_nama: 'kartu_stok',
    record_id: '80000000-0000-0000-0000-000000000005',
    data_lama: null,
    data_baru: {
      kode: 'KST-20261013-0005',
      jenis_mutasi: 'masuk_pembelian',
      nomor_referensi: 'PO-20261013-0001',
      satuan: 'Karton (40 Pcs)',
      kuantitas_transaksi: 2,
      kuantitas_masuk: 80,
      harga_satuan: 3000,
      total_nilai_masuk: 240000,
      hpp_rata_rata_baru: 2857.14,
    },
    deskripsi: 'Penerimaan barang masuk dari PO-20261013-0001 sebanyak 2 Karton Indomie Goreng @ Rp 3.000',
    ip_address: '192.168.1.15',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T11:00:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000007',
    kode: 'LOG-20261014-0007',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000002',
    cabang_nama: 'Cabang Surabaya',
    user_id: '20000000-0000-0000-0000-000000000003',
    user_nama: 'Siti Rahmawati',
    aksi: 'CREATE',
    entitas: 'penyesuaian_stok',
    entitas_id: '70000000-0000-0000-0000-000000000001',
    tabel_nama: 'penyesuaian_stok',
    record_id: '70000000-0000-0000-0000-000000000001',
    data_lama: null,
    data_baru: {
      kode: 'OPN-20261013-0001',
      cabang_id: '10000000-0000-0000-0000-000000000002',
      tipe_penyesuaian: 'opname',
      status: 'draft',
      items: [
        { produk: 'Indomie Goreng Spesial', stok_buku: 100, stok_fisik: 105, selisih: 5 },
      ],
    },
    deskripsi: 'Membuat draft transaksi Stock Opname OPN-20261013-0001 untuk Cabang Surabaya',
    ip_address: '192.168.2.20',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T14:30:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000008',
    kode: 'LOG-20261014-0008',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000002',
    cabang_nama: 'Cabang Surabaya',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'ADJUST',
    entitas: 'penyesuaian_stok',
    entitas_id: '70000000-0000-0000-0000-000000000001',
    tabel_nama: 'penyesuaian_stok',
    record_id: '70000000-0000-0000-0000-000000000001',
    data_lama: {
      status: 'draft',
    },
    data_baru: {
      status: 'selesai',
      selisih_fisik: 5,
      total_nilai_selisih: 14000,
      posting_kartu_stok: 'KST-20261013-0004',
    },
    deskripsi: 'Menyelesaikan Stock Opname OPN-20261013-0001: posting selisih +5 pcs (Rp 14.000) ke buku besar kartu stok',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-13T16:00:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000009',
    kode: 'LOG-20261014-0009',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000002',
    user_nama: 'Budi Santoso',
    aksi: 'CREATE',
    entitas: 'produk',
    entitas_id: '40000000-0000-0000-0000-000000000003',
    tabel_nama: 'produk',
    record_id: '40000000-0000-0000-0000-000000000003',
    data_lama: null,
    data_baru: {
      kode: 'PRD-0003',
      nama: 'Paket Hemat Sembako Mantap',
      tipe_produk: 'paket',
      harga_pokok_standar: 32800,
      komponen: [
        { produk: 'Indomie Goreng Spesial', kuantitas: 5, satuan: 'Pcs' },
        { produk: 'Beras Premium Ramos 5kg', kuantitas: 1, satuan: 'Karung' },
      ],
    },
    deskripsi: 'Membuat paket barang dinamis PRD-0003 dengan 2 item komponen perakitan',
    ip_address: '192.168.1.15',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-14T02:00:00.000Z',
  },
  {
    id: '90000000-0000-0000-0000-000000000010',
    kode: 'LOG-20261014-0010',
    organisasi_id: '00000000-0000-0000-0000-000000000001',
    cabang_id: '10000000-0000-0000-0000-000000000001',
    cabang_nama: 'Kantor Pusat Jakarta (HQ)',
    user_id: '20000000-0000-0000-0000-000000000001',
    user_nama: 'Superadmin Direksi',
    aksi: 'UPDATE',
    entitas: 'organisasi',
    entitas_id: '00000000-0000-0000-0000-000000000001',
    tabel_nama: 'organisasi',
    record_id: '00000000-0000-0000-0000-000000000001',
    data_lama: {
      email: 'info@zeropoint.local',
      telepon: '021-5550000',
    },
    data_baru: {
      email: 'corporate@zeropoint.local',
      telepon: '021-5551234',
    },
    deskripsi: 'Memperbarui profil kontak resmi korporasi PT Zeropoint Nusantara',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZeropointApp/1.0',
    created_at: '2026-10-14T03:00:00.000Z',
  },
]

export let demoLogAuditStore: LogAudit[] = INITIAL_DEMO_LOG_AUDIT.map((log) => ({
  ...log,
  data_lama: log.data_lama ? { ...log.data_lama } : null,
  data_baru: log.data_baru ? { ...log.data_baru } : null,
}))

export function resetDemoLogAudit() {
  demoLogAuditStore = INITIAL_DEMO_LOG_AUDIT.map((log) => ({
    ...log,
    data_lama: log.data_lama ? { ...log.data_lama } : null,
    data_baru: log.data_baru ? { ...log.data_baru } : null,
  }))
}

export function tambahDemoLogAudit(log: LogAudit) {
  demoLogAuditStore.unshift(log)
}

const TIMEOUT_MS = process.env.NODE_ENV === 'test' ? 150 : 2000

export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = TIMEOUT_MS
): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timeout')), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timer!)
  }
}

/**
 * Mengambil daftar riwayat log audit trail dengan filter cabang, entitas, aksi, tanggal, dan pencarian.
 */
export async function ambilDaftarLogAudit(
  filter: OpsiFilterLogAudit = {}
): Promise<LogAudit[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('log_audit')
      .select('*, cabang(nama)')
      .order('created_at', { ascending: false })

    if (filter.cabang_id && filter.cabang_id !== 'all') {
      query = query.eq('cabang_id', filter.cabang_id)
    }
    if (filter.aksi && filter.aksi !== 'all') {
      query = query.eq('aksi', filter.aksi.toUpperCase())
    }
    if (filter.entitas && filter.entitas !== 'all') {
      query = query.eq('tabel_nama', filter.entitas)
    }
    if (filter.tanggal_mulai) {
      query = query.gte('created_at', filter.tanggal_mulai)
    }
    if (filter.tanggal_selesai) {
      query = query.lte('created_at', filter.tanggal_selesai)
    }

    const { data, error } = await withTimeout(query)

    if (error || !data || data.length === 0) {
      return filterDemoLogs(demoLogAuditStore, filter)
    }

    const mapped = (data as Array<any>).map((row) => ({
      id: row.id,
      kode: row.kode,
      organisasi_id: row.organisasi_id,
      cabang_id: row.cabang_id,
      cabang_nama: row.cabang?.nama || null,
      user_id: row.user_id,
      user_nama: null,
      aksi: row.aksi,
      entitas: row.tabel_nama,
      entitas_id: row.record_id,
      tabel_nama: row.tabel_nama,
      record_id: row.record_id,
      data_lama: (row.data_lama as Record<string, unknown>) || null,
      data_baru: (row.data_baru as Record<string, unknown>) || null,
      deskripsi: null,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: row.created_at,
    }))

    return filterDemoLogs(mapped, filter)
  } catch {
    return filterDemoLogs(demoLogAuditStore, filter)
  }
}

/**
 * Filter and paginate helper for audit logs
 */
function filterDemoLogs(
  logs: LogAudit[],
  filter: OpsiFilterLogAudit
): LogAudit[] {
  let result = [...logs]

  if (filter.cabang_id && filter.cabang_id !== 'all') {
    result = result.filter((log) => log.cabang_id === filter.cabang_id)
  }

  if (filter.aksi && filter.aksi !== 'all') {
    const targetAksi = filter.aksi.toUpperCase()
    result = result.filter((log) => (log.aksi || '').toUpperCase() === targetAksi)
  }

  if (filter.entitas && filter.entitas !== 'all') {
    const targetEntitas = filter.entitas.toLowerCase()
    result = result.filter(
      (log) =>
        (log.entitas || '').toLowerCase() === targetEntitas ||
        (log.tabel_nama || '').toLowerCase() === targetEntitas
    )
  }

  if (filter.tanggal_mulai) {
    result = result.filter((log) => log.created_at >= filter.tanggal_mulai!)
  }

  if (filter.tanggal_selesai) {
    result = result.filter((log) => log.created_at <= filter.tanggal_selesai!)
  }

  const keyword = (filter.search || filter.pencarian || '').trim().toLowerCase()
  if (keyword) {
    result = result.filter(
      (log) =>
        (log.kode && log.kode.toLowerCase().includes(keyword)) ||
        (log.deskripsi && log.deskripsi.toLowerCase().includes(keyword)) ||
        (log.user_nama && log.user_nama.toLowerCase().includes(keyword)) ||
        (log.cabang_nama && log.cabang_nama.toLowerCase().includes(keyword)) ||
        (log.entitas && log.entitas.toLowerCase().includes(keyword)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(keyword))
    )
  }

  // Sort descending by created_at
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (typeof filter.offset === 'number' && filter.offset > 0) {
    result = result.slice(filter.offset)
  }

  if (typeof filter.limit === 'number' && filter.limit > 0) {
    result = result.slice(0, filter.limit)
  }

  return result
}
