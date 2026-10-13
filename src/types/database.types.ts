export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TipeCabang = 'pusat' | 'cabang' | 'gudang'
export type RolePengguna = 'superadmin' | 'hq_manager' | 'branch_manager' | 'staff' | 'viewer'
export type TipeProduk = 'persediaan' | 'non_persediaan' | 'jasa' | 'paket'
export type MetodeValuasi = 'rata_rata' | 'fifo'
export type JenisMutasiStok =
  | 'saldo_awal'
  | 'masuk_pembelian'
  | 'keluar_penjualan'
  | 'penyesuaian_masuk'
  | 'penyesuaian_keluar'
  | 'keluar_paket'
  | 'retur_masuk'
  | 'retur_keluar'
export type TipePenyesuaianStok = 'saldo_awal' | 'opname' | 'koreksi'
export type StatusPenyesuaianStok = 'draft' | 'selesai' | 'dibatalkan'
export type JenisUrutanKode = 'tanpa_reset' | 'harian'

export interface Database {
  public: {
    Tables: {
      urutan_kode: {
        Row: {
          id: string
          kode: string
          prefix: string
          jenis: JenisUrutanKode
          tanggal: string | null
          nomor_terakhir: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kode: string
          prefix: string
          jenis: JenisUrutanKode
          tanggal?: string | null
          nomor_terakhir?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kode?: string
          prefix?: string
          jenis?: JenisUrutanKode
          tanggal?: string | null
          nomor_terakhir?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organisasi: {
        Row: {
          id: string
          kode: string
          nama: string
          logo_url: string | null
          pengaturan: Json
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          nama: string
          logo_url?: string | null
          pengaturan?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          nama?: string
          logo_url?: string | null
          pengaturan?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: []
      }
      cabang: {
        Row: {
          id: string
          kode: string
          organisasi_id: string
          nama: string
          tipe: TipeCabang
          alamat: string | null
          kota: string | null
          telepon: string | null
          is_aktif: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          organisasi_id: string
          nama: string
          tipe?: TipeCabang
          alamat?: string | null
          kota?: string | null
          telepon?: string | null
          is_aktif?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          organisasi_id?: string
          nama?: string
          tipe?: TipeCabang
          alamat?: string | null
          kota?: string | null
          telepon?: string | null
          is_aktif?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cabang_organisasi_id_fkey'
            columns: ['organisasi_id']
            isOneToOne: false
            referencedRelation: 'organisasi'
            referencedColumns: ['id']
          }
        ]
      }
      user_profile: {
        Row: {
          id: string
          kode: string
          organisasi_id: string
          user_id: string
          email: string
          nama_lengkap: string
          role: RolePengguna
          avatar_url: string | null
          telepon: string | null
          is_aktif: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          organisasi_id: string
          user_id: string
          email: string
          nama_lengkap: string
          role?: RolePengguna
          avatar_url?: string | null
          telepon?: string | null
          is_aktif?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          organisasi_id?: string
          user_id?: string
          email?: string
          nama_lengkap?: string
          role?: RolePengguna
          avatar_url?: string | null
          telepon?: string | null
          is_aktif?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_profile_organisasi_id_fkey'
            columns: ['organisasi_id']
            isOneToOne: false
            referencedRelation: 'organisasi'
            referencedColumns: ['id']
          }
        ]
      }
      user_cabang: {
        Row: {
          id: string
          kode: string
          user_profile_id: string
          cabang_id: string
          is_default: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          user_profile_id: string
          cabang_id: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          user_profile_id?: string
          cabang_id?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_cabang_user_profile_id_fkey'
            columns: ['user_profile_id']
            isOneToOne: false
            referencedRelation: 'user_profile'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_cabang_cabang_id_fkey'
            columns: ['cabang_id']
            isOneToOne: false
            referencedRelation: 'cabang'
            referencedColumns: ['id']
          }
        ]
      }
      kategori_produk: {
        Row: {
          id: string
          kode: string
          organisasi_id: string
          nama: string
          keterangan: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          organisasi_id: string
          nama: string
          keterangan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          organisasi_id?: string
          nama?: string
          keterangan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'kategori_produk_organisasi_id_fkey'
            columns: ['organisasi_id']
            isOneToOne: false
            referencedRelation: 'organisasi'
            referencedColumns: ['id']
          }
        ]
      }
      produk: {
        Row: {
          id: string
          kode: string
          organisasi_id: string
          kategori_produk_id: string | null
          nama: string
          tipe_produk: TipeProduk
          metode_valuasi: MetodeValuasi
          harga_pokok_standar: number
          harga_beli_terakhir: number
          peringatan_stok_minimum: number
          dapat_dijual: boolean
          dapat_dibeli: boolean
          gambar_url: string | null
          deskripsi: string | null
          is_aktif: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          organisasi_id: string
          kategori_produk_id?: string | null
          nama: string
          tipe_produk?: TipeProduk
          metode_valuasi?: MetodeValuasi
          harga_pokok_standar?: number
          harga_beli_terakhir?: number
          peringatan_stok_minimum?: number
          dapat_dijual?: boolean
          dapat_dibeli?: boolean
          gambar_url?: string | null
          deskripsi?: string | null
          is_aktif?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          organisasi_id?: string
          kategori_produk_id?: string | null
          nama?: string
          tipe_produk?: TipeProduk
          metode_valuasi?: MetodeValuasi
          harga_pokok_standar?: number
          harga_beli_terakhir?: number
          peringatan_stok_minimum?: number
          dapat_dijual?: boolean
          dapat_dibeli?: boolean
          gambar_url?: string | null
          deskripsi?: string | null
          is_aktif?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'produk_organisasi_id_fkey'
            columns: ['organisasi_id']
            isOneToOne: false
            referencedRelation: 'organisasi'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'produk_kategori_produk_id_fkey'
            columns: ['kategori_produk_id']
            isOneToOne: false
            referencedRelation: 'kategori_produk'
            referencedColumns: ['id']
          }
        ]
      }
      satuan_produk: {
        Row: {
          id: string
          kode: string
          produk_id: string
          nama_satuan: string
          rasio_ke_dasar: number
          is_satuan_dasar: boolean
          barcode: string | null
          harga_jual_default: number
          harga_jual_grosir: number
          harga_jual_member: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          produk_id: string
          nama_satuan: string
          rasio_ke_dasar?: number
          is_satuan_dasar?: boolean
          barcode?: string | null
          harga_jual_default?: number
          harga_jual_grosir?: number
          harga_jual_member?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          produk_id?: string
          nama_satuan?: string
          rasio_ke_dasar?: number
          is_satuan_dasar?: boolean
          barcode?: string | null
          harga_jual_default?: number
          harga_jual_grosir?: number
          harga_jual_member?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'satuan_produk_produk_id_fkey'
            columns: ['produk_id']
            isOneToOne: false
            referencedRelation: 'produk'
            referencedColumns: ['id']
          }
        ]
      }
      komponen_paket: {
        Row: {
          id: string
          kode: string
          paket_id: string
          produk_komponen_id: string
          satuan_produk_id: string | null
          kuantitas: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          paket_id: string
          produk_komponen_id: string
          satuan_produk_id?: string | null
          kuantitas?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          paket_id?: string
          produk_komponen_id?: string
          satuan_produk_id?: string | null
          kuantitas?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'komponen_paket_paket_id_fkey'
            columns: ['paket_id']
            isOneToOne: false
            referencedRelation: 'produk'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'komponen_paket_produk_komponen_id_fkey'
            columns: ['produk_komponen_id']
            isOneToOne: false
            referencedRelation: 'produk'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'komponen_paket_satuan_produk_id_fkey'
            columns: ['satuan_produk_id']
            isOneToOne: false
            referencedRelation: 'satuan_produk'
            referencedColumns: ['id']
          }
        ]
      }
      stok_produk: {
        Row: {
          id: string
          kode: string
          produk_id: string
          cabang_id: string
          kuantitas: number
          kuantitas_tersedia: number
          kuantitas_tertahan: number
          hpp_rata_rata: number
          total_nilai: number
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          produk_id: string
          cabang_id: string
          kuantitas?: number
          kuantitas_tersedia?: number
          kuantitas_tertahan?: number
          hpp_rata_rata?: number
          total_nilai?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          produk_id?: string
          cabang_id?: string
          kuantitas?: number
          kuantitas_tersedia?: number
          kuantitas_tertahan?: number
          hpp_rata_rata?: number
          total_nilai?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stok_produk_produk_id_fkey'
            columns: ['produk_id']
            isOneToOne: false
            referencedRelation: 'produk'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stok_produk_cabang_id_fkey'
            columns: ['cabang_id']
            isOneToOne: false
            referencedRelation: 'cabang'
            referencedColumns: ['id']
          }
        ]
      }
      kartu_stok: {
        Row: {
          id: string
          kode: string
          cabang_id: string
          produk_id: string
          tanggal: string
          jenis_mutasi: JenisMutasiStok
          nomor_referensi: string | null
          referensi_id: string | null
          satuan_produk_id: string | null
          kuantitas_transaksi: number
          faktor_konversi: number
          kuantitas_masuk: number
          kuantitas_keluar: number
          sisa_kuantitas: number
          harga_satuan: number
          total_nilai_masuk: number
          total_nilai_keluar: number
          saldo_nilai: number
          hpp_rata_rata: number
          batch_nomor: string | null
          tanggal_kadaluarsa: string | null
          kartu_stok_masuk_id: string | null
          catatan: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          cabang_id: string
          produk_id: string
          tanggal?: string
          jenis_mutasi: JenisMutasiStok
          nomor_referensi?: string | null
          referensi_id?: string | null
          satuan_produk_id?: string | null
          kuantitas_transaksi?: number
          faktor_konversi?: number
          kuantitas_masuk?: number
          kuantitas_keluar?: number
          sisa_kuantitas?: number
          harga_satuan?: number
          total_nilai_masuk?: number
          total_nilai_keluar?: number
          saldo_nilai?: number
          hpp_rata_rata?: number
          batch_nomor?: string | null
          tanggal_kadaluarsa?: string | null
          kartu_stok_masuk_id?: string | null
          catatan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          cabang_id?: string
          produk_id?: string
          tanggal?: string
          jenis_mutasi?: JenisMutasiStok
          nomor_referensi?: string | null
          referensi_id?: string | null
          satuan_produk_id?: string | null
          kuantitas_transaksi?: number
          faktor_konversi?: number
          kuantitas_masuk?: number
          kuantitas_keluar?: number
          sisa_kuantitas?: number
          harga_satuan?: number
          total_nilai_masuk?: number
          total_nilai_keluar?: number
          saldo_nilai?: number
          hpp_rata_rata?: number
          batch_nomor?: string | null
          tanggal_kadaluarsa?: string | null
          kartu_stok_masuk_id?: string | null
          catatan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'kartu_stok_cabang_id_fkey'
            columns: ['cabang_id']
            isOneToOne: false
            referencedRelation: 'cabang'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kartu_stok_produk_id_fkey'
            columns: ['produk_id']
            isOneToOne: false
            referencedRelation: 'produk'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kartu_stok_satuan_produk_id_fkey'
            columns: ['satuan_produk_id']
            isOneToOne: false
            referencedRelation: 'satuan_produk'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kartu_stok_kartu_stok_masuk_id_fkey'
            columns: ['kartu_stok_masuk_id']
            isOneToOne: false
            referencedRelation: 'kartu_stok'
            referencedColumns: ['id']
          }
        ]
      }
      penyesuaian_stok: {
        Row: {
          id: string
          kode: string
          cabang_id: string
          tanggal: string
          tipe_penyesuaian: TipePenyesuaianStok
          status: StatusPenyesuaianStok
          catatan: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          cabang_id: string
          tanggal?: string
          tipe_penyesuaian: TipePenyesuaianStok
          status?: StatusPenyesuaianStok
          catatan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          cabang_id?: string
          tanggal?: string
          tipe_penyesuaian?: TipePenyesuaianStok
          status?: StatusPenyesuaianStok
          catatan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'penyesuaian_stok_cabang_id_fkey'
            columns: ['cabang_id']
            isOneToOne: false
            referencedRelation: 'cabang'
            referencedColumns: ['id']
          }
        ]
      }
      penyesuaian_stok_item: {
        Row: {
          id: string
          kode: string
          penyesuaian_stok_id: string
          produk_id: string
          satuan_produk_id: string | null
          stok_buku: number
          stok_fisik: number
          selisih: number
          harga_satuan: number
          total_nilai_penyesuaian: number
          alasan: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          penyesuaian_stok_id: string
          produk_id: string
          satuan_produk_id?: string | null
          stok_buku?: number
          stok_fisik?: number
          selisih?: number
          harga_satuan?: number
          total_nilai_penyesuaian?: number
          alasan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          penyesuaian_stok_id?: string
          produk_id?: string
          satuan_produk_id?: string | null
          stok_buku?: number
          stok_fisik?: number
          selisih?: number
          harga_satuan?: number
          total_nilai_penyesuaian?: number
          alasan?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'penyesuaian_stok_item_penyesuaian_stok_id_fkey'
            columns: ['penyesuaian_stok_id']
            isOneToOne: false
            referencedRelation: 'penyesuaian_stok'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'penyesuaian_stok_item_produk_id_fkey'
            columns: ['produk_id']
            isOneToOne: false
            referencedRelation: 'produk'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'penyesuaian_stok_item_satuan_produk_id_fkey'
            columns: ['satuan_produk_id']
            isOneToOne: false
            referencedRelation: 'satuan_produk'
            referencedColumns: ['id']
          }
        ]
      }
      log_audit: {
        Row: {
          id: string
          kode: string
          organisasi_id: string | null
          cabang_id: string | null
          user_id: string | null
          tabel_nama: string
          record_id: string | null
          aksi: string
          data_lama: Json | null
          data_baru: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          kode: string
          organisasi_id?: string | null
          cabang_id?: string | null
          user_id?: string | null
          tabel_nama: string
          record_id?: string | null
          aksi: string
          data_lama?: Json | null
          data_baru?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          kode?: string
          organisasi_id?: string | null
          cabang_id?: string | null
          user_id?: string | null
          tabel_nama?: string
          record_id?: string | null
          aksi?: string
          data_lama?: Json | null
          data_baru?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'log_audit_organisasi_id_fkey'
            columns: ['organisasi_id']
            isOneToOne: false
            referencedRelation: 'organisasi'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'log_audit_cabang_id_fkey'
            columns: ['cabang_id']
            isOneToOne: false
            referencedRelation: 'cabang'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buat_kode: {
        Args: {
          p_prefix: string
          p_panjang?: number
          p_jenis?: string
          p_tanggal?: string
        }
        Returns: string
      }
      sinkron_urutan_kode: {
        Args: {
          p_nama_tabel: string
          p_kolom_kode: string
          p_prefix: string
          p_jenis?: string
          p_tanggal?: string
        }
        Returns: number
      }
      is_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_branch_access: {
        Args: {
          target_cabang_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      tipe_cabang: TipeCabang
      role_pengguna: RolePengguna
      tipe_produk: TipeProduk
      metode_valuasi: MetodeValuasi
      jenis_mutasi_stok: JenisMutasiStok
      tipe_penyesuaian_stok: TipePenyesuaianStok
      status_penyesuaian_stok: StatusPenyesuaianStok
      jenis_urutan_kode: JenisUrutanKode
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience Types
export type Tables<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Row']

export type TablesInsert<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Insert']

export type TablesUpdate<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Update']

// Explicit Domain Aliases
export type UrutanKode = Tables<'urutan_kode'>
export type Organisasi = Tables<'organisasi'>
export type Cabang = Tables<'cabang'>
export type UserProfile = Tables<'user_profile'>
export type UserCabang = Tables<'user_cabang'>
export type KategoriProduk = Tables<'kategori_produk'>
export type Produk = Tables<'produk'>
export type SatuanProduk = Tables<'satuan_produk'>
export type KomponenPaket = Tables<'komponen_paket'>
export type StokProduk = Tables<'stok_produk'>
export type KartuStok = Tables<'kartu_stok'>
export type PenyesuaianStok = Tables<'penyesuaian_stok'>
export type PenyesuaianStokItem = Tables<'penyesuaian_stok_item'>
export type LogAudit = Tables<'log_audit'>
