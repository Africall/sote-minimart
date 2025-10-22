export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          stock_quantity: number
          cost: number
          price: number
          supplier_id: string
          sku: unknown
          id: string
          name: string
          brand: string
          quantity: number
          unit_of_measure: string
          buying_price: number
          selling_price: number
          category: string
          tax_rate: number
          supplier: string | null
          barcode: string | null
          image_url: string | null
          received_date: string | null
          expiry_date: string | null
          reorder_level: number | null
          inventory_age: number | null
          pack_size: string | null
          is_quick_item: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand: string
          quantity: number
          unit_of_measure: string
          buying_price: number
          selling_price: number
          category: string
          tax_rate: number
          supplier?: string | null
          barcode?: string | null
          image_url?: string | null
          received_date?: string | null
          expiry_date?: string | null
          reorder_level?: number | null
          inventory_age?: number | null
          pack_size?: string | null
          is_quick_item?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string
          quantity?: number
          unit_of_measure?: string
          buying_price?: number
          selling_price?: number
          category?: string
          tax_rate?: number
          supplier?: string | null
          barcode?: string | null
          image_url?: string | null
          received_date?: string | null
          expiry_date?: string | null
          reorder_level?: number | null
          inventory_age?: number | null
          pack_size?: string | null
          is_quick_item?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_stats: {
        Row: {
          id: string
          date: string
          total_sales: number
          total_transactions: number
          average_transaction: number
          items_sold: number
          float_remaining: number
          shift_start: string
          shift_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          total_sales: number
          total_transactions: number
          average_transaction: number
          items_sold: number
          float_remaining: number
          shift_start: string
          shift_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_sales?: number
          total_transactions?: number
          average_transaction?: number
          items_sold?: number
          float_remaining?: number
          shift_start?: string
          shift_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      held_transactions: {
        Row: {
          id: string
          items: Json
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          items: Json
          total: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          items?: Json
          total?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          items: Json
          total_amount: number
          tax_amount: number
          discount_amount: number
          cashier_id: string
          branch_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          items: Json
          total_amount: number
          tax_amount: number
          discount_amount: number
          cashier_id: string
          branch_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          items?: Json
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          cashier_id?: string
          branch_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 