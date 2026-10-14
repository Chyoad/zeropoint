export interface LogAudit {
  id: string
  kode: string
  organisasi_id: string | null
  cabang_id: string | null
  cabang_nama?: string | null
  user_id: string | null
  user_nama?: string | null
  aksi: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADJUST' | string
  entitas: string
  entitas_id: string | null
  tabel_nama: string
  record_id: string | null
  data_lama: Record<string, unknown> | null
  data_baru: Record<string, unknown> | null
  deskripsi: string | null
  ip_address: string | null
  user_agent?: string | null
  created_at: string
}

export interface OpsiFilterLogAudit {
  cabang_id?: string | null
  entitas?: string | null
  aksi?: string | null
  tanggal_mulai?: string | null
  tanggal_selesai?: string | null
  search?: string | null
  pencarian?: string | null
  limit?: number
  offset?: number
}

export function formatBadgeAksi(aksi: string): {
  label: string
  color: string
  bg: string
  border: string
} {
  const norm = (aksi || '').toUpperCase()
  switch (norm) {
    case 'CREATE':
      return {
        label: 'CREATE',
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        border: 'border-emerald-200 dark:border-emerald-800',
      }
    case 'UPDATE':
      return {
        label: 'UPDATE',
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case 'DELETE':
      return {
        label: 'DELETE',
        color: 'text-rose-700 dark:text-rose-300',
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        border: 'border-rose-200 dark:border-rose-800',
      }
    case 'ADJUST':
      return {
        label: 'ADJUST',
        color: 'text-purple-700 dark:text-purple-300',
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        border: 'border-purple-200 dark:border-purple-800',
      }
    default:
      return {
        label: norm || 'UNKNOWN',
        color: 'text-zinc-700 dark:text-zinc-300',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        border: 'border-zinc-200 dark:border-zinc-700',
      }
  }
}
