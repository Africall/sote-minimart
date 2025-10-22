export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounting_periods: {
        Row: {
          end_date: string
          id: string
          locked_at: string | null
          locked_by: string | null
          start_date: string
          status: string
        }
        Insert: {
          end_date: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          start_date: string
          status?: string
        }
        Update: {
          end_date?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          performed_by: string | null
          product_id: string | null
          product_name: string
          quantity: number | null
          remarks: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          id?: string
          performed_by?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number | null
          remarks?: string | null
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          performed_by?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number | null
          remarks?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_recon_lines: {
        Row: {
          bank_recon_id: string | null
          id: string
          journal_line_id: string | null
          mpesa_tx_id: string | null
          note: string | null
          status: string | null
        }
        Insert: {
          bank_recon_id?: string | null
          id?: string
          journal_line_id?: string | null
          mpesa_tx_id?: string | null
          note?: string | null
          status?: string | null
        }
        Update: {
          bank_recon_id?: string | null
          id?: string
          journal_line_id?: string | null
          mpesa_tx_id?: string | null
          note?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_recon_lines_bank_recon_id_fkey"
            columns: ["bank_recon_id"]
            isOneToOne: false
            referencedRelation: "bank_recons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_recon_lines_journal_line_id_fkey"
            columns: ["journal_line_id"]
            isOneToOne: false
            referencedRelation: "journal_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_recon_lines_mpesa_tx_id_fkey"
            columns: ["mpesa_tx_id"]
            isOneToOne: false
            referencedRelation: "mpesa_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_recons: {
        Row: {
          account_code: string
          created_at: string | null
          created_by: string | null
          id: string
          period_end: string
          period_start: string
          status: string | null
        }
        Insert: {
          account_code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          period_end: string
          period_start: string
          status?: string | null
        }
        Update: {
          account_code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          status?: string | null
        }
        Relationships: []
      }
      cart: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_projections: {
        Row: {
          actual_inflow: number | null
          actual_outflow: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          projected_inflow: number
          projected_outflow: number
          updated_at: string
        }
        Insert: {
          actual_inflow?: number | null
          actual_outflow?: number | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          projected_inflow?: number
          projected_outflow?: number
          updated_at?: string
        }
        Update: {
          actual_inflow?: number | null
          actual_outflow?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          projected_inflow?: number
          projected_outflow?: number
          updated_at?: string
        }
        Relationships: []
      }
      cash_reconciliation: {
        Row: {
          cashier_id: string
          created_at: string
          declared_amount: number
          difference: number
          expected_amount: number
          id: string
          notes: string | null
          reconciliation_date: string
          shift_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cashier_id: string
          created_at?: string
          declared_amount?: number
          difference?: number
          expected_amount?: number
          id?: string
          notes?: string | null
          reconciliation_date?: string
          shift_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cashier_id?: string
          created_at?: string
          declared_amount?: number
          difference?: number
          expected_amount?: number
          id?: string
          notes?: string | null
          reconciliation_date?: string
          shift_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_reconciliation_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_reconciliation_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string
          description: string
          id: string
          shift_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string
          description: string
          id?: string
          shift_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string
          description?: string
          id?: string
          shift_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          balance: number
          created_at: string | null
          credit_limit: number
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          credit_limit?: number
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          credit_limit?: number
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string
          date: string
          id: string
          total_expenses: number
          total_sales: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          total_expenses: number
          total_sales: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          total_expenses?: number
          total_sales?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          receipt_url: string | null
          recorded_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      held_transactions: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          status: string | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          items: Json
          status?: string | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          status?: string | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_snapshots: {
        Row: {
          as_of_date: string
          created_at: string | null
          id: string
          notes: string | null
          snapshot_data: Json | null
          total_cost: number
          valuation_method: string
        }
        Insert: {
          as_of_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          snapshot_data?: Json | null
          total_cost?: number
          valuation_method?: string
        }
        Update: {
          as_of_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          snapshot_data?: Json | null
          total_cost?: number
          valuation_method?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          recorded_by: string | null
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          recorded_by?: string | null
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          amount_paid: number
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          invoice_file_url: string | null
          issue_date: string
          outstanding_balance: number
          payment_terms: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          supplier_invoice_number: string | null
          supplier_name: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id: string
          invoice_file_url?: string | null
          issue_date: string
          outstanding_balance?: number
          payment_terms?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          supplier_name: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          invoice_file_url?: string | null
          issue_date?: string
          outstanding_balance?: number
          payment_terms?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          supplier_name?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string | null
          cr: number
          created_at: string | null
          dr: number
          id: string
          journal_id: string | null
          meta: Json | null
        }
        Insert: {
          account_id?: string | null
          cr?: number
          created_at?: string | null
          dr?: number
          id?: string
          journal_id?: string | null
          meta?: Json | null
        }
        Update: {
          account_id?: string | null
          cr?: number
          created_at?: string | null
          dr?: number
          id?: string
          journal_id?: string | null
          meta?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journals"
            referencedColumns: ["id"]
          },
        ]
      }
      journals: {
        Row: {
          id: string
          jdate: string
          locked: boolean
          memo: string | null
          posted_at: string | null
          posted_by: string | null
          ref: string | null
          source: string | null
          source_id: string | null
        }
        Insert: {
          id?: string
          jdate?: string
          locked?: boolean
          memo?: string | null
          posted_at?: string | null
          posted_by?: string | null
          ref?: string | null
          source?: string | null
          source_id?: string | null
        }
        Update: {
          id?: string
          jdate?: string
          locked?: boolean
          memo?: string | null
          posted_at?: string | null
          posted_by?: string | null
          ref?: string | null
          source?: string | null
          source_id?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      mpesa_transactions: {
        Row: {
          account: string | null
          amount: number
          created_at: string | null
          id: string
          matched_sale_id: string | null
          posted_at: string | null
          raw_payload: Json | null
          sender: string | null
          status: string | null
          tx_ref: string | null
          type: string | null
        }
        Insert: {
          account?: string | null
          amount: number
          created_at?: string | null
          id?: string
          matched_sale_id?: string | null
          posted_at?: string | null
          raw_payload?: Json | null
          sender?: string | null
          status?: string | null
          tx_ref?: string | null
          type?: string | null
        }
        Update: {
          account?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          matched_sale_id?: string | null
          posted_at?: string | null
          raw_payload?: Json | null
          sender?: string | null
          status?: string | null
          tx_ref?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_matched_sale_id_fkey"
            columns: ["matched_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string
          delivery_fee: number
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          items: Json
          order_status: string
          payment_method: string
          payment_status: string
          promo_discount: number
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          delivery_address: string
          delivery_fee?: number
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          items: Json
          order_status?: string
          payment_method?: string
          payment_status?: string
          promo_discount?: number
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          delivery_address?: string
          delivery_fee?: number
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          items?: Json
          order_status?: string
          payment_method?: string
          payment_status?: string
          promo_discount?: number
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string[] | null
          category: string
          cost: number
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          price: number
          reorder_level: number | null
          sku: string | null
          stock_quantity: number
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string[] | null
          category: string
          cost: number
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          price: number
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string[] | null
          category?: string
          cost?: number
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          price?: number
          reorder_level?: number | null
          sku?: string | null
          stock_quantity?: number
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dark_mode_preference: boolean | null
          id: string
          last_sign_in_at: string | null
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dark_mode_preference?: boolean | null
          id: string
          last_sign_in_at?: string | null
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dark_mode_preference?: boolean | null
          id?: string
          last_sign_in_at?: string | null
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          purchase_id: string | null
          qty: number
          unit_cost: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_id?: string | null
          qty: number
          unit_cost: number
          vat_rate?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchase_id?: string | null
          qty?: number
          unit_cost?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invoice_date: string
          invoice_no: string | null
          status: string
          supplier_id: string | null
          total_amount: number
          vat_amount: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_date: string
          invoice_no?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          vat_amount?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cashier_id: string | null
          created_at: string
          id: string
          payment_method: string
          payment_status: string
          profile_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string
          id?: string
          payment_method: string
          payment_status?: string
          profile_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          cashier_id?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          payment_status?: string
          profile_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_summary: {
        Row: {
          created_at: string
          id: string
          summary_date: string
          total_discounts: number | null
          total_refunds: number | null
          total_sales: number
          total_transactions: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary_date?: string
          total_discounts?: number | null
          total_refunds?: number | null
          total_sales: number
          total_transactions?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          summary_date?: string
          total_discounts?: number | null
          total_refunds?: number | null
          total_sales?: number
          total_transactions?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          delivery_time: string
          file_format: string
          frequency: string
          id: string
          last_sent_at: string | null
          name: string
          next_scheduled_at: string | null
          recipients: string[]
          report_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          delivery_time?: string
          file_format?: string
          frequency: string
          id?: string
          last_sent_at?: string | null
          name: string
          next_scheduled_at?: string | null
          recipients: string[]
          report_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          delivery_time?: string
          file_format?: string
          frequency?: string
          id?: string
          last_sent_at?: string | null
          name?: string
          next_scheduled_at?: string | null
          recipients?: string[]
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          card_sales: number
          cash_sales: number
          cashier_id: string
          counted_cash: number | null
          created_at: string
          drops: number
          end_time: string | null
          float_amount: number
          id: string
          location_id: string | null
          mpesa_sales: number
          over_short: number | null
          payouts: number
          start_time: string
          updated_at: string
        }
        Insert: {
          card_sales?: number
          cash_sales?: number
          cashier_id: string
          counted_cash?: number | null
          created_at?: string
          drops?: number
          end_time?: string | null
          float_amount?: number
          id?: string
          location_id?: string | null
          mpesa_sales?: number
          over_short?: number | null
          payouts?: number
          start_time?: string
          updated_at?: string
        }
        Update: {
          card_sales?: number
          cash_sales?: number
          cashier_id?: string
          counted_cash?: number | null
          created_at?: string
          drops?: number
          end_time?: string | null
          float_amount?: number
          id?: string
          location_id?: string | null
          mpesa_sales?: number
          over_short?: number | null
          payouts?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_audit: {
        Row: {
          change_amount: number | null
          change_type: string | null
          id: string
          new_quantity: number | null
          notes: string | null
          old_quantity: number | null
          performed_at: string | null
          performed_by: string | null
          product_id: string | null
        }
        Insert: {
          change_amount?: number | null
          change_type?: string | null
          id?: string
          new_quantity?: number | null
          notes?: string | null
          old_quantity?: number | null
          performed_at?: string | null
          performed_by?: string | null
          product_id?: string | null
        }
        Update: {
          change_amount?: number | null
          change_type?: string | null
          id?: string
          new_quantity?: number | null
          notes?: string | null
          old_quantity?: number | null
          performed_at?: string | null
          performed_by?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_audit_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_moves: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          location_id: string | null
          move_type: string | null
          product_id: string | null
          qty: number
          ref_id: string | null
          ref_type: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          move_type?: string | null
          product_id?: string | null
          qty: number
          ref_id?: string | null
          ref_type?: string | null
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          location_id?: string | null
          move_type?: string | null
          product_id?: string | null
          qty?: number
          ref_id?: string | null
          ref_type?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string
          id: string
          payment_type: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string
          id?: string
          payment_type?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string
          id?: string
          payment_type?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_cashier"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      units_of_measure: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      cashier_product_sales: {
        Row: {
          cashier_id: string | null
          cashier_name: string | null
          product_id: string | null
          product_name: string | null
          revenue: number | null
          total_quantity: number | null
          units_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_analysis: {
        Row: {
          avg_valid_price: number | null
          category: string | null
          max_price: number | null
          min_valid_price: number | null
          total_products: number | null
          valid_price_count: number | null
          zero_price_count: number | null
          zero_price_percentage: number | null
        }
        Relationships: []
      }
      price_management_overview: {
        Row: {
          description: string | null
          metric: string | null
          value: string | null
        }
        Relationships: []
      }
      v_locked_ranges: {
        Row: {
          end_date: string | null
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          start_date?: string | null
        }
        Relationships: []
      }
      v_trial_balance: {
        Row: {
          balance: number | null
          code: string | null
          cr: number | null
          dr: number | null
          name: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_payment: {
        Args: {
          amount_param: number
          method_param: string
          mpesa_ref?: string
          ref_param?: string
          sale_id_param: string
        }
        Returns: Json
      }
      apply_price_suggestions: {
        Args: { dry_run?: boolean }
        Returns: {
          action_taken: string
          new_price: number
          old_price: number
          product_id: string
          product_name: string
        }[]
      }
      bulk_update_zero_prices: {
        Args: { dry_run?: boolean; target_category?: string }
        Returns: {
          action_taken: string
          category: string
          new_price: number
          old_price: number
          product_id: string
          product_name: string
          update_reason: string
        }[]
      }
      close_shift: {
        Args: { counted_cash_param: number; shift_id_param: string }
        Returns: Json
      }
      close_shift_journal: {
        Args: { p_counted_cash: number; p_shift_id: string }
        Returns: string
      }
      complete_ecommerce_order: {
        Args: { order_id_param: string }
        Returns: Json
      }
      create_pricing_template: {
        Args: {
          base_price: number
          category_name: string
          markup_percentage?: number
        }
        Returns: {
          affected_products: number
          template_price: number
        }[]
      }
      get_detailed_price_analysis: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_valid_price: number
          category: string
          max_price: number
          min_valid_price: number
          suggested_category_price: number
          total_products: number
          valid_price_count: number
          zero_price_count: number
          zero_price_percentage: number
        }[]
      }
      get_payment_summary_by_type: {
        Args: { date_range: string }
        Returns: {
          card: number
          cash: number
          credit: number
          mpesa: number
        }[]
      }
      get_price_suggestions: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          current_price: number
          product_id: string
          product_name: string
          reasoning: string
          suggested_price: number
        }[]
      }
      get_product_sales_with_cashier_breakdown: {
        Args: {
          end_date_param?: string
          product_search?: string
          start_date_param?: string
        }
        Returns: {
          cashier_breakdown: Json
          product_id: string
          product_name: string
          total_revenue: number
          total_sales: number
        }[]
      }
      get_products_needing_reorder: {
        Args: Record<PropertyKey, never>
        Returns: {
          barcode: string[] | null
          category: string
          cost: number
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          price: number
          reorder_level: number | null
          sku: string | null
          stock_quantity: number
          supplier_id: string | null
          updated_at: string | null
        }[]
      }
      get_sales_summary: {
        Args: { end_date: string; start_date: string }
        Returns: {
          total_discounts: number
          total_refunds: number
          total_sales: number
          total_transactions: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      post_expense_journal: {
        Args: { p_expense_id: string }
        Returns: string
      }
      post_sale_journal: {
        Args: { p_sale_id: string }
        Returns: string
      }
      process_purchase: {
        Args: { purchase_id_param: string }
        Returns: Json
      }
      record_invoice_payment: {
        Args: {
          invoice_id_param: string
          notes_param?: string
          payment_amount: number
          payment_date_param?: string
          payment_method_param?: string
          reference_number_param?: string
        }
        Returns: Json
      }
      search_products: {
        Args: { search: string }
        Returns: {
          barcode: string[] | null
          category: string
          cost: number
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          price: number
          reorder_level: number | null
          sku: string | null
          stock_quantity: number
          supplier_id: string | null
          updated_at: string | null
        }[]
      }
      set_price_validation: {
        Args: { enabled: boolean }
        Returns: undefined
      }
      sync_barcode_stock_manual: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_product_price: {
        Args: { new_price_param: number; product_id_param: string }
        Returns: Json
      }
      update_product_stock: {
        Args: { product_id_param: string; quantity_change: number }
        Returns: Json
      }
      update_stock_quantity_from_barcode_length: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      v_balance_sheet: {
        Args: { p_asof: string }
        Returns: {
          amount: number
          code: string
          name: string
          section: string
        }[]
      }
      v_cashbook: {
        Args: { p_account_code: string; p_end: string; p_start: string }
        Returns: {
          balance: number
          cr: number
          dr: number
          memo: string
          ref: string
          tx_date: string
        }[]
      }
      v_income_statement: {
        Args: { p_end: string; p_start: string }
        Returns: {
          amount: number
          code: string
          name: string
          section: string
        }[]
      }
      v_vat_return: {
        Args: { p_end: string; p_start: string }
        Returns: {
          amount: number
          code: string
          name: string
          side: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "cashier" | "inventory" | "accountant" | "user"
      payment_method: "cash" | "card" | "mobile_money"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      user_role: "admin" | "cashier" | "inventory" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cashier", "inventory", "accountant", "user"],
      payment_method: ["cash", "card", "mobile_money"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      user_role: ["admin", "cashier", "inventory", "accountant"],
    },
  },
} as const
